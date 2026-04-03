import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

/**
 * EPUB to PDF Processor
 * Handles EPUB parsing and PDF conversion
 */
class EPUBToPDFProcessor {
    async convert(file, progressCallback) {
        try {
            progressCallback(10);

            // Read EPUB file as ZIP
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);
            
            progressCallback(30);

            // Extract EPUB content
            const epubData = await this.parseEPUB(contents);
            
            progressCallback(50);

            // Create PDF from EPUB content
            const pdf = await this.createPDF(epubData, progressCallback);
            
            progressCallback(90);

            // Generate blob
            const pdfBlob = pdf.output('blob');
            
            progressCallback(100);

            return {
                blob: pdfBlob,
                file: {
                    name: file.name.replace(/\.epub$/i, '.pdf'),
                    size: pdfBlob.size,
                    type: 'application/pdf'
                }
            };
        } catch (error) {
            console.error('EPUB to PDF conversion error:', error);
            throw new Error('Failed to convert EPUB to PDF: ' + error.message);
        }
    }

    async parseEPUB(zip) {
        // Find the content.opf file (package document)
        let contentOpf = null;
        let contentPath = '';
        
        // Look for META-INF/container.xml first
        const containerFile = zip.file('META-INF/container.xml');
        if (containerFile) {
            const containerXml = await containerFile.async('string');
            const parser = new DOMParser();
            const doc = parser.parseFromString(containerXml, 'text/xml');
            const rootfile = doc.querySelector('rootfile');
            if (rootfile) {
                contentPath = rootfile.getAttribute('full-path');
            }
        }

        // If not found, try common locations
        if (!contentPath) {
            const possiblePaths = ['OEBPS/content.opf', 'content.opf', 'EPUB/content.opf'];
            for (const path of possiblePaths) {
                if (zip.file(path)) {
                    contentPath = path;
                    break;
                }
            }
        }

        if (!contentPath) {
            throw new Error('Could not find EPUB content.opf file');
        }

        contentOpf = zip.file(contentPath);
        const opfContent = await contentOpf.async('string');
        
        // Parse OPF to get content files
        const parser = new DOMParser();
        const opfDoc = parser.parseFromString(opfContent, 'text/xml');
        
        // Get metadata
        const metadata = this.extractMetadata(opfDoc);
        
        // Get content items
        const manifest = opfDoc.querySelector('manifest');
        const spine = opfDoc.querySelector('spine');
        
        const contentItems = [];
        if (spine) {
            const itemrefs = spine.querySelectorAll('itemref');
            const basePath = contentPath.substring(0, contentPath.lastIndexOf('/') + 1);
            
            for (const itemref of itemrefs) {
                const idref = itemref.getAttribute('idref');
                const manifestItem = manifest.querySelector(`item[id="${idref}"]`);
                if (manifestItem) {
                    const href = manifestItem.getAttribute('href');
                    const fullPath = basePath + href;
                    const contentFile = zip.file(fullPath);
                    if (contentFile) {
                        const content = await contentFile.async('string');
                        contentItems.push({
                            id: idref,
                            content: content,
                            mediaType: manifestItem.getAttribute('media-type')
                        });
                    }
                }
            }
        }

        return {
            metadata,
            content: contentItems
        };
    }

    extractMetadata(opfDoc) {
        const metadata = {};
        
        const titleEl = opfDoc.querySelector('metadata title, title');
        metadata.title = titleEl ? titleEl.textContent : 'Unknown Title';
        
        const creatorEl = opfDoc.querySelector('metadata creator, creator');
        metadata.author = creatorEl ? creatorEl.textContent : 'Unknown Author';
        
        return metadata;
    }

    async createPDF(epubData, progressCallback) {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Add metadata
        pdf.setProperties({
            title: epubData.metadata.title,
            author: epubData.metadata.author
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        // Add title page
        pdf.setFontSize(24);
        pdf.setFont(undefined, 'bold');
        pdf.text(epubData.metadata.title, pageWidth / 2, 40, { align: 'center' });
        
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'normal');
        pdf.text('by ' + epubData.metadata.author, pageWidth / 2, 55, { align: 'center' });
        
        pdf.addPage();
        yPosition = margin;

        // Process content
        const totalItems = epubData.content.length;
        for (let i = 0; i < totalItems; i++) {
            const item = epubData.content[i];
            
            if (item.mediaType === 'application/xhtml+xml' || item.mediaType === 'text/html') {
                // Parse HTML content
                const parser = new DOMParser();
                const doc = parser.parseFromString(item.content, 'text/html');
                
                // Extract text from HTML
                const textContent = this.extractTextFromHTML(doc.body);
                
                // Add text to PDF
                pdf.setFontSize(11);
                pdf.setFont(undefined, 'normal');
                
                for (const paragraph of textContent) {
                    if (yPosition > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    
                    const lines = pdf.splitTextToSize(paragraph, maxWidth);
                    for (const line of lines) {
                        if (yPosition > pageHeight - margin) {
                            pdf.addPage();
                            yPosition = margin;
                        }
                        pdf.text(line, margin, yPosition);
                        yPosition += 6;
                    }
                    yPosition += 3; // Extra space between paragraphs
                }
            }
            
            // Update progress
            const itemProgress = 50 + (i / totalItems) * 40;
            progressCallback(itemProgress);
        }

        return pdf;
    }

    extractTextFromHTML(element) {
        const paragraphs = [];
        
        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) {
                    return text;
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                
                // Block elements create new paragraphs
                if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                    const text = Array.from(node.childNodes)
                        .map(child => processNode(child))
                        .filter(t => t)
                        .join(' ');
                    if (text) {
                        paragraphs.push(text);
                    }
                    return '';
                } else {
                    // Inline elements
                    return Array.from(node.childNodes)
                        .map(child => processNode(child))
                        .join('');
                }
            }
            return '';
        };

        Array.from(element.children).forEach(child => {
            processNode(child);
        });

        return paragraphs;
    }
}

const processor = new EPUBToPDFProcessor();

export default {
    convert: (file, progressCallback) => processor.convert(file, progressCallback)
};
