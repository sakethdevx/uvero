import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
// optional dedicated secret for invite tokens
const INVITE_SECRET = process.env.INVITE_SECRET
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function base64UrlEncode(buf) {
    return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
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

        const { event_id, expires_in = 24 * 3600 } = req.body || {}
        if (!event_id) return res.status(400).json({ error: 'Missing event_id' })

        // ensure event exists and user is owner or participant
        const { data: evs, error: evErr } = await serverSupabase.from('events').select('*').eq('id', event_id).limit(1)
        if (evErr) return res.status(500).json({ error: evErr.message })
        const ev = evs && evs[0]
        if (!ev) return res.status(404).json({ error: 'Event not found' })

        // only event owner can create invites
        const isOwner = ev.created_by === user.id
        if (!isOwner) return res.status(403).json({ error: 'Forbidden' })

        const now = Math.floor(Date.now() / 1000)
        const payload = { event_id, iat: now, exp: now + Number(expires_in) }
        const payloadStr = JSON.stringify(payload)
        const payloadB64 = base64UrlEncode(payloadStr)

        const HMAC_KEY = INVITE_SECRET || SUPABASE_SERVICE_KEY
        if (!INVITE_SECRET) console.warn('[api/create-invite] using SUPABASE_SERVICE_KEY for invite HMAC; consider setting INVITE_SECRET')
        const hmac = crypto.createHmac('sha256', HMAC_KEY)
        hmac.update(payloadB64)
        const sig = base64UrlEncode(hmac.digest())
        const tokenStr = `${payloadB64}.${sig}`

        // fetch event details for response
        let event = null
        try {
            const { data: evs, error: evErr } = await serverSupabase.from('events').select('*').eq('id', event_id).limit(1)
            if (!evErr && evs && evs[0]) event = { id: evs[0].id, event_name: evs[0].event_name }
        } catch (e) {
            console.warn('[api/create-invite] failed to fetch event', e?.message || String(e))
        }

        const inviter = { id: user.id, email: user.email }

        return res.status(200).json({ token: tokenStr, event, inviter })
    } catch (err) {
        console.error('[api/create-invite] unexpected', err?.message || String(err))
        return res.status(500).json({ error: String(err) })
    }
}
