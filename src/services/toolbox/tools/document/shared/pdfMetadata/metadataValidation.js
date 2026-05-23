import { METADATA_FIELDS } from './metadataConstants';

export const validateCleanupOptions = (fieldsToRemove) => {
    if (!Array.isArray(fieldsToRemove)) {
        return 'fieldsToRemove must be an array.';
    }

    const validFields = Object.values(METADATA_FIELDS);
    for (const field of fieldsToRemove) {
        if (!validFields.includes(field)) {
            return `Invalid metadata field specifier: ${field}`;
        }
    }

    return null;
};
