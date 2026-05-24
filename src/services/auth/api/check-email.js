import { createClient } from '@supabase/supabase-js'

const env = globalThis?.process?.env || {}
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase()
}

export default async function handler(req, res) {
    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            return res.status(500).json({ error: 'Server not configured' })
        }

        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' })
        }

        const url = new URL(req.url, `http://${req.headers.host}`)
        const email = normalizeEmail(req.query?.email || url.searchParams.get('email') || '')

        if (!email || !EMAIL_RE.test(email)) {
            return res.status(400).json({ error: 'A valid email is required.' })
        }

        const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        const { data: profile, error } = await serverSupabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        if (error) {
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ email, exists: Boolean(profile?.id) })
    } catch (err) {
        return res.status(500).json({ error: String(err?.message || err) })
    }
}
