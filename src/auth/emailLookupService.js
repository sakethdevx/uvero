export async function checkEmailRegistered(email) {
    const normalized = String(email || '').trim().toLowerCase()
    const response = await fetch(`/api/check-email?email=${encodeURIComponent(normalized)}`)
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
        return {
            exists: null,
            error: payload?.error || 'Could not verify this email right now.',
        }
    }

    return { exists: Boolean(payload.exists), error: null }
}
