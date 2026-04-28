import { createClient } from '@supabase/supabase-js'
import { createBranch } from '../services/photodropGithubStorage.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
    const { method } = req
    if (!SUPABASE_SERVICE_KEY)
        return res.status(500).json({ error: 'Missing server supabase key' })

    let user = null

    try {
        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '')
        if (!token) return res.status(401).json({ error: 'Missing access token' })

        const { data: userData, error: userError } =
            await serverSupabase.auth.getUser(token)

        if (userError || !userData?.user)
            return res.status(401).json({ error: 'Invalid token' })

        user = userData.user
    } catch (err) {
        return res.status(500).json({ error: err.message })
    }

    try {
        // CREATE EVENT
        if (method === 'POST') {
            const { event_name, description, event_date } = req.body || {}
            if (!event_name)
                return res.status(400).json({ error: 'event_name required' })

            const { data, error } = await serverSupabase
                .from('events')
                .insert([{ event_name, description, event_date, created_by: user.id }])
                .select()

            if (error) return res.status(500).json({ error: error.message })

            try {
                const newEvent = data?.[0]
                if (newEvent?.id) await createBranch(newEvent.id)
            } catch (e) {
                console.error('Branch creation failed:', e.message)
            }

            return res.status(200).json({ data: data[0] })
        }

        // LIST EVENTS
        if (method === 'GET') {
            const { event_id } = req.query || {}

            if (event_id) {
                const { data: evs, error: evErr } =
                    await serverSupabase.from('events').select('*').eq('id', event_id).limit(1)

                if (evErr) return res.status(500).json({ error: evErr.message })

                const event = evs?.[0]
                if (!event) return res.status(404).json({ error: 'Event not found' })

                const isOwner = event.created_by === user.id

                const { data: parts } = await serverSupabase
                    .from('participants')
                    .select('*')
                    .eq('event_id', event_id)
                    .eq('user_id', user.id)
                    .limit(1)

                const isParticipant = parts?.length > 0
                if (!isOwner && !isParticipant)
                    return res.status(403).json({ error: 'Forbidden' })

                const { limit = 24, offset = 0 } = req.query || {}
                const limitNum = parseInt(limit, 10)
                const offsetNum = parseInt(offset, 10)

                const { data, error, count } = await serverSupabase
                    .from('images')
                    .select('*', { count: 'exact' })
                    .eq('event_id', event_id)
                    .order('uploaded_at', { ascending: false })
                    .range(offsetNum, offsetNum + limitNum - 1)

                if (error) return res.status(500).json({ error: error.message })

                // Also get total persons count for this event
                const { count: personsCount } = await serverSupabase
                    .from('persons')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', event_id)

                const { count: processedCount } = await serverSupabase
                    .from('images')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', event_id)
                    .eq('processed', true)

                // Attach person_ids to each image using face_embeddings table
                try {
                    const imageIds = (data || []).map(i => i.id)
                    let embeddings = []
                    if (imageIds.length) {
                        const { data: embData, error: embErr } = await serverSupabase
                            .from('face_embeddings')
                            .select('image_id, person_id')
                            .in('image_id', imageIds)
                        if (embErr) throw embErr
                        embeddings = embData || []
                    }

                    const personsByImage = embeddings.reduce((acc, row) => {
                        acc[row.image_id] = acc[row.image_id] || new Set()
                        acc[row.image_id].add(row.person_id)
                        return acc
                    }, {})

                    const imagesWithPersons = (data || []).map(img => ({
                        ...img,
                        person_ids: Array.from((personsByImage[img.id] && personsByImage[img.id]) || [])
                    }))

                    return res.status(200).json({
                        data: {
                            event,
                            images: imagesWithPersons,
                            isOwner,
                            isParticipant,
                            total_images_count: count,
                            total_persons_count: personsCount,
                            processed_images_count: processedCount,
                            has_more: count > (offsetNum + imagesWithPersons.length)
                        }
                    })
                } catch (e) {
                    console.warn('[api/events] failed to attach person ids', e?.message || String(e))
                    // Fallback to returning images without person_ids
                    return res.status(200).json({
                        data: {
                            event,
                            images: data,
                            isOwner,
                            isParticipant,
                            total_images_count: count,
                            total_persons_count: personsCount,
                            processed_images_count: processedCount,
                            has_more: count > (offsetNum + data.length)
                        }
                    })
                }
            }

            const { data: ownEvents, error: ownErr } =
                await serverSupabase.from('events').select('*').eq('created_by', user.id)

            if (ownErr) return res.status(500).json({ error: ownErr.message })

            const { data: joinedRows } =
                await serverSupabase.from('participants').select('event_id').eq('user_id', user.id)

            const joinedIds = (joinedRows || []).map(r => r.event_id)

            let joinedEvents = []
            if (joinedIds.length) {
                const { data: je } =
                    await serverSupabase.from('events').select('*').in('id', joinedIds)
                joinedEvents = je || []
            }

            const events = [...ownEvents, ...joinedEvents].filter(
                (v, i, a) => a.findIndex(x => x.id === v.id) === i
            )

            return res.status(200).json({ data: events })
        }

        // UPDATE EVENT NAME
        if (method === 'PATCH') {
            const { event_id, event_name } = req.body || {}
            if (!event_id || !event_name)
                return res.status(400).json({ error: 'event_id and event_name required' })

            // verify the user is the event creator
            const { data: evs, error: evErr } = await serverSupabase
                .from('events')
                .select('*')
                .eq('id', event_id)
                .limit(1)

            if (evErr) return res.status(500).json({ error: evErr.message })
            const event = evs?.[0]
            if (!event) return res.status(404).json({ error: 'Event not found' })
            if (event.created_by !== user.id)
                return res.status(403).json({ error: 'Only the event creator can rename this event' })

            const { data: updated, error: updateErr } = await serverSupabase
                .from('events')
                .update({ event_name })
                .eq('id', event_id)
                .select()

            if (updateErr) return res.status(500).json({ error: updateErr.message })
            return res.status(200).json({ data: updated?.[0] || null })
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (err) {
        return res.status(500).json({ error: err.message })
    }
}