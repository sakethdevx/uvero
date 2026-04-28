import { createClient } from '@supabase/supabase-js'
import { deleteBoard, getBoard } from '../services/clipboardGithubStorage.js'
import {
    deleteClipboardBoardMeta,
    findClipboardBoard,
    normalizeClipboardBoardId
} from './clipboardBoardStore.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ success: false, error: 'Missing server config' })

    try {
        const code = normalizeClipboardBoardId(req.query.code)
        if (!code) return res.status(400).json({ success: false, error: 'Missing code' })

        const meta = await findClipboardBoard(supabase, { boardId: code, type: 'public' })

        if (!meta) return res.status(404).json({ success: false, error: 'Board not found' })

        if (meta.expires_at && new Date(meta.expires_at) < new Date()) {
            try { await deleteBoard(code, 'public') } catch (e) { console.warn('[cli-get] GitHub delete failed for expired board', code, e) }
            await deleteClipboardBoardMeta(supabase, { boardId: code, type: 'public' })
            return res.status(410).json({ success: false, error: 'Board has expired' })
        }

        const boardData = await getBoard(code, meta.type)
        if (!boardData) return res.status(404).json({ success: false, error: 'Board content not found' })

        return res.status(200).json({
            success: true,
            data: { code, content: boardData.content }
        })
    } catch (err) {
        console.error('[api/clipboard/get] error', err)
        return res.status(500).json({ success: false, error: err.message || String(err) })
    }
}
