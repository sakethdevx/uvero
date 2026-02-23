import { createClient } from '@supabase/supabase-js'
import { saveBoard, getBoard, deleteBoard } from '../services/clipboardGithubStorage.js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const MAX_PUBLIC_CODES = 10000 // 0000–9999

/**
 * Generate a random 4-digit code not already in use.
 * If all codes are used, recycle the oldest one (LRU).
 */
async function assignPublicCode() {
    // Count existing public boards
    const { count } = await supabase
        .from('clipboard_boards')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'public')

    if (count >= MAX_PUBLIC_CODES) {
        // LRU: find the oldest public board and recycle it
        const { data: oldest } = await supabase
            .from('clipboard_boards')
            .select('id')
            .eq('type', 'public')
            .order('updated_at', { ascending: true })
            .limit(1)

        if (oldest && oldest.length > 0) {
            const recycledCode = oldest[0].id
            // Delete old content from GitHub
            try { await deleteBoard(recycledCode) } catch (e) { console.warn('Failed to delete recycled board from GitHub', e) }
            // Delete old row
            await supabase.from('clipboard_boards').delete().eq('id', recycledCode)
            return recycledCode
        }
    }

    // Generate a random 4-digit code not in use
    const { data: existingCodes } = await supabase
        .from('clipboard_boards')
        .select('id')
        .eq('type', 'public')

    const usedSet = new Set((existingCodes || []).map(r => r.id))

    // Try random codes until we find an unused one
    let attempts = 0
    while (attempts < 100) {
        const code = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
        if (!usedSet.has(code)) return code
        attempts++
    }

    // Fallback: linear scan for any free code
    for (let i = 0; i < MAX_PUBLIC_CODES; i++) {
        const code = String(i).padStart(4, '0')
        if (!usedSet.has(code)) return code
    }

    throw new Error('No available codes')
}

/**
 * Hash a password for board protection
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
}

export default async function handler(req, res) {
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server config' })

    try {
        // ── GET: Retrieve a board ──
        if (req.method === 'GET') {
            const { code, board, password } = req.query || {}
            const boardId = code || board
            if (!boardId) return res.status(400).json({ error: 'Missing code or board parameter' })

            // Check metadata in Supabase
            const { data: meta } = await supabase
                .from('clipboard_boards')
                .select('*')
                .eq('id', boardId)
                .single()

            if (!meta) return res.status(404).json({ error: 'Board not found' })

            // Check expiration
            if (meta.expires_at && new Date(meta.expires_at) < new Date()) {
                // Board expired — clean up
                try { await deleteBoard(boardId) } catch (e) { }
                await supabase.from('clipboard_boards').delete().eq('id', boardId)
                return res.status(410).json({ error: 'Board has expired' })
            }

            // Check password
            if (meta.has_password && meta.password_hash) {
                if (!password) {
                    return res.status(403).json({ error: 'Password required', needsPassword: true })
                }
                if (hashPassword(password) !== meta.password_hash) {
                    return res.status(403).json({ error: 'Wrong password', needsPassword: true })
                }
            }

            // Fetch content from GitHub
            const boardData = await getBoard(boardId)
            if (!boardData) return res.status(404).json({ error: 'Board content not found' })

            // Burn after read — delete after successful retrieval
            if (meta.burn_after_read) {
                try { await deleteBoard(boardId) } catch (e) { }
                await supabase.from('clipboard_boards').delete().eq('id', boardId)
            }

            return res.status(200).json({
                data: {
                    id: boardId,
                    content: boardData.content,
                    type: meta.type,
                    language: meta.language || 'plaintext',
                    burn_after_read: meta.burn_after_read,
                    expires_at: meta.expires_at,
                    has_password: meta.has_password,
                    created_at: meta.created_at,
                    updated_at: meta.updated_at
                }
            })
        }

        // ── POST: Create or update a board ──
        if (req.method === 'POST') {
            const { content, boardId: requestedBoardId, type = 'public', language = 'plaintext',
                password, burnAfterRead = false, expiresIn } = req.body || {}

            if (content === undefined || content === null) {
                return res.status(400).json({ error: 'Missing content' })
            }

            let boardId = requestedBoardId
            let isUpdate = false

            if (type === 'public') {
                if (boardId) {
                    // Check if this board exists (update scenario)
                    const { data: existing } = await supabase
                        .from('clipboard_boards')
                        .select('id')
                        .eq('id', boardId)
                        .eq('type', 'public')
                        .single()

                    if (existing) {
                        isUpdate = true
                    } else {
                        // Board doesn't exist, assign a new code
                        boardId = await assignPublicCode()
                    }
                } else {
                    boardId = await assignPublicCode()
                }
            } else {
                // Private board
                if (!boardId || boardId.length < 1) {
                    return res.status(400).json({ error: 'Private boards require a boardId (name)' })
                }
                // Sanitize board name
                boardId = boardId.toLowerCase().replace(/[^a-z0-9\-_]/g, '-').slice(0, 100)

                // Check if already exists
                const { data: existing } = await supabase
                    .from('clipboard_boards')
                    .select('id')
                    .eq('id', boardId)
                    .single()

                if (existing) isUpdate = true
            }

            // Calculate expiration
            let expiresAt = null
            if (expiresIn) {
                const now = new Date()
                const durations = { '1h': 3600, '24h': 86400, '7d': 604800, '30d': 2592000 }
                const seconds = durations[expiresIn]
                if (seconds) expiresAt = new Date(now.getTime() + seconds * 1000).toISOString()
            }

            // Save content to GitHub
            await saveBoard(boardId, content, { language, type })

            // Upsert metadata in Supabase
            const metaRow = {
                id: boardId,
                type,
                language,
                has_password: !!password,
                password_hash: password ? hashPassword(password) : null,
                burn_after_read: burnAfterRead,
                expires_at: expiresAt,
                updated_at: new Date().toISOString(),
                ...(isUpdate ? {} : { created_at: new Date().toISOString() })
            }

            const { error: upsertError } = await supabase
                .from('clipboard_boards')
                .upsert(metaRow, { onConflict: 'id' })

            if (upsertError) {
                console.error('Supabase upsert error', upsertError)
                return res.status(500).json({ error: 'Failed to save board metadata' })
            }

            return res.status(isUpdate ? 200 : 201).json({
                data: { id: boardId, type, isUpdate }
            })
        }

        // ── DELETE: Delete a board ──
        if (req.method === 'DELETE') {
            const { board, code } = req.query || {}
            const boardId = board || code
            if (!boardId) return res.status(400).json({ error: 'Missing board/code parameter' })

            try { await deleteBoard(boardId) } catch (e) { console.warn('GitHub delete failed', e) }
            await supabase.from('clipboard_boards').delete().eq('id', boardId)

            return res.status(200).json({ success: true })
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (err) {
        console.error('[api/clipboard] error', err)
        return res.status(500).json({ error: err.message || String(err) })
    }
}
