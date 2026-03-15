import { createClient } from '@supabase/supabase-js'
import { saveBoard, getBoard, deleteBoard } from '../services/clipboardGithubStorage.js'
import { assignPublicCode } from '../services/publicCodeService.js'
import {
    deleteClipboardBoardMeta,
    findClipboardBoard,
    isValidClipboardBoardType,
    normalizeClipboardBoardId,
    normalizeClipboardBoardType,
    sanitizePrivateClipboardBoardId
} from './clipboardBoardStore.js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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
            const { code, board, password, type } = req.query || {}
            if (type && !isValidClipboardBoardType(type)) {
                return res.status(400).json({ error: 'Invalid board type' })
            }
            const boardType = code
                ? 'public'
                : normalizeClipboardBoardType(type, 'private')
            const boardId = normalizeClipboardBoardId(code || board)

            if (!boardId) return res.status(400).json({ error: 'Missing code or board parameter' })

            // Check metadata in Supabase
            const meta = await findClipboardBoard(supabase, { boardId, type: boardType })

            if (!meta) return res.status(404).json({ error: 'Board not found' })

            // Check expiration
            if (meta.expires_at && new Date(meta.expires_at) < new Date()) {
                // Board expired — clean up
                try {
                    await deleteBoard(boardId, meta.type)
                } catch (cleanupError) {
                    console.warn('[api/clipboard] Failed to delete expired board content', boardId, meta.type, cleanupError)
                }
                await deleteClipboardBoardMeta(supabase, { boardId, type: meta.type })
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
            const boardData = await getBoard(boardId, meta.type)
            if (!boardData) return res.status(404).json({ error: 'Board content not found' })

            // Burn after read — delete after successful retrieval
            if (meta.burn_after_read) {
                try {
                    await deleteBoard(boardId, meta.type)
                } catch (cleanupError) {
                    console.warn('[api/clipboard] Failed to delete burn-after-read board content', boardId, meta.type, cleanupError)
                }
                await deleteClipboardBoardMeta(supabase, { boardId, type: meta.type })
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

            if (!isValidClipboardBoardType(type)) {
                return res.status(400).json({ error: 'Invalid board type' })
            }
            const boardType = normalizeClipboardBoardType(type)

            let boardId = requestedBoardId
            let isUpdate = false

            if (boardType === 'public') {
                boardId = normalizeClipboardBoardId(boardId)
                if (boardId) {
                    // Check if this board exists (update scenario)
                    const existing = await findClipboardBoard(supabase, {
                        boardId,
                        type: 'public',
                        columns: 'id'
                    })

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
                boardId = sanitizePrivateClipboardBoardId(boardId)
                if (!boardId) {
                    return res.status(400).json({ error: 'Private board name is invalid after sanitization' })
                }

                // Check if already exists
                const existing = await findClipboardBoard(supabase, {
                    boardId,
                    type: 'private',
                    columns: 'id'
                })

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
            await saveBoard(boardId, content, { language, type: boardType }, boardType)

            // Upsert metadata in Supabase
            const metaRow = {
                id: boardId,
                type: boardType,
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
                .upsert(metaRow, { onConflict: 'type,id' })

            if (upsertError) {
                console.error('Supabase upsert error', upsertError)
                return res.status(500).json({ error: 'Failed to save board metadata' })
            }

            return res.status(isUpdate ? 200 : 201).json({
                data: { id: boardId, type: boardType, isUpdate }
            })
        }

        // ── DELETE: Delete a board ──
        if (req.method === 'DELETE') {
            const { board, code, type } = req.query || {}
            if (type && !isValidClipboardBoardType(type)) {
                return res.status(400).json({ error: 'Invalid board type' })
            }
            const boardType = code
                ? 'public'
                : normalizeClipboardBoardType(type, 'private')
            const boardId = normalizeClipboardBoardId(code || board)

            if (!boardId) return res.status(400).json({ error: 'Missing board/code parameter' })

            // Look up metadata to determine which branch to delete from
            const delMeta = await findClipboardBoard(supabase, {
                boardId,
                type: boardType,
                columns: 'type'
            })
            const delType = delMeta?.type || boardType

            try { await deleteBoard(boardId, delType) } catch (e) { console.warn('GitHub delete failed', e) }
            await deleteClipboardBoardMeta(supabase, { boardId, type: delType })

            return res.status(200).json({ success: true })
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (err) {
        console.error('[api/clipboard] error', err)
        return res.status(500).json({ error: err.message || String(err) })
    }
}
