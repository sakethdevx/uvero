import { createClient } from '@supabase/supabase-js'
import { saveBoard } from '../services/clipboardGithubStorage.js'
import { assignPublicCode } from '../services/publicCodeService.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const MAX_CONTENT_BYTES = 1024 * 1024 // 1 MB

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ success: false, error: 'Missing server config' })

    try {
        const { content, type = 'public' } = req.body || {}

        if (typeof content !== 'string') {
            return res.status(400).json({ success: false, error: 'content must be a string' })
        }
        if (content.trim() === '') {
            return res.status(400).json({ success: false, error: 'content must not be empty' })
        }
        if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) {
            return res.status(400).json({ success: false, error: 'content exceeds 1 MB limit' })
        }
        if (type !== 'public') {
            return res.status(400).json({ success: false, error: 'Use /api/clipboard/board/send for private boards' })
        }

        const code = await assignPublicCode()

        await saveBoard(code, content, { type: 'public' }, 'public')

        const { error: upsertError } = await supabase.from('clipboard_boards').upsert({
            id: code,
            type: 'public',
            language: 'plaintext',
            has_password: false,
            password_hash: null,
            burn_after_read: false,
            expires_at: null,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        }, { onConflict: 'id' })

        if (upsertError) {
            console.error('[cli-send] Supabase upsert error', upsertError)
            return res.status(500).json({ success: false, error: 'Failed to save board metadata' })
        }

        const proto = req.headers['x-forwarded-proto'] || 'https'
        const host = req.headers.host || 'uvero.com'

        return res.status(201).json({
            success: true,
            data: {
                code,
                url: `${proto}://${host}/${code}`
            }
        })
    } catch (err) {
        console.error('[api/clipboard/send] error', err)
        return res.status(500).json({ success: false, error: err.message || String(err) })
    }
}
