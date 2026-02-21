import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/')
    while (str.length % 4) str += '='
    return Buffer.from(str, 'base64').toString('utf8')
}

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server supabase key' })

    try {
        const token = req.query.token
        if (!token) return res.status(400).json({ error: 'Missing token' })

        const parts = token.split('.')
        if (parts.length !== 2) return res.status(400).json({ error: 'Invalid token' })
        const [payloadB64, sig] = parts
        const hmac = crypto.createHmac('sha256', SUPABASE_SERVICE_KEY)
        hmac.update(payloadB64)
        const expected = hmac.digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        if (sig !== expected) return res.status(400).json({ error: 'Invalid token signature' })

        const payloadStr = base64UrlDecode(payloadB64)
        const payload = JSON.parse(payloadStr)
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) return res.status(400).json({ error: 'Invite token expired' })

        const event_id = payload.event_id
        if (!event_id) return res.status(400).json({ error: 'Invalid token payload' })

        // fetch event details
        const { data: evs, error: evErr } = await serverSupabase.from('events').select('*').eq('id', event_id).limit(1)
        if (evErr) return res.status(500).json({ error: evErr.message })
        const ev = evs && evs[0]
        if (!ev) return res.status(404).json({ error: 'Event not found' })

        const inviterId = ev.created_by
        let inviter = { id: inviterId }
        try {
            // try to get inviter email via admin API (may fail if not available)
            if (serverSupabase.auth && serverSupabase.auth.admin && serverSupabase.auth.admin.getUserById) {
                const { data: userRec } = await serverSupabase.auth.admin.getUserById(inviterId)
                if (userRec && userRec.email) inviter.email = userRec.email
            }
        } catch (e) {
            // ignore
        }

        return res.status(200).json({ event: { id: ev.id, event_name: ev.event_name }, inviter })
    } catch (err) {
        console.error('[api/invite-info] unexpected', err?.message || String(err))
        return res.status(500).json({ error: String(err) })
    }
}
