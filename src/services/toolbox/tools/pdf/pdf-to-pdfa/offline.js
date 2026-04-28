import { PDFDocument } from 'pdf-lib';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;

    onProgress?.(10);

    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(30);

    const pdfDoc = await PDFDocument.load(arrayBuffer);
    onProgress?.(50);

    pdfDoc.setTitle(file.name.replace('.pdf', ''));
    pdfDoc.setAuthor('Uvero Converter');
    pdfDoc.setSubject('PDF/A Converted Document');
    pdfDoc.setKeywords(['PDF/A', 'archival', 'long-term preservation']);
    pdfDoc.setProducer('Uvero PDF to PDF/A Converter');
    pdfDoc.setCreator('Uvero');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    onProgress?.(85);

    const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        objectsPerTick: 50,
    });

    onProgress?.(95);

    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const outputFile = new File([pdfBlob], file.name.replace('.pdf', '-pdfa.pdf'), {
        type: 'application/pdf',
    });

    onProgress?.(100);

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        note: 'Metadata-enhanced PDF/A-style output',
    });
}
