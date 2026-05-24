import { supabase } from '../lib/supabase/client'
import { normalizeUsernameInput } from './usernameRules'
import { interpretUsernameAvailability } from './usernameAvailability'

function buildAuthHeaders(accessToken) {
    if (!accessToken) return {}
    return { Authorization: `Bearer ${accessToken}` }
}

export async function checkUsernameAvailability(username, accessToken) {
    const normalized = normalizeUsernameInput(username)
    if (!normalized) {
        return {
            username: '',
            valid: false,
            available: false,
            message: 'Username is required.',
        }
    }

    const response = await fetch(`/api/username-availability?username=${encodeURIComponent(normalized)}`, {
        headers: {
            ...buildAuthHeaders(accessToken),
            Accept: 'application/json',
        },
    })

    const contentType = response.headers.get('content-type') || ''
    const payload = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : null

    if (!response.ok) {
        throw new Error(payload?.error || 'Could not check username availability')
    }

    if (!payload || typeof payload.available !== 'boolean') {
        throw new Error('Invalid username availability response')
    }

    return payload
}

export { interpretUsernameAvailability }

export async function updateMyUsername(username, accessToken) {
    const normalized = normalizeUsernameInput(username)
    const token = accessToken || (await supabase.auth.getSession())?.data?.session?.access_token || ''

    const response = await fetch('/api/update-username', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(token)
        },
        body: JSON.stringify({ username: normalized })
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
        const err = new Error(payload?.error || 'Could not update username')
        err.status = response.status
        throw err
    }

    return payload
}
