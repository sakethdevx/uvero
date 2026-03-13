import { createClient } from '@supabase/supabase-js'
import { getBoard, deleteBoard } from '../services/clipboardGithubStorage.js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
}

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ success: false, error: 'Missing server config' })

    try {
        const boardId = (req.query.board || '').toLowerCase()
        if (!boardId) return res.status(400).json({ success: false, error: 'Missing board' })

        const { data: meta } = await supabase
            .from('clipboard_boards')
            .select('*')
            .eq('id', boardId)
            .single()

        if (!meta) return res.status(404).json({ success: false, error: 'Board not found' })

        if (meta.expires_at && new Date(meta.expires_at) < new Date()) {
            try { await deleteBoard(boardId, meta.type) } catch (e) { console.warn('[cli-board-get] GitHub delete failed for expired board', boardId, e) }
            await supabase.from('clipboard_boards').delete().eq('id', boardId)
            return res.status(410).json({ success: false, error: 'Board has expired' })
        }

        if (meta.has_password && meta.password_hash) {
            const { password } = req.query
            if (!password) {
                return res.status(200).json({ success: true, data: { requiresPassword: true } })
            }
            if (hashPassword(password) !== meta.password_hash) {
                return res.status(403).json({ success: false, error: 'Invalid password' })
            }
        }

        const boardData = await getBoard(boardId, meta.type)
        if (!boardData) return res.status(404).json({ success: false, error: 'Board content not found' })

        if (meta.burn_after_read) {
            try { await deleteBoard(boardId, meta.type) } catch (e) { console.warn('[cli-board-get] GitHub delete failed for burn-after-read board', boardId, e) }
            await supabase.from('clipboard_boards').delete().eq('id', boardId)
        }

        return res.status(200).json({
            success: true,
            data: { content: boardData.content }
        })
    } catch (err) {
        console.error('[api/clipboard/board/get] error', err)
        return res.status(500).json({ success: false, error: err.message || String(err) })
    }
}
