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
        const { data: jobs, error: joinErr } = await supabase
            .from('face_jobs')
            .select('id,status,created_at,started_at,finished_at,image_id,result,images(*)')
            .eq('event_id', event_id)
            .order('created_at', { ascending: false })
            .limit(50)

        // If join returned nothing or errored, try a plain jobs fetch for diagnostics
        let debugJobs = null
        if ((!jobs || jobs.length === 0) && !joinErr) {
            const { data: plainJobs, error: plainErr } = await supabase.from('face_jobs').select('*').eq('event_id', event_id).order('created_at', { ascending: false }).limit(200)
            if (plainErr) console.warn('[api/face-jobs] plain jobs fetch error', plainErr)
            debugJobs = plainJobs || []
        }

        const counts = { pending: 0, processing: 0, done: 0, failed: 0 }
        const sourceJobs = (jobs && jobs.length) ? jobs : (debugJobs || [])
        if (sourceJobs && sourceJobs.length) {
            for (const j of sourceJobs) {
                const s = (j.status || 'pending')
                if (counts[s] !== undefined) counts[s]++
            }
        }

        return res.status(200).json({ data: { counts, jobs: sourceJobs, debug: { joinErr: joinErr || null, debugJobsCount: (debugJobs && debugJobs.length) || 0 } } })
    } catch (err) {
        console.error('[api/face-jobs] error', err)
        return res.status(500).json({ error: String(err) })
    }
}
