import { createClient } from '@supabase/supabase-js'

const env = globalThis?.process?.env || {}
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY

function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase()
}

function getQueryParam(req, key) {
    const fromQuery = req.query?.[key]
    if (fromQuery != null && fromQuery !== '') {
        return Array.isArray(fromQuery) ? fromQuery[0] : String(fromQuery)
    }

    try {
        const host = req.headers?.['x-forwarded-host'] || req.headers?.host || 'localhost'
        const protocol = req.headers?.['x-forwarded-proto'] || 'http'
        const url = new URL(req.url || '/', `${protocol}://${host}`)
        const fromUrl = url.searchParams.get(key)
        if (fromUrl) return fromUrl
    } catch {
        // ignore
    }

    return ''
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
            username,
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
        const requestedUsername = getQueryParam(req, 'username')
        const validation = validateUsername(requestedUsername)

        if (!validation.valid) {
            return res.status(200).json({
                username: validation.username,
                valid: false,
                available: false,
                message: validation.message,
                isCurrentUser: false,
            })
        }

        let currentUserId = null
        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '').trim()

        if (token) {
            const { data: userData } = await serverSupabase.auth.getUser(token)
            currentUserId = userData?.user?.id || null
        }

        const { data: matches, error } = await serverSupabase
            .from('profiles')
            .select('id')
            .eq('username', validation.username)
            .limit(1)

        if (error) {
            return res.status(500).json({ error: error.message })
        }

        const existing = matches?.[0] || null
        const isCurrentUser = !!(existing?.id && currentUserId && existing.id === currentUserId)
        const available = !existing || isCurrentUser

        return res.status(200).json({
            username: validation.username,
            valid: true,
            available,
            isCurrentUser,
            message: available ? 'Username is available.' : 'Username is already taken.',
        })
    } catch (err) {
        return res.status(500).json({ error: String(err?.message || err) })
    }
}
