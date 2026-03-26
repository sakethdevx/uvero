export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 20

export const USERNAME_HELP_TEXT =
    '3-20 characters. Use lowercase letters, numbers, dot (.) and underscore (_). Must start/end with a letter or number, and dots cannot be consecutive.'

export function normalizeUsernameInput(value) {
    return String(value || '').trim().toLowerCase()
}

export function isUsernameValid(value) {
    const username = normalizeUsernameInput(value)

    if (!username) {
        return { valid: false, message: 'Username is required.' }
    }

    if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
        return {
            valid: false,
            message: `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters long.`
        }
    }

    if (!/^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$/.test(username)) {
        return {
            valid: false,
            message: 'Use only lowercase letters, numbers, dot (.) and underscore (_). Username must start and end with a letter or number.'
        }
    }

    if (username.includes('..')) {
        return {
            valid: false,
            message: 'Username cannot contain consecutive dots.'
        }
    }

    return { valid: true, message: '', username }
}
