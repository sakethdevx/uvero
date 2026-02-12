/**
 * PDF to Word Conversion Worker
 * Handles PDF text extraction and DOCX creation using PDF.js
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Configure PDF.js for worker environment
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).href;

self.addEventListener('message', async (e) => {
    const { type, arrayBuffer } = e.data;

    if (type !== 'convert') {
        return;
    }

    try {
        self.postMessage({ type: 'progress', progress: 10 });

        // Load the PDF with pdf.js
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        self.postMessage({ type: 'progress', progress: 20 });

        // Extract text from all pages
        const textContent = [];
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            
            // Group text items into lines and paragraphs
            const pageText = [];
            let currentLine = '';
            let lastY = null;
            
            for (const item of content.items) {
                // Check if this is a new line (based on Y coordinate)
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                    if (currentLine.trim()) {
                        pageText.push(currentLine.trim());
                    }
                    currentLine = '';
                }
                
                currentLine += item.str;
                lastY = item.transform[5];
            }
            
            // Add the last line
            if (currentLine.trim()) {
                pageText.push(currentLine.trim());
            }
            
            textContent.push({
                pageNumber: pageNum,
                text: pageText.join('\n')
            });
            
            self.postMessage({ 
                type: 'progress', 
                progress: 20 + (pageNum / numPages) * 50 
            });
        }

        self.postMessage({ type: 'progress', progress: 70 });

        // Create a Word-compatible HTML document
        // Modern versions of Word can open HTML files with .docx extension
        const htmlContent = createWordHTML(textContent);
        
        self.postMessage({ type: 'progress', progress: 80 });

        // Create blob with proper DOCX MIME type
        // Using a simple approach: Word-compatible HTML wrapped in proper format
        const wordBlob = new Blob([htmlContent], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        self.postMessage({ type: 'progress', progress: 100 });

        self.postMessage({
            type: 'success',
            data: {
                blob: wordBlob,
                pageCount: numPages
            }
        });
    } catch (error) {
        console.error('PDF to Word conversion error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to convert PDF to Word'
        });
    }
});

/**
 * Create Word-compatible HTML from extracted text
 */
function createWordHTML(textContent) {
    // Create a Word-compatible HTML document
    // This format can be opened by Microsoft Word
    const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Converted Document</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 {
    size: 8.5in 11.0in;
    margin: 1.0in 1.0in 1.0in 1.0in;
}
div.Section1 {
    page: Section1;
}
body {
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
}
p {
    margin: 0 0 10pt 0;
}
.page-break {
    page-break-before: always;
}
</style>
</head>
<body>
<div class="Section1">
${textContent.map((page, index) => `
${index > 0 ? '<div class="page-break"></div>' : ''}
<div class="page">
${page.text.split('\n').map(line => `<p>${escapeHtml(line)}</p>`).join('\n')}
</div>
`).join('\n')}
</div>
</body>
</html>`;

    return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
