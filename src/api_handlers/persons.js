import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server supabase key' })

    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Missing access token' })

    const { data: userData, error: userError } = await serverSupabase.auth.getUser(token)
    if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' })

    const { method } = req
    if (method === 'GET') {
        const { event_id } = req.query || {}
        if (!event_id) return res.status(400).json({ error: 'event_id required' })
        const { data, error } = await serverSupabase.from('persons').select('*').eq('event_id', event_id)
        if (error) return res.status(500).json({ error: error.message })

        // Optionally attach a representative thumbnail image_id for each person
        try {
            const personIds = (data || []).map(p => p.id)
            let emb = []
            if (personIds.length) {
                const { data: embData, error: embErr } = await serverSupabase
                    .from('face_embeddings')
                    .select('person_id, image_id, created_at, box')
                    .in('person_id', personIds)
                    .order('created_at', { ascending: false })
                if (embErr) throw embErr
                emb = embData || []
            }
            const thumbByPerson = {}
            for (const row of emb) {
                if (!thumbByPerson[row.person_id]) thumbByPerson[row.person_id] = { image_id: row.image_id, box: row.box }
            }

            const augmented = (data || []).map(p => ({
                ...p,
                thumbnail_image_id: thumbByPerson[p.id] ? thumbByPerson[p.id].image_id : null,
                thumbnail_box: thumbByPerson[p.id] ? thumbByPerson[p.id].box : null
            }))
            return res.status(200).json({ data: augmented })
        } catch (e) {
            console.warn('[api/persons] thumbnail lookup failed', e?.message || String(e))
            return res.status(200).json({ data })
        }
    }

    return res.status(405).json({ error: 'Method not allowed' })
}
