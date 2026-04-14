import JSZip from 'jszip';
import {
    ensureFiles,
    normalizeSingleFileResult,
} from '../../../core/executorUtils';

export async function run({ files, onProgress }) {
    const sourceFiles = ensureFiles(files);
    const [file] = sourceFiles;

    if (!file.name.toLowerCase().endsWith('.zip') && file.type !== 'application/zip') {
        throw new Error('Archive Converter currently supports ZIP files only.');
    }

    onProgress?.(20);
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);

    onProgress?.(50);

    const newZip = new JSZip();
    const filePromises = [];

    contents.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
            filePromises.push(
                zipEntry.async('blob').then((blob) => {
                    newZip.file(relativePath, blob);
                })
            );
        }
    });

    await Promise.all(filePromises);

    onProgress?.(80);

    const blob = await newZip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });

    const outputFile = new File([blob], file.name.replace(/\.[^.]+$/, '.zip'), {
        type: 'application/zip',
    });

    onProgress?.(100);

    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        note: 'ZIP archive repackaged locally in browser',
    });
}
