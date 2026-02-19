import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

export default async function handler(req, res) {
    try {
        console.log('[create-profile] start')

        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            console.log('[create-profile] missing env')
            return res.status(500).json({ error: 'Server not configured' })
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' })
        }

        const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '')
        console.log('[create-profile] token present:', !!token)

        const { data: userData, error: userError } =
            await serverSupabase.auth.getUser(token)

        console.log('[create-profile] getUser result:', userData, userError)

        if (userError || !userData?.user) {
            return res.status(401).json({ error: 'Invalid access token' })
        }

        const user = userData.user

        const { data, error } = await serverSupabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || null
            })
            .select()

        console.log('[create-profile] upsert result:', data, error)

        if (error) {
            console.error('[create-profile] supabase error:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ data })

    } catch (err) {
        console.error('[create-profile] unexpected crash:', err)
        return res.status(500).json({ error: String(err) })
    }
}