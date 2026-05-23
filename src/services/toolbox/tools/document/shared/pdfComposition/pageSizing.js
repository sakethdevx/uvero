import { PAGE_SIZES, ORIENTATIONS } from './compositionConstants';

export const calculatePageDimensions = (imageWidth, imageHeight, options) => {
    let pageWidth;
    let pageHeight;

    if (typeof options.pageSize === 'string') {
        const preset = PAGE_SIZES[options.pageSize] || PAGE_SIZES.A4;
        if (options.pageSize === 'FIT') {
            pageWidth = imageWidth + (options.margin * 2);
            pageHeight = imageHeight + (options.margin * 2);
        } else {
            pageWidth = preset.width;
            pageHeight = preset.height;
        }
    } else {
        pageWidth = options.pageSize.width;
        pageHeight = options.pageSize.height;
    }

    if (options.orientation === ORIENTATIONS.LANDSCAPE) {
        if (pageWidth < pageHeight) {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }
    } else if (options.orientation === ORIENTATIONS.PORTRAIT) {
        if (pageWidth > pageHeight) {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }
    } else if (options.orientation === ORIENTATIONS.AUTO) {
        const imageIsLandscape = imageWidth > imageHeight;
        const pageIsLandscape = pageWidth > pageHeight;

        if (imageIsLandscape !== pageIsLandscape && options.pageSize !== 'FIT') {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }
    }

    return { pageWidth, pageHeight };
};

export const calculateImagePlacement = (imageWidth, imageHeight, pageWidth, pageHeight, options) => {
    const availableWidth = pageWidth - (options.margin * 2);
    const availableHeight = pageHeight - (options.margin * 2);

    let width = imageWidth;
    let height = imageHeight;

    if (options.scaleToFit) {
        const scaleX = availableWidth / imageWidth;
        const scaleY = availableHeight / imageHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        width = imageWidth * scale;
        height = imageHeight * scale;
    }

    let x = options.margin;
    let y = options.margin;

    if (options.centerImage) {
        x = (pageWidth - width) / 2;
        y = (pageHeight - height) / 2;
    }

    return { x, y, width, height };
};
