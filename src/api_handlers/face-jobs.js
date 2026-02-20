import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Server not configured' })

    try {
        const { event_id } = req.query || {}
        if (!event_id) return res.status(400).json({ error: 'Missing event_id' })

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        // fetch recent jobs for the event and compute counts
        const { data: jobs } = await supabase
            .from('face_jobs')
            .select('id,status,created_at,started_at,finished_at,image_id,result,images(*)')
            .eq('event_id', event_id)
            .order('created_at', { ascending: false })
            .limit(50)

        const counts = { pending: 0, processing: 0, done: 0, failed: 0 }
        if (jobs && jobs.length) {
            for (const j of jobs) {
                const s = (j.status || 'pending')
                if (counts[s] !== undefined) counts[s]++
            }
        }

        return res.status(200).json({ data: { counts, jobs } })
    } catch (err) {
        console.error('[api/face-jobs] error', err)
        return res.status(500).json({ error: String(err) })
    }
}
