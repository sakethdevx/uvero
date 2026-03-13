import { createClient } from '@supabase/supabase-js'
import { saveBoard, deleteBoard } from '../services/clipboardGithubStorage.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const MAX_PUBLIC_CODES = 10000

async function assignPublicCode() {
    const { count: rawCount } = await supabase
        .from('clipboard_boards')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'public')

    const count = rawCount || 0

    if (count >= MAX_PUBLIC_CODES) {
        const { data: oldest } = await supabase
            .from('clipboard_boards')
            .select('id')
            .eq('type', 'public')
            .order('updated_at', { ascending: true })
            .limit(1)

        if (oldest && oldest.length > 0) {
            const recycledCode = oldest[0].id
            try { await deleteBoard(recycledCode, 'public') } catch (e) { console.warn('[cli-send] Failed to delete recycled board from GitHub', e) }
            await supabase.from('clipboard_boards').delete().eq('id', recycledCode)
            return recycledCode
        }
    }

    const { data: existingCodes } = await supabase
        .from('clipboard_boards')
        .select('id')
        .eq('type', 'public')

    const usedSet = new Set((existingCodes || []).map(r => r.id))

    let attempts = 0
    while (attempts < 100) {
        const code = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
        if (!usedSet.has(code)) return code
        attempts++
    }

    for (let i = 0; i < MAX_PUBLIC_CODES; i++) {
        const code = String(i).padStart(4, '0')
        if (!usedSet.has(code)) return code
    }

    throw new Error('No available codes')
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ success: false, error: 'Missing server config' })

    try {
        const { content, type = 'public' } = req.body || {}

        if (content === undefined || content === null) {
            return res.status(400).json({ success: false, error: 'Missing content' })
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
