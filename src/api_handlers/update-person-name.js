import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
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

        const { event_id, person_id, name } = req.body || {}
        if (!event_id || !person_id || typeof name !== 'string') return res.status(400).json({ error: 'event_id, person_id, name required' })

        // Check if user is a participant
        const { data: eventPersons, error: eventPersonsError } = await serverSupabase
            .from('event_persons')
            .select('user_id')
            .eq('event_id', event_id)
        if (eventPersonsError) return res.status(500).json({ error: eventPersonsError.message })
        const isParticipant = (eventPersons || []).some(ep => ep.user_id === userData.user.id)
        if (!isParticipant) return res.status(403).json({ error: 'Forbidden: not a participant' })

        // Update person name
        const { data, error } = await serverSupabase
            .from('persons')
            .update({ name })
            .eq('id', person_id)
            .eq('event_id', event_id)
            .select()
        if (error) return res.status(500).json({ error: error.message })
        return res.status(200).json({ data })
    } catch (err) {
        console.error('[api/update-person-name] error', err)
        return res.status(500).json({ error: String(err) })
    }
}
