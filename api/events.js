// API endpoints for event creation and listing
import { createClient } from '@supabase/supabase-js'
import { createBranch } from '../src/services/githubStorage.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
    const { method } = req
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server supabase key' })

    // Temporary debug logging (safe: do NOT print secret values)
    let user = null
    try {
        console.log('[api/events] incoming', { method, url: req.url })
        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '')
        const tokenPresent = Boolean(token)
        const masked = tokenPresent ? `${token.slice(0, 6)}...${token.slice(-4)}` : null
        console.log('[api/events] auth header present:', tokenPresent, 'masked:', masked)

        if (!token) return res.status(401).json({ error: 'Missing access token' })

        // Validate user with Supabase using the provided access token
        const { data: userData, error: userError } = await serverSupabase.auth.getUser(token)
        if (userError || !userData?.user) {
            console.log('[api/events] supabase getUser failed', { message: userError?.message })
            return res.status(401).json({ error: 'Invalid token' })
        }
        user = userData.user
        console.log('[api/events] authenticated user id:', user?.id)
    } catch (dbgErr) {
        console.error('[api/events] debug logging error:', dbgErr?.message || String(dbgErr))
    }

    try {
        if (method === 'POST') {
            const payload = req.body
            const { event_name, description, event_date } = payload || {}
            if (!event_name) return res.status(400).json({ error: 'event_name required' })

            const { data, error } = await serverSupabase
                .from('events')
                .insert([{ event_name, description, event_date, created_by: user.id }])
                .select()

            // create a dedicated branch for this event to store images
            try {
                const newEvent = data?.[0]
                if (newEvent && newEvent.id) {
                    const branchName = newEvent.id
                    console.log('[api/events] creating branch for event', branchName)
                    await createBranch(branchName)
                    console.log('[api/events] branch created', branchName)
                }
            } catch (branchErr) {
                console.error('[api/events] failed to create branch for event', branchErr?.message || String(branchErr))
                // don't fail the event creation if branch creation fails; surface warning in response
            }

            if (error) return res.status(500).json({ error: error.message })
            return res.status(200).json({ data: data[0] })
        }

        if (method === 'GET') {
            const { event_id } = req.query || {}
            if (event_id) {
                // Return event metadata and images if user is owner or participant
                const { data: evs, error: evErr } = await serverSupabase.from('events').select('*').eq('id', event_id).limit(1)
                if (evErr) return res.status(500).json({ error: evErr.message })
                const event = evs && evs[0]
                if (!event) return res.status(404).json({ error: 'Event not found' })

                // check if user is owner
                const isOwner = event.created_by === user.id
                // check participants table
                const { data: parts } = await serverSupabase.from('participants').select('*').eq('event_id', event_id).eq('user_id', user.id).limit(1)
                const isParticipant = (parts && parts.length > 0)
                if (!isOwner && !isParticipant) return res.status(403).json({ error: 'Forbidden' })

                const { data, error } = await serverSupabase
                    .from('images')
                    .select('*')
                    .eq('event_id', event_id)
                    .order('uploaded_at', { ascending: false })

                if (error) return res.status(500).json({ error: error.message })
                return res.status(200).json({ data: { event, images: data, isOwner, isParticipant } })
            }

            // list events for current user: events they created or joined
            const { data: ownEvents, error: ownErr } = await serverSupabase.from('events').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
            if (ownErr) return res.status(500).json({ error: ownErr.message })
            const { data: joinedRows } = await serverSupabase.from('participants').select('event_id').eq('user_id', user.id)
            const joinedIds = (joinedRows || []).map(r => r.event_id).filter(Boolean)
            let joinedEvents = []
            if (joinedIds.length) {
                const { data: je, error: jeErr } = await serverSupabase.from('events').select('*').in('id', joinedIds).order('created_at', { ascending: false })
                if (jeErr) return res.status(500).json({ error: jeErr.message })
                joinedEvents = je || []
            }

            // merge and dedupe
            const events = [...ownEvents, ...joinedEvents].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i)
            return res.status(200).json({ data: events })
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (err) {
        return res.status(500).json({ error: err.message || String(err) })
    }
}
