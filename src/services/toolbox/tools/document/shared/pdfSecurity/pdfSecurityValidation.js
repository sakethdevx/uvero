import { MAX_FILES, DEFAULT_MAX_FILE_SIZE, PDF_MIME_TYPE } from '../pdfConstants';
import { validatePasswordStrength, isValidEncryptionAlgorithm } from './pdfSecurityUtils';

/**
 * Validates PDF files for security operations (encryption, decryption, etc.)
 * Handles duplicate detection, size limits, valid MIME types, and security-specific constraints.
 *
 * @param {File[]} newFiles - Array of newly selected files
 * @param {File[]} existingFiles - Array of already added files
 * @param {Object} options - Configuration overrides (maxFiles, maxSize, operationType, password, etc.)
 * @returns {{ validFiles: File[], errors: string[] }}
 */
export const validateSecurityPdfFiles = (newFiles, existingFiles = [], options = {}) => {
    const { 
        maxSize = DEFAULT_MAX_FILE_SIZE, 
        maxFiles = MAX_FILES,
        operationType = 'encrypt', // encrypt, decrypt, changePassword, managePermissions
        currentPassword = '',
        newPassword = '',
        confirmPassword = ''
    } = options;

    const validFiles = [];
    const errors = [];

    let candidates = Array.from(newFiles);

    // Check absolute file limit
    if (existingFiles.length + candidates.length > maxFiles) {
        errors.push(`Maximum of ${maxFiles} files allowed. Some files were skipped.`);
        candidates = candidates.slice(0, maxFiles - existingFiles.length);
    }

    for (const file of candidates) {
        // Basic type validation
        if (file.type !== PDF_MIME_TYPE && !file.name.toLowerCase().endsWith('.pdf')) {
            errors.push(`"${file.name}" is not a valid PDF file.`);
            continue;
        }

        // Size validation
        if (file.size > maxSize) {
            errors.push(`"${file.name}" exceeds the maximum size limit.`);
            continue;
        }

        // Operation-specific validations
        let operationError = null;

        switch (operationType) {
            case 'encrypt':
            case 'managePermissions':
                // For encryption and permission management, we might want to check if file is already encrypted
                // This would require async checking, so we'll handle it in the engine/worker
                break;
                
            case 'decrypt':
            case 'changePassword':
                // For decryption and password change, validate current password if provided
                if (currentPassword && currentPassword.trim() === '') {
                    operationError = 'Current password is required for this operation';
                }
                break;
        }

        if (operationError) {
            errors.push(`"${file.name}": ${operationError}`);
            continue;
        }

        // Duplicate detection (by name and exact byte size)
        const isDuplicate =
            existingFiles.some(f => f.name === file.name && f.size === file.size) ||
            validFiles.some(f => f.name === file.name && f.size === file.size);

        if (isDuplicate) {
            errors.push(`"${file.name}" is already in the list.`);
            continue;
        }

        validFiles.push(file);
    }

    // Validate passwords for operations that require them
    if (operationType === 'encrypt' || operationType === 'changePassword') {
        const passwordErrors = [];
        
        // For encryption, validate the new password
        // For changePassword, validate both current and new passwords
        const passwordsToValidate = operationType === 'encrypt' 
            ? [{ password: newPassword, label: 'New password' }]
            : [
                { password: currentPassword, label: 'Current password' },
                { password: newPassword, label: 'New password' }
              ];

        for (const { password, label } of passwordsToValidate) {
            if (password !== undefined && password !== null) {
                const validationResult = validatePasswordStrength(password);
                if (!validationResult.isValid) {
                    passwordErrors.push(`${label}: ${validationResult.errors.join('; ')}`);
                }
            }
        }

        // For changePassword, also validate confirmation
        if (operationType === 'changePassword' && newPassword !== confirmPassword) {
            passwordErrors.push('New password and confirmation do not match');
        }

        if (passwordErrors.length > 0) {
            errors.push(...passwordErrors);
        }
    }

    // Validate encryption algorithm if provided
    if (options.encryptionAlgorithm && !isValidEncryptionAlgorithm(options.encryptionAlgorithm)) {
        errors.push('Invalid encryption algorithm specified');
    }

    return { validFiles, errors };
};
