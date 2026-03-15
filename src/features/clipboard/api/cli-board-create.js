import { createClient } from '@supabase/supabase-js'
import { findClipboardBoard } from './clipboardBoardStore.js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function generateBoardName() {
    const part1 = crypto.randomBytes(2).toString('hex') // 4 hex chars e.g. "a3f2"
    const part2 = crypto.randomBytes(2).toString('hex').slice(0, 3) // 3 hex chars e.g. "c4d"
    return `${part1}-${part2}`
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ success: false, error: 'Missing server config' })

    try {
        const { password } = req.body || {}

        // Generate a unique board name
        let board = null
        for (let i = 0; i < 10; i++) {
            const candidate = generateBoardName()
            const existing = await findClipboardBoard(supabase, {
                boardId: candidate,
                type: 'private',
                columns: 'id'
            })
            if (!existing) {
                board = candidate
                break
            }
        }

        if (!board) {
            return res.status(500).json({ success: false, error: 'Failed to generate unique board name' })
        }

        const { error: insertError } = await supabase.from('clipboard_boards').insert({
            id: board,
            type: 'private',
            language: 'plaintext',
            has_password: !!password,
            password_hash: password ? hashPassword(password) : null,
            burn_after_read: false,
            expires_at: null,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        })

        if (insertError) {
            console.error('[cli-board-create] Supabase insert error', insertError)
            return res.status(500).json({ success: false, error: 'Failed to create board' })
        }

        return res.status(201).json({ success: true, data: { board } })
    } catch (err) {
        console.error('[api/clipboard/board/create] error', err)
        return res.status(500).json({ success: false, error: err.message || String(err) })
    }
}
