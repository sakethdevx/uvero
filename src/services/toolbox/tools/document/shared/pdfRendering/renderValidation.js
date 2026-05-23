import { parsePageRanges } from '../pageOperations/pageSelectionUtils';
import {
    DEFAULT_PDF_TO_IMAGE_OPTIONS,
    MAX_EXPORT_PAGES,
    PDF_IMAGE_FORMATS,
    RENDER_QUALITY_PRESETS,
} from './renderConstants';

const SUPPORTED_FORMATS = Object.values(PDF_IMAGE_FORMATS);

export const validatePdfToImageFile = (files) => {
    if (!files || files.length === 0) {
        throw new Error('Upload a PDF file to export as images.');
    }

    if (files.length !== 1) {
        throw new Error('PDF to Image supports one PDF file at a time.');
    }

    const file = files[0];
    if (file.size === 0) {
        throw new Error('The selected PDF is empty.');
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error(`"${file.name}" is not a valid PDF file.`);
    }

    return file;
};

export const normalizePdfToImageOptions = (options = {}) => {
    const normalized = {
        ...DEFAULT_PDF_TO_IMAGE_OPTIONS,
        ...options,
    };

    if (!SUPPORTED_FORMATS.includes(normalized.format)) {
        throw new Error('Choose a supported image format: PNG, JPG, or WEBP.');
    }

    if (!RENDER_QUALITY_PRESETS[normalized.qualityPreset]) {
        throw new Error('Choose a supported quality preset.');
    }

    return normalized;
};

export const resolvePageSelection = (options, totalPages) => {
    if (totalPages < 1) {
        throw new Error('This PDF does not contain any pages.');
    }

    if (options.pageMode === 'all') {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const ranges = parsePageRanges(options.pageRanges || '', totalPages);
    if (ranges.length === 0) {
        throw new Error('Enter at least one page or page range.');
    }

    const pages = [];
    const seen = new Set();

    for (const range of ranges) {
        if (range.start < 1 || range.end < 1 || range.start > range.end || range.end > totalPages) {
            throw new Error(`Page range ${range.start}-${range.end} is outside this ${totalPages}-page PDF.`);
        }

        for (let page = range.start; page <= range.end; page += 1) {
            if (!seen.has(page)) {
                seen.add(page);
                pages.push(page);
            }
        }
    }

    if (pages.length === 0) {
        throw new Error('No valid pages were selected for export.');
    }

    if (pages.length > MAX_EXPORT_PAGES) {
        throw new Error(`Export up to ${MAX_EXPORT_PAGES} pages at a time for stable browser memory use.`);
    }

    return pages;
};
