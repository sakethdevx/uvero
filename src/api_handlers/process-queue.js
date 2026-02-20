import { createClient } from '@supabase/supabase-js'
import { processImage } from '../lib/faceProcessor.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Server not configured' })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    try {
        // Fetch a batch of pending  jobs
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

            if (!claimed || claimed.length === 0) continue

            try {
                const r = await processImage(job.image_id, job.id)
                results.push({ job: job.id, processed: r.processed_count })
            } catch (e) {
                console.error('[process-queue] job processing failed', e)
                await supabase.from('face_jobs').update({ status: 'failed', finished_at: new Date().toISOString(), result: JSON.stringify({ error: String(e).slice(0, 1000), hf: e?.hfBody ? String(e.hfBody).slice(0, 1000) : undefined }) }).eq('id', job.id)
            }
        }

        return res.status(200).json({ processed: results.length, results })
    } catch (err) {
        console.error('[process-queue] crash', err)
        return res.status(500).json({ error: String(err) })
    }
}
