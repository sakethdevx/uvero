import { METADATA_PROFILES, METADATA_CLEANUP_OPTIONS } from './metadataConstants';

export const getProfileOptions = (profileId) => {
    return METADATA_CLEANUP_OPTIONS[profileId] || [];
};

export const isFieldInProfile = (profileId, field) => {
    const options = getProfileOptions(profileId);
    return options.includes(field);
};
