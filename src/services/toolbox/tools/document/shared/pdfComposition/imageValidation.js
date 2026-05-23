import { SUPPORTED_IMAGE_TYPES } from './compositionConstants';

export const validateImageSize = (file, maxSize = 25 * 1024 * 1024) => {
    if (file.size > maxSize) {
        throw new Error(`File ${file.name} exceeds max size of ${maxSize / (1024 * 1024)}MB`);
    }
};

export const validateImageType = (file) => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        throw new Error(`Unsupported image type: ${file.type}. Supported types: ${SUPPORTED_IMAGE_TYPES.join(', ')}`);
    }
};

export const validateImages = (files, options = {}) => {
    const { maxSize } = options;
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
        try {
            validateImageType(file);
            validateImageSize(file, maxSize);
            validFiles.push(file);
        } catch (error) {
            errors.push(error.message);
        }
    });

    return { validFiles, errors };
};
