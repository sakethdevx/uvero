/**
 * PDF Compare Processor
 * Uses pdfjs-dist to extract and compare text from two PDFs
 */

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

const extractText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');
        pages.push(text);
    }
    return pages;
};

const compare = async (file1, file2, onProgress = () => {}) => {
    onProgress(10);
    const text1 = await extractText(file1);
    onProgress(40);
    const text2 = await extractText(file2);
    onProgress(70);

    const maxPages = Math.max(text1.length, text2.length);
    const differences = [];
    let totalDiffs = 0;

    for (let i = 0; i < maxPages; i++) {
        const page1Text = text1[i] || '';
        const page2Text = text2[i] || '';

        if (page1Text !== page2Text) {
            const words1 = page1Text.split(/\s+/);
            const words2 = page2Text.split(/\s+/);
            const removed = words1.filter(w => !words2.includes(w));
            const added = words2.filter(w => !words1.includes(w));

            differences.push({
                page: i + 1,
                identical: false,
                removed,
                added,
                original: page1Text.substring(0, 200),
                modified: page2Text.substring(0, 200)
            });
            totalDiffs++;
        } else {
            differences.push({ page: i + 1, identical: true });
        }
    }

    onProgress(100);

    return {
        file1Pages: text1.length,
        file2Pages: text2.length,
        differences,
        totalDiffs,
        totalPages: maxPages
    };
};

export const processor = { compare };
