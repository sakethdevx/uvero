import { METADATA_FIELDS } from './metadataConstants';

export const cleanMetadata = (sourcePdf, originalMetadata, fieldsToRemove) => {
    const removedFields = [];

    if (fieldsToRemove.includes(METADATA_FIELDS.TITLE) && originalMetadata[METADATA_FIELDS.TITLE]) {
        sourcePdf.setTitle('');
        removedFields.push(METADATA_FIELDS.TITLE);
    }

    if (fieldsToRemove.includes(METADATA_FIELDS.AUTHOR) && originalMetadata[METADATA_FIELDS.AUTHOR]) {
        sourcePdf.setAuthor('');
        removedFields.push(METADATA_FIELDS.AUTHOR);
    }

    if (fieldsToRemove.includes(METADATA_FIELDS.SUBJECT) && originalMetadata[METADATA_FIELDS.SUBJECT]) {
        sourcePdf.setSubject('');
        removedFields.push(METADATA_FIELDS.SUBJECT);
    }

    if (fieldsToRemove.includes(METADATA_FIELDS.KEYWORDS) && originalMetadata[METADATA_FIELDS.KEYWORDS]) {
        sourcePdf.setKeywords([]); // pdf-lib uses array for keywords
        removedFields.push(METADATA_FIELDS.KEYWORDS);
    }

    if (fieldsToRemove.includes(METADATA_FIELDS.CREATOR) && originalMetadata[METADATA_FIELDS.CREATOR]) {
        sourcePdf.setCreator('');
        removedFields.push(METADATA_FIELDS.CREATOR);
    }

    if (fieldsToRemove.includes(METADATA_FIELDS.PRODUCER) && originalMetadata[METADATA_FIELDS.PRODUCER]) {
        sourcePdf.setProducer('');
        removedFields.push(METADATA_FIELDS.PRODUCER);
    }

    // Dates cannot be perfectly "erased" in pdf-lib (it usually sets new dates on save).
    // But setting them to a generic epoch date masks the real data.
    if (fieldsToRemove.includes(METADATA_FIELDS.CREATION_DATE) && originalMetadata[METADATA_FIELDS.CREATION_DATE]) {
        sourcePdf.setCreationDate(new Date(0));
        removedFields.push(METADATA_FIELDS.CREATION_DATE);
    }

    if (fieldsToRemove.includes(METADATA_FIELDS.MODIFICATION_DATE) && originalMetadata[METADATA_FIELDS.MODIFICATION_DATE]) {
        sourcePdf.setModificationDate(new Date(0));
        removedFields.push(METADATA_FIELDS.MODIFICATION_DATE);
    }

    return removedFields;
};
