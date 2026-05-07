import { loadPdfLib, createPdfDocument } from '../shared/pdfEngine';
import { getFileNameWithoutExtension, generateMergedFilename, loadFileAsArrayBuffer } from '../shared/pdfUtils';
import { PDF_ERROR_CODES } from '../shared/pdfConstants';

export const processMerge = async (files, options = {}, onProgress) => {
    const { preserveBookmarks = true } = options;

    if (files.length < 2) {
        throw new Error('At least 2 PDF files are required for merging.');
    }

    if (onProgress) onProgress(5, 'Loading PDF library...');
    const pdfLib = await loadPdfLib();

    if (onProgress) onProgress(10, 'Creating merged document...');
    const mergedPdf = await createPdfDocument();

    const bookmarks = [];
    let currentPageIndex = 0;
    const progressPerFile = 80 / files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileProgress = 10 + (i * progressPerFile);

        if (onProgress) {
            onProgress(fileProgress, `Processing file ${i + 1} of ${files.length}: ${file.name}`);
        }

        try {
            const arrayBuffer = await loadFileAsArrayBuffer(file);
            const sourcePdf = await pdfLib.PDFDocument.load(arrayBuffer, {
                ignoreEncryption: false,
            });

            const pageCount = sourcePdf.getPageCount();
            const copiedPages = await mergedPdf.copyPages(
                sourcePdf,
                sourcePdf.getPageIndices()
            );

            for (const page of copiedPages) {
                mergedPdf.addPage(page);
            }

            if (preserveBookmarks) {
                bookmarks.push({
                    title: getFileNameWithoutExtension(file.name),
                    pageIndex: currentPageIndex,
                    pageCount,
                });
            }

            currentPageIndex += pageCount;
        } catch (error) {
            if (error instanceof Error && error.message.includes('encrypt')) {
                throw new Error(`File "${file.name}" is encrypted. Please decrypt the file before merging.`);
            }
            throw new Error(`Failed to process file "${file.name}": ${error.message || 'Unknown error'}`);
        }
    }

    if (onProgress) onProgress(90, 'Adding bookmarks...');

    if (preserveBookmarks && bookmarks.length > 0) {
        await addBookmarksToDocument(mergedPdf, bookmarks, pdfLib);
    }

    if (onProgress) onProgress(95, 'Saving merged PDF...');

    const mergedPdfBytes = await mergedPdf.save({ useObjectStreams: true });
    const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });

    if (onProgress) onProgress(100, 'Complete!');

    const outputFilename = generateMergedFilename(files);
    return { blob, filename: outputFilename, metadata: { pageCount: currentPageIndex, fileCount: files.length } };
};


async function addBookmarksToDocument(pdfDoc, bookmarks, pdfLib) {
    const context = pdfDoc.context;
    const catalog = pdfDoc.catalog;

    const outlineEntryRefs = [];

    for (let i = 0; i < bookmarks.length; i++) {
        const bookmark = bookmarks[i];
        const page = pdfDoc.getPage(bookmark.pageIndex);
        const pageRef = page.ref;

        const destArray = pdfLib.PDFArray.withContext(context);
        destArray.push(pageRef);
        destArray.push(pdfLib.PDFName.of('XYZ'));
        destArray.push(pdfLib.PDFNull);
        destArray.push(pdfLib.PDFNull);
        destArray.push(pdfLib.PDFNull);

        const bookmarkDict = pdfLib.PDFDict.withContext(context);
        bookmarkDict.set(pdfLib.PDFName.of('Title'), pdfLib.PDFHexString.fromText(bookmark.title));
        bookmarkDict.set(pdfLib.PDFName.of('Dest'), destArray);

        const bookmarkRef = context.register(bookmarkDict);
        outlineEntryRefs.push(bookmarkRef);
    }

    const outlineDict = pdfLib.PDFDict.withContext(context);
    outlineDict.set(pdfLib.PDFName.of('Type'), pdfLib.PDFName.of('Outlines'));
    outlineDict.set(pdfLib.PDFName.of('Count'), pdfLib.PDFNumber.of(bookmarks.length));

    const outlineRef = context.register(outlineDict);

    for (let i = 0; i < outlineEntryRefs.length; i++) {
        const entryRef = outlineEntryRefs[i];
        const entryDict = context.lookup(entryRef);

        entryDict.set(pdfLib.PDFName.of('Parent'), outlineRef);

        if (i > 0) {
            entryDict.set(pdfLib.PDFName.of('Prev'), outlineEntryRefs[i - 1]);
        }
        if (i < outlineEntryRefs.length - 1) {
            entryDict.set(pdfLib.PDFName.of('Next'), outlineEntryRefs[i + 1]);
        }
    }

    if (outlineEntryRefs.length > 0) {
        outlineDict.set(pdfLib.PDFName.of('First'), outlineEntryRefs[0]);
        outlineDict.set(pdfLib.PDFName.of('Last'), outlineEntryRefs[outlineEntryRefs.length - 1]);
    }

    catalog.set(pdfLib.PDFName.of('Outlines'), outlineRef);
}