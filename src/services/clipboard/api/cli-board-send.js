import { createClient } from '@supabase/supabase-js'
import { saveBoard } from '../services/clipboardGithubStorage.js'
import {
    applyClipboardBoardFilters,
    findClipboardBoard,
    normalizeClipboardBoardId
} from './clipboardBoardStore.js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ success: false, error: 'Missing server config' })

    try {
        const { board, content, password } = req.body || {}

        if (!board) return res.status(400).json({ success: false, error: 'Missing board' })
        if (!/^[a-z0-9]{4}-[a-z0-9]{3}$/.test(board.toLowerCase())) {
            return res.status(400).json({ success: false, error: 'Invalid board name format (expected xxxx-xxx)' })
        }
        if (content === undefined || content === null) return res.status(400).json({ success: false, error: 'Missing content' })

        const boardId = normalizeClipboardBoardId(board)

        const meta = await findClipboardBoard(supabase, { boardId, type: 'private' })

        if (!meta) return res.status(404).json({ success: false, error: 'Board not found' })

        if (meta.has_password && meta.password_hash) {
            if (!password) return res.status(403).json({ success: false, error: 'Password required' })
            if (hashPassword(password) !== meta.password_hash) {
                return res.status(403).json({ success: false, error: 'Wrong password' })
            }
        }

        await saveBoard(boardId, content, { type: meta.type }, meta.type)

        const { error: updateError } = await applyClipboardBoardFilters(
            supabase.from('clipboard_boards').update({ updated_at: new Date().toISOString() }),
            { boardId, type: 'private' }
        )

        if (updateError) {
            console.error('[cli-board-send] Supabase update error', updateError)
            return res.status(500).json({ success: false, error: 'Failed to update board metadata' })
        }

        return res.status(200).json({ success: true, data: { board: boardId } })
    } catch (err) {
        console.error('[api/clipboard/board/send] error', err)
        return res.status(500).json({ success: false, error: err.message || String(err) })
    }
}
