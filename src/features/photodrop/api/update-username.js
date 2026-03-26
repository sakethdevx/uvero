import { createClient } from '@supabase/supabase-js'

const env = globalThis?.process?.env || {}
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY

function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase()
}

function validateUsername(value) {
    const username = normalizeUsername(value)

    if (!username) return { valid: false, message: 'Username is required.', username }
    if (username.length < 3 || username.length > 20) {
        return { valid: false, message: 'Username must be 3-20 characters long.', username }
    }
    if (!/^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$/.test(username)) {
        return {
            valid: false,
            message: 'Use lowercase letters, numbers, dot (.) and underscore (_). Username must start and end with a letter or number.',
            username
        }
    }
    if (username.includes('..')) {
        return { valid: false, message: 'Username cannot contain consecutive dots.', username }
    }

    return { valid: true, message: '', username }
}

export default async function handler(req, res) {
    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            return res.status(500).json({ error: 'Server not configured' })
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' })
        }

        const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '')

        if (!token) {
            return res.status(401).json({ error: 'Missing access token' })
        }

        const { data: userData, error: userError } = await serverSupabase.auth.getUser(token)
        if (userError || !userData?.user) {
            return res.status(401).json({ error: 'Invalid access token' })
        }

        const user = userData.user
        const requestedUsername = req.body?.username || ''
        const validation = validateUsername(requestedUsername)

        if (!validation.valid) {
            return res.status(400).json({ error: validation.message })
        }

        await serverSupabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || null
            })

        const { data, error } = await serverSupabase
            .from('profiles')
            .update({ username: validation.username })
            .eq('id', user.id)
            .select('id, username')
            .maybeSingle()

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Username is already taken.' })
            }
            if (error.code === '23514') {
                return res.status(400).json({ error: 'Username does not match required format.' })
            }
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({
            data,
            username: data?.username || validation.username,
            message: 'Username updated successfully.'
        })
    } catch (err) {
        return res.status(500).json({ error: String(err?.message || err) })
    }
}
