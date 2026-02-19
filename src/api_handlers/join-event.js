import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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

        const { event_id } = req.body || {}
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

        return res.status(200).json({ success: true })
    } catch (err) {
        console.error('[api/join-event] unexpected', err?.message || String(err))
        return res.status(500).json({ error: String(err) })
    }
}
