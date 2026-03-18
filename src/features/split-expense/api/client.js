const GUEST_SESSION_KEY = 'uvero_split_guest_session'

function buildSplitHeaders(user) {
    const headers = {}

    if (user?.access_token) {
        headers.Authorization = `Bearer ${user.access_token}`
    } else {
        const guestSessionId = getOrCreateGuestSessionId()
        if (guestSessionId) headers['x-guest-session'] = guestSessionId
    }

    return headers
}

function getFilenameFromDisposition(value) {
    const text = String(value || '')
    if (!text) return ''

    const utfMatch = text.match(/filename\*=UTF-8''([^;]+)/i)
    if (utfMatch?.[1]) {
        try {
            return decodeURIComponent(utfMatch[1])
        } catch {
            return utfMatch[1]
        }
    }

    const basicMatch = text.match(/filename="?([^";]+)"?/i)
    return basicMatch?.[1] || ''
}

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
    const headers = buildSplitHeaders(user)

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
        const err = new Error(payload?.error || 'Request failed')
        err.status = response.status
        err.payload = payload
        throw err
    }

    return payload
}

export async function splitApiDownload(path, { method = 'GET', body, user, fileNameFallback = 'download.csv' } = {}) {
    const headers = buildSplitHeaders(user)
    const options = {
        method,
        headers
    }

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json'
        options.body = JSON.stringify(body)
    }

    const response = await fetch(path, options)
    if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        const err = new Error(payload?.error || 'Download failed')
        err.status = response.status
        err.payload = payload
        throw err
    }

    const blob = await response.blob()
    if (typeof window === 'undefined') return

    const disposition = response.headers.get('content-disposition')
    const filename = getFilenameFromDisposition(disposition) || fileNameFallback

    const objectUrl = window.URL.createObjectURL(blob)
    try {
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } finally {
        window.URL.revokeObjectURL(objectUrl)
    }
}

export const GUEST_LIMITS = {
    maxGroups: 2,
    maxExpensesPerGroup: 15,
    advancedModes: false
}
