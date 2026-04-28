import { createClient } from '@supabase/supabase-js'

const env = globalThis?.process?.env || {}
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY

function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase()
}

function validateUsername(value) {
    const username = normalizeUsername(value)
    if (!username) return { valid: false, username, message: 'Username is required.' }
    if (username.length < 3 || username.length > 20) {
        return { valid: false, username, message: 'Username must be 3-20 characters long.' }
    }
    if (!/^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$/.test(username)) {
        return {
            valid: false,
            username,
            message: 'Use lowercase letters, numbers, dot (.) and underscore (_). Username must start and end with a letter or number.'
        }
    }
    if (username.includes('..')) {
        return { valid: false, username, message: 'Username cannot contain consecutive dots.' }
    }
    return { valid: true, username, message: '' }
}

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

        const requestedUsername = req.body?.username || user.user_metadata?.username || null
        const usernameValidation = requestedUsername ? validateUsername(requestedUsername) : null

        const profilePayload = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null
        }

        if (usernameValidation?.valid) {
            profilePayload.username = usernameValidation.username
        }

        let usernameStatus = usernameValidation?.valid ? 'set' : (requestedUsername ? 'invalid' : 'not-provided')

        let { data, error } = await serverSupabase
            .from('profiles')
            .upsert(profilePayload)
            .select()

        if (error && error.code === '23505' && profilePayload.username) {
            delete profilePayload.username
            usernameStatus = 'taken'

            const retry = await serverSupabase
                .from('profiles')
                .upsert(profilePayload)
                .select()

            data = retry.data
            error = retry.error
        }

        console.log('[create-profile] upsert result:', data, error)

        if (error) {
            console.error('[create-profile] supabase error:', error)
            return res.status(500).json({ error: error.message })
        }

        // If the profile already has a username (from an earlier successful setup),
        // treat the username as set even if the current request didn't provide one.
        const savedUsername = normalizeUsername(data?.[0]?.username)
        if (savedUsername) {
            usernameStatus = 'set'
        }

        return res.status(200).json({
            data,
            username: {
                status: usernameStatus,
                value: savedUsername || usernameValidation?.username || null,
                message: usernameStatus === 'set'
                    ? ''
                    : (usernameValidation?.message || '')
            }
        })

    } catch (err) {
        console.error('[create-profile] unexpected crash:', err)
        return res.status(500).json({ error: String(err) })
    }
}
