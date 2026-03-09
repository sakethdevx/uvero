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

        const { event_id, person_id_keep, person_id_merge } = req.body || {}
        if (!event_id || !person_id_keep || !person_id_merge) {
            return res.status(400).json({ error: 'event_id, person_id_keep, and person_id_merge are required' })
        }
        if (person_id_keep === person_id_merge) {
            return res.status(400).json({ error: 'Cannot merge a person with themselves' })
        }

        // Allow merge if the requester is the event owner or a participant
        const { data: evRows, error: evErr } = await serverSupabase
            .from('events')
            .select('created_by')
            .eq('id', event_id)
            .limit(1)
        if (evErr) return res.status(500).json({ error: evErr.message })
        const eventRow = evRows?.[0]
        if (!eventRow) return res.status(404).json({ error: 'Event not found' })
        const isOwner = eventRow.created_by === userData.user.id

        const { data: parts, error: partsErr } = await serverSupabase
            .from('participants')
            .select('user_id')
            .eq('event_id', event_id)
            .eq('user_id', userData.user.id)
            .limit(1)
        if (partsErr) return res.status(500).json({ error: partsErr.message })
        const isParticipant = (parts || []).length > 0

        if (!isOwner && !isParticipant) return res.status(403).json({ error: 'Forbidden: not a participant or owner' })

        // Verify both persons belong to this event
        const { data: personsRows, error: personsErr } = await serverSupabase
            .from('persons')
            .select('id')
            .eq('event_id', event_id)
            .in('id', [person_id_keep, person_id_merge])
        if (personsErr) return res.status(500).json({ error: personsErr.message })
        if (!personsRows || personsRows.length < 2) {
            return res.status(404).json({ error: 'One or both persons not found in this event' })
        }

        // Move all face embeddings from person_id_merge to person_id_keep
        const { data: updatedEmbeddings, error: updateErr } = await serverSupabase
            .from('face_embeddings')
            .update({ person_id: person_id_keep })
            .eq('person_id', person_id_merge)
            .select('id')
        if (updateErr) return res.status(500).json({ error: updateErr.message })
        const mergedEmbeddingsCount = (updatedEmbeddings || []).length

        // Delete the merged (secondary) person record
        const { error: deleteErr } = await serverSupabase
            .from('persons')
            .delete()
            .eq('id', person_id_merge)
            .eq('event_id', event_id)
        if (deleteErr) return res.status(500).json({ error: deleteErr.message })

        return res.status(200).json({ data: { kept: person_id_keep, merged: person_id_merge, merged_embeddings_count: mergedEmbeddingsCount } })
    } catch (err) {
        console.error('[api/merge-persons] error', err)
        return res.status(500).json({ error: String(err) })
    }
}
