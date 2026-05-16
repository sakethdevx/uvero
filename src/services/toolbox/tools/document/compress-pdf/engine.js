import { loadPdfLib, createPdfDocument, loadPdfjs } from '../shared/pdfEngine';
import { getFileNameWithoutExtension, loadFileAsArrayBuffer } from '../shared/pdfUtils';
import { PDF_ERROR_CODES } from '../shared/pdfConstants';
import { getCompressionSettings } from '../shared/pdfCompression/qualityConfig';

/**
 * Compress a PDF by re-rendering pages as images and re-encoding with JPEG compression.
 * Processes pages sequentially to minimize memory pressure.
 *
 * @param {File[]} files - Array of PDF files (single file expected)
 * @param {Object} options - Compression options
 * @param {string} options.compressionLevel - 'low', 'medium', or 'high'
 * @param {function} onProgress - Callback(percentage, message)
 * @returns {Promise<{blob: Blob, filename: string, metadata: Object}>}
 */
export const processCompress = async (files, options = {}, onProgress) => {
  const { compressionLevel = 'medium' } = options;

  if (files.length !== 1) {
    throw new Error('Exactly 1 PDF file is required for compression.');
  }

  const file = files[0];

  if (onProgress) onProgress(5, 'Loading PDF library...');
  const pdfLib = await loadPdfLib();
  const pdfjsLib = await loadPdfjs();

  if (onProgress) onProgress(10, 'Loading source PDF...');
  const arrayBuffer = await loadFileAsArrayBuffer(file);

  let sourcePdf;
  let pdfjsDoc;
  try {
    sourcePdf = await pdfLib.PDFDocument.load(arrayBuffer, {
      ignoreEncryption: false,
    });
    const totalPages = sourcePdf.getPageCount();

    // Also load with pdf.js for rendering
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdfjsDoc = await loadingTask.promise;

    if (onProgress) onProgress(15, `Source PDF has ${totalPages} pages.`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('encrypt')) {
      throw new Error(`File "${file.name}" is encrypted. Please decrypt the file before compressing.`);
    }
    throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
  }

  const totalPages = sourcePdf.getPageCount();
  const settings = getCompressionSettings(compressionLevel);

  if (onProgress) onProgress(20, `Compressing at ${settings.label} quality...`);

  // Create output PDF
  const newPdf = await createPdfDocument();

  // Sequential page processing with per-page cleanup
  for (let i = 0; i < totalPages; i++) {
    const pageIndex = i + 1; // pdfjs is 1-indexed

    if (onProgress) {
      const progress = 20 + Math.round((i / totalPages) * 65);
      onProgress(progress, `Compressing page ${pageIndex} of ${totalPages}...`);
    }

    try {
      // 1. Get pdf-lib page for dimensions
      const libPage = sourcePdf.getPage(i);
      const { width: pageWidth, height: pageHeight } = libPage.getSize();

      // 2. Render with pdf.js
      const page = await pdfjsDoc.getPage(pageIndex);
      const viewport = page.getViewport({ scale: settings.scale });

      // Use OffscreenCanvas (available in Web Workers)
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext('2d');

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      // 3. Convert to compressed JPEG blob
      const imageBlob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: settings.jpegQuality
      });

      // 4. Embed into output PDF
      const jpgImage = await newPdf.embedJpg(imageBlob);

      // 5. Create new page with original dimensions and draw compressed image
      const newPage = newPdf.addPage([pageWidth, pageHeight]);
      newPage.drawImage(jpgImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight
      });

      // 6. Explicit cleanup: clear references (especially canvas/ctx) to release memory
      // OffscreenCanvas memory is released when no references remain.
      // We do not need to call any destroy method on pdf.js page objects if we destroy the whole doc later.
    } catch (pageError) {
      throw new Error(`Failed to compress page ${pageIndex}: ${pageError.message}`);
    }
  }

  // Cleanup: destroy pdf.js document and close pdf-lib document
  if (pdfjsDoc) await pdfjsDoc.destroy();
  if (sourcePdf) await sourcePdf.close();

  if (onProgress) onProgress(90, 'Saving compressed PDF...');

  // Save output PDF
  const pdfBytes = await newPdf.save({ useObjectStreams: true });
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

  if (onProgress) onProgress(100, 'Compression complete!');

  // Generate filename
  const baseName = getFileNameWithoutExtension(file.name);
  const filename = `${baseName}_compressed.pdf`;

  // Calculate approximate sizes (source size vs output size)
  const originalSize = file.size;
  const compressedSize = blob.size;

  return {
    blob,
    filename,
    metadata: {
      originalSize,
      compressedSize,
      pageCount: totalPages,
      compressionRatio: Math.round((1 - compressedSize / originalSize) * 100)
    }
  };
};
