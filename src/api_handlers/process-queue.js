import { createClient } from '@supabase/supabase-js'
import { getImageBuffer } from '../../src/services/githubStorage.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const HF_SPACE_URL = process.env.HF_SPACE_URL

const THRESHOLD = 0.35

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !HF_SPACE_URL) return res.status(500).json({ error: 'Server not configured' })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    try {
        // Fetch a batch of pending jobs
        const { data: jobs } = await supabase.from('face_jobs').select('*').eq('status', 'pending').order('created_at', { ascending: true }).limit(10)
        if (!jobs || jobs.length === 0) return res.status(200).json({ processed: 0 })

        const results = []

        for (const job of jobs) {
            // try to atomically claim the job
            const { data: claimed } = await supabase
                .from('face_jobs')
                .update({ status: 'processing', started_at: new Date().toISOString() })
                .match({ id: job.id, status: 'pending' })
                .select()

            if (!claimed || claimed.length === 0) {
                // someone else claimed it
                continue
            }

            const imageId = job.image_id

            try {
                const { data: image, error: imgErr } = await supabase.from('images').select('*').eq('id', imageId).single()
                if (imgErr || !image) {
                    await supabase.from('face_jobs').update({ status: 'failed', finished_at: new Date().toISOString(), result: JSON.stringify({ error: 'Image not found' }) }).eq('id', job.id)
                    continue
                }

                const buffer = await getImageBuffer(image.github_path, image.event_id)

                const hfRes = await fetch(`${HF_SPACE_URL}/detect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/octet-stream' },
                    body: buffer
                })

                if (!hfRes.ok) {
                    const body = await hfRes.text()
                    console.error('[process-queue] HF error', hfRes.status, body)
                    await supabase.from('face_jobs').update({ status: 'failed', finished_at: new Date().toISOString(), result: JSON.stringify({ status: hfRes.status, body: body.slice(0, 1000) }) }).eq('id', job.id)
                    continue
                }

                const faces = await hfRes.json()

                const processed = []

                for (const face of faces) {
                    const embedding = face.embedding

                    const { data: nearest, error: searchErr } = await supabase.rpc('match_face', {
                        query_embedding: embedding,
                        match_event_id: image.event_id,
                        match_threshold: THRESHOLD,
                        match_count: 1
                    })

                    let person_id
                    if (!searchErr && nearest && nearest.length > 0) {
                        person_id = nearest[0].person_id
                    } else {
                        const { data: newPerson, error: personErr } = await supabase.from('persons').insert({ event_id: image.event_id }).select().single()
                        if (personErr) continue
                        person_id = newPerson.id
                    }

                    await supabase.from('face_embeddings').insert({ person_id, image_id: imageId, descriptor: embedding })

                    processed.push({ person_id, box: face.box })
                }

                await supabase.from('face_jobs').update({ status: 'done', finished_at: new Date().toISOString(), result: JSON.stringify({ processed_count: processed.length, processed }) }).eq('id', job.id)
                results.push({ job: job.id, processed: processed.length })
            } catch (e) {
                console.error('[process-queue] job processing failed', e)
                await supabase.from('face_jobs').update({ status: 'failed', finished_at: new Date().toISOString(), result: JSON.stringify({ error: String(e).slice(0, 1000) }) }).eq('id', job.id)
            }
        }

        return res.status(200).json({ processed: results.length, results })
    } catch (err) {
        console.error('[process-queue] crash', err)
        return res.status(500).json({ error: String(err) })
    }
}
