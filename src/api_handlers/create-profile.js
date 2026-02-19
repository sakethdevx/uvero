// Serverless handler (moved from /api/create-profile.js)
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('Missing Supabase server env vars for create-profile endpoint')
}

const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Missing access token' })

    // Verify the token and get user
    const { data: userData, error: userError } = await serverSupabase.auth.getUser(token)
    if (userError || !userData?.user) {
        return res.status(401).json({ error: 'Invalid access token' })
    }

    const user = userData.user

    const payload = req.body || {}
    const email = payload.email || user.email || null
    const full_name = payload.full_name || user.user_metadata?.full_name || null

    // Upsert profile: id should be auth.users id
    const { data, error } = await serverSupabase
        .from('profiles')
        .upsert({ id: user.id, email, full_name })
        .select()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ data })
}
}
