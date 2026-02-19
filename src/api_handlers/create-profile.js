import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

export default async function handler(req, res) {
    // Env safety
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: 'Server not configured' })
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Auth token
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Missing access token' })

    const { data: userData, error: userError } =
        await serverSupabase.auth.getUser(token)

    if (userError || !userData?.user) {
        return res.status(401).json({ error: 'Invalid access token' })
    }

    const user = userData.user

    // Safe body parsing
    let payload = req.body
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload)
        } catch {
            return res.status(400).json({ error: 'Invalid JSON body' })
        }
    }

    const email = payload?.email || user.email || null
    const full_name = payload?.full_name || user.user_metadata?.full_name || null

    const { data, error } = await serverSupabase
        .from('profiles')
        .upsert({ id: user.id, email, full_name })
        .select()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ data })
}