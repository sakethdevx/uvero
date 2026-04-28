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

        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' })
        }

        const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        const url = new URL(req.url, `http://${req.headers.host}`)
        const requestedUsername =
            req.query?.username ||
            url.searchParams.get('username') ||
            ''

        const validation = validateUsername(requestedUsername)

        if (!validation.valid) {
            return res.status(200).json({
                username: validation.username,
                valid: false,
                available: false,
                message: validation.message,
                isCurrentUser: false
            })
        }

        let currentUserId = null
        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '')

        if (token) {
            const { data: userData } = await serverSupabase.auth.getUser(token)
            currentUserId = userData?.user?.id || null
        }

        const { data: existing, error } = await serverSupabase
            .from('profiles')
            .select('id')
            .eq('username', validation.username)
            .maybeSingle()

        if (error) {
            return res.status(500).json({ error: error.message })
        }

        const isCurrentUser = !!(existing?.id && currentUserId && existing.id === currentUserId)

        return res.status(200).json({
            username: validation.username,
            valid: true,
            available: !existing || isCurrentUser,
            isCurrentUser,
            message: !existing || isCurrentUser ? 'Username is available.' : 'Username is already taken.'
        })
    } catch (err) {
        return res.status(500).json({ error: String(err?.message || err) })
    }
}
