/** Normalize API payload into UI status for username checks */
export function interpretUsernameAvailability(payload) {
    if (!payload || typeof payload.available !== 'boolean') {
        return {
            tone: 'invalid',
            message: 'Could not check username right now. Please try again.',
        }
    }

    if (payload.valid === false) {
        return {
            tone: 'invalid',
            message: payload.message || 'Invalid username.',
        }
    }

    if (payload.available) {
        return {
            tone: 'available',
            message: payload.message || 'Username is available.',
        }
    }

    return {
        tone: 'taken',
        message: payload.message || 'Username is already taken.',
    }
}
