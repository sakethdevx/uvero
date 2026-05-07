import { MAX_FILES, DEFAULT_MAX_FILE_SIZE, PDF_MIME_TYPE } from './pdfConstants';

/**
 * Validates new PDF files against constraints and existing files.
 * Handles duplicate detection, size limits, and valid MIME types.
 *
 * @param {File[]} newFiles - Array of newly selected files
 * @param {File[]} existingFiles - Array of already added files
 * @param {Object} options - Configuration overrides (maxFiles, maxSize)
 * @returns {{ validFiles: File[], errors: string[] }}
 */
export const validatePdfFiles = (newFiles, existingFiles = [], options = {}) => {
    const { maxSize = DEFAULT_MAX_FILE_SIZE, maxFiles = MAX_FILES } = options;

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

    return { validFiles, errors };
};