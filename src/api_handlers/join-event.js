import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function base64UrlDecode(str) {
    // restore padding
    str = str.replace(/-/g, '+').replace(/_/g, '/')
    while (str.length % 4) str += '='
    return Buffer.from(str, 'base64').toString('utf8')
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server supabase key' })

    try {
        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '')
        if (!token) return res.status(401).json({ error: 'Missing access token' })

        const { data: userData, error: userError } = await serverSupabase.auth.getUser(token)
        if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' })
        const user = userData.user

        let { event_id, invite_token } = req.body || {}

        if (!event_id && invite_token) {
            // validate token signature and expiry
            try {
                const parts = invite_token.split('.')
                if (parts.length !== 2) return res.status(400).json({ error: 'Invalid invite token' })
                const [payloadB64, sig] = parts
                const hmac = crypto.createHmac('sha256', SUPABASE_SERVICE_KEY)
                hmac.update(payloadB64)
                const expected = hmac.digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
                if (sig !== expected) return res.status(400).json({ error: 'Invalid invite token signature' })
                const payloadStr = base64UrlDecode(payloadB64)
                const payload = JSON.parse(payloadStr)
                const now = Math.floor(Date.now() / 1000)
                if (payload.exp && payload.exp < now) return res.status(400).json({ error: 'Invite token expired' })
                event_id = payload.event_id
            } catch (e) {
                console.error('[api/join-event] token parse error', e?.message || String(e))
                return res.status(400).json({ error: 'Invalid invite token' })
            }
        }

        if (!event_id) return res.status(400).json({ error: 'Missing event_id' })

        // ensure event exists
        const { data: evs, error: evErr } = await serverSupabase.from('events').select('*').eq('id', event_id).limit(1)
        if (evErr) return res.status(500).json({ error: evErr.message })
        const ev = evs && evs[0]
        if (!ev) return res.status(404).json({ error: 'Event not found' })

        // insert into participants if not exists
        const { data, error } = await serverSupabase.from('participants').insert([{ event_id, user_id: user.id }]).select()
        if (error) {
            // if unique constraint or duplicate, return success
            console.warn('[api/join-event] insert error', error.message)
        }

        return res.status(200).json({ success: true, event_id })
    } catch (err) {
        console.error('[api/join-event] unexpected', err?.message || String(err))
        return res.status(500).json({ error: String(err) })
    }
}
