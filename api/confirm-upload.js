// Confirm upload: create images row after client uploaded to R2
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server supabase key' })

    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Missing access token' })

    const { data: userData, error: userError } = await serverSupabase.auth.getUser(token)
    if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' })
    const user = userData.user

    const { event_id, key, publicUrl } = req.body || {}
    if (!event_id || !key || !publicUrl) return res.status(400).json({ error: 'event_id, key, publicUrl required' })

    try {
        const { data, error } = await serverSupabase
            .from('images')
            .insert([{ event_id, uploaded_by: user.id, r2_url: publicUrl, r2_key: key }])
            .select()

        if (error) return res.status(500).json({ error: error.message })
        return res.status(200).json({ data: data[0] })
    } catch (err) {
        return res.status(500).json({ error: err.message || String(err) })
    }
}
