/**
 * PDF to PowerPoint Conversion Worker
 * Handles PDF text extraction and PPTX creation using PDF.js and PptxGenJS
 */

import * as pdfjsLib from 'pdfjs-dist';
import pptxgen from 'pptxgenjs';

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
            
            // Group text items into lines
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
                text: pageText
            });
            
            self.postMessage({ 
                type: 'progress', 
                progress: 20 + (pageNum / numPages) * 50 
            });
        }

        self.postMessage({ type: 'progress', progress: 70 });

        // Create PowerPoint presentation
        const pptx = new pptxgen();
        
        // Set presentation properties
        pptx.author = 'FileNext PDF Converter';
        pptx.company = 'FileNext';
        pptx.subject = 'PDF to PowerPoint Conversion';
        pptx.title = 'Converted Presentation';

        // Create slides from text content
        for (let i = 0; i < textContent.length; i++) {
            const pageData = textContent[i];
            const slide = pptx.addSlide();
            
            // Add slide title (first line or page number)
            const title = pageData.text[0] || `Slide ${pageData.pageNumber}`;
            slide.addText(title, {
                x: 0.5,
                y: 0.5,
                w: 9,
                h: 0.75,
                fontSize: 24,
                bold: true,
                color: '363636'
            });
            
            // Add remaining text as body content
            if (pageData.text.length > 1) {
                const bodyText = pageData.text.slice(1).join('\n');
                slide.addText(bodyText, {
                    x: 0.5,
                    y: 1.5,
                    w: 9,
                    h: 5,
                    fontSize: 14,
                    color: '363636',
                    valign: 'top'
                });
            }
            
            self.postMessage({ 
                type: 'progress', 
                progress: 70 + ((i + 1) / textContent.length) * 20 
            });
        }

        self.postMessage({ type: 'progress', progress: 90 });

        // Generate PPTX file
        const pptxBlob = await pptx.write({ outputType: 'blob' });

        self.postMessage({ type: 'progress', progress: 100 });

        self.postMessage({
            type: 'success',
            data: {
                blob: pptxBlob,
                slideCount: numPages
            }
        });
    } catch (error) {
        console.error('PDF to PowerPoint conversion error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to convert PDF to PowerPoint'
        });
    }
});
