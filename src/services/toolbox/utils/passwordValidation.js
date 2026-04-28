/**
 * Shared Password Validation Utility
 * Used across PDF protection features
 */

export const MIN_PASSWORD_LENGTH = 4;

/**
 * Validates a password for PDF protection
 * @param {string} password - The password to validate
 * @param {string} confirmPassword - The confirmation password
 * @returns {string|null} - Error message or null if valid
 */
export function validatePdfPassword(password, confirmPassword) {
    if (!password) {
        return 'Password is required to protect PDF';
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
    }
    if (password !== confirmPassword) {
        return 'Passwords do not match';
    }
    return null; // No error
}
