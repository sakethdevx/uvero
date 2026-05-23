import { METADATA_FIELDS } from './metadataConstants';

export const extractMetadata = (pdf) => {
    return {
        [METADATA_FIELDS.TITLE]: pdf.getTitle() || '',
        [METADATA_FIELDS.AUTHOR]: pdf.getAuthor() || '',
        [METADATA_FIELDS.SUBJECT]: pdf.getSubject() || '',
        [METADATA_FIELDS.KEYWORDS]: pdf.getKeywords() || '',
        [METADATA_FIELDS.CREATOR]: pdf.getCreator() || '',
        [METADATA_FIELDS.PRODUCER]: pdf.getProducer() || '',
        [METADATA_FIELDS.CREATION_DATE]: pdf.getCreationDate() ? pdf.getCreationDate().toISOString() : '',
        [METADATA_FIELDS.MODIFICATION_DATE]: pdf.getModificationDate() ? pdf.getModificationDate().toISOString() : '',
    };
};
