import { createClient } from '@supabase/supabase-js'
import { deleteBoard } from '../services/clipboardGithubStorage.js'
import { deleteClipboardBoardMeta } from './clipboardBoardStore.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server config' })

    try {
        // Query expired boards from Supabase
        const { data: expiredBoards, error } = await supabase
            .from('clipboard_boards')
            .select('id, type')
            .lt('expires_at', new Date().toISOString())

        if (error) throw error

        const cleaned = []
        const failures = []

        if (expiredBoards && expiredBoards.length > 0) {
            for (const board of expiredBoards) {
                try {
                    // 1. Delete content from GitHub storage first
                    await deleteBoard(board.id, board.type)
                    // 2. Delete metadata row from Supabase
                    await deleteClipboardBoardMeta(supabase, { boardId: board.id, type: board.type })
                    cleaned.push({ id: board.id, type: board.type })
                } catch (err) {
                    console.error(`[cleanup] Failed to delete board ${board.id} (${board.type}):`, err)
                    failures.push({ id: board.id, type: board.type, error: err.message || String(err) })
                }
            }
        }

        return res.status(200).json({
            success: true,
            cleanedCount: cleaned.length,
            failuresCount: failures.length,
            cleaned,
            failures
        })
    } catch (err) {
        console.error('[cleanup] Main handler error:', err)
        return res.status(500).json({ error: String(err?.message || err) })
    }
}
