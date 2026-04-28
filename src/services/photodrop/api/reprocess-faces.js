import { createClient } from '@supabase/supabase-js'
import { processImage } from './faceProcessor.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server supabase key' })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    try {
        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '')
        if (!token) return res.status(401).json({ error: 'Missing access token' })

        const { data: userData, error: userError } = await supabase.auth.getUser(token)
        if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' })
        const user = userData.user

        const { event_id } = req.body || {}
        if (!event_id) return res.status(400).json({ error: 'Missing event_id' })

        // fetch event and verify ownership
        const { data: evs, error: evErr } = await supabase.from('events').select('*').eq('id', event_id).limit(1)
        if (evErr) return res.status(500).json({ error: evErr.message })
        const ev = evs && evs[0]
        if (!ev) return res.status(404).json({ error: 'Event not found' })
        if (ev.created_by !== user.id) return res.status(403).json({ error: 'Only the event owner can reprocess faces' })

        // get all images for this event
        const { data: images, error: imgErr } = await supabase.from('images').select('id').eq('event_id', event_id)
        if (imgErr) return res.status(500).json({ error: imgErr.message })
        if (!images || images.length === 0) return res.status(200).json({ success: true, message: 'No images to reprocess', total: 0 })

        const imageIds = images.map(i => i.id)

        // delete existing face_embeddings for all images in this event
        const { error: embDelErr } = await supabase.from('face_embeddings').delete().in('image_id', imageIds)
        if (embDelErr) console.warn('[reprocess-faces] failed to delete embeddings', embDelErr.message)

        // delete existing persons for this event (they will be re-created during processing)
        const { error: persDelErr } = await supabase.from('persons').delete().eq('event_id', event_id)
        if (persDelErr) console.warn('[reprocess-faces] failed to delete persons', persDelErr.message)

        // reset processed flag on all images
        const { error: resetErr } = await supabase.from('images').update({ processed: false, processed_at: null, processed_count: 0 }).eq('event_id', event_id)
        if (resetErr) console.warn('[reprocess-faces] failed to reset images', resetErr.message)

        // delete any existing face_jobs for this event's images and create new ones
        await supabase.from('face_jobs').delete().in('image_id', imageIds)

        const jobRows = imageIds.map(image_id => ({ image_id, event_id, status: 'pending' }))
        const { data: jobs } = await supabase.from('face_jobs').insert(jobRows).select()

        // fire-and-forget: start processing each image in the background
        const jobMap = {}
        if (jobs) {
            for (const j of jobs) jobMap[j.image_id] = j.id
        }

        for (const image_id of imageIds) {
            processImage(image_id, jobMap[image_id] || null).catch(err => {
                console.warn('[reprocess-faces] background processing failed for image', image_id, err?.message || err)
            })
        }

        return res.status(200).json({ success: true, total: imageIds.length, message: `Reprocessing ${imageIds.length} image(s) for faces` })
    } catch (err) {
        console.error('[reprocess-faces] unexpected error', err?.message || String(err))
        return res.status(500).json({ error: String(err) })
    }
}
