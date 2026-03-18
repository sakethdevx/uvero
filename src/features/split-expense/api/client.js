const GUEST_SESSION_KEY = 'uvero_split_guest_session'

function generateGuestSessionId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `guest_${crypto.randomUUID().replace(/-/g, '')}`
    }

    const random = Math.random().toString(36).slice(2)
    const timestamp = Date.now().toString(36)
    return `guest_${timestamp}_${random}`
}

export function getOrCreateGuestSessionId() {
    if (typeof window === 'undefined') return null

    const existing = window.localStorage.getItem(GUEST_SESSION_KEY)
    if (existing) return existing

    const next = generateGuestSessionId()
    window.localStorage.setItem(GUEST_SESSION_KEY, next)
    return next
}

export async function splitApiRequest(path, { method = 'GET', body, user } = {}) {
    const headers = {}

    if (user?.access_token) {
        headers.Authorization = `Bearer ${user.access_token}`
    } else {
        const guestSessionId = getOrCreateGuestSessionId()
        if (guestSessionId) headers['x-guest-session'] = guestSessionId
    }

    const options = {
        method,
        headers
    }

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json'
        options.body = JSON.stringify(body)
    }

    const response = await fetch(path, options)
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
        throw new Error(payload?.error || 'Request failed')
    }

    return payload
}

export const GUEST_LIMITS = {
    maxGroups: 2,
    maxExpensesPerGroup: 15,
    advancedModes: false
}
