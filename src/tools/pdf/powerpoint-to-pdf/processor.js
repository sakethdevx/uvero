import JSZip from 'jszip';
import jsPDF from 'jspdf';

/**
 * PowerPoint to PDF Processor
 * Converts PPTX files to PDF with basic placeholders (browser limitation)
 */

const convert = async (file, onProgress = () => {}) => {
    try {
        // Check if file is PPTX
        if (!file.name.endsWith('.pptx')) {
            throw new Error('Currently only PPTX format is supported.');
        }

        onProgress(10);

        // Read the file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        onProgress(20);

        // Load the presentation using JSZip to extract content
        const zip = await JSZip.loadAsync(arrayBuffer);
        onProgress(30);

        // Extract basic presentation info
        let slideCount = 0;
        const slideFiles = Object.keys(zip.files).filter(name => 
            name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
        );
        slideCount = slideFiles.length;

        if (slideCount === 0) {
            throw new Error('No slides found in the presentation');
        }

        onProgress(40);

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = 297; // A4 landscape width in mm
        const pageHeight = 210; // A4 landscape height in mm
        const margin = 10;

        // Since we can't easily render PPTX slides without a full rendering engine,
        // we'll create a placeholder message explaining the limitation
        const infoText = [
            'PowerPoint to PDF Conversion',
            '',
            `Presentation: ${file.name}`,
            `Slides: ${slideCount}`,
            '',
            'Note: Full slide rendering requires server-side processing.',
            'This client-side converter extracts basic information.',
            '',
            'For full conversion with slide content, images, and formatting,',
            'please use a dedicated PowerPoint viewer or server-based solution.'
        ];

        pdf.setFontSize(16);
        pdf.text('PowerPoint to PDF Converter', margin, margin + 10);
        
        pdf.setFontSize(12);
        let yPos = margin + 25;
        infoText.forEach(line => {
            pdf.text(line, margin, yPos);
            yPos += 7;
        });

        onProgress(70);

        // Add placeholder pages for each slide (limit to 10 for demo purposes)
        const MAX_PLACEHOLDER_SLIDES = 10;
        for (let i = 1; i <= Math.min(slideCount, MAX_PLACEHOLDER_SLIDES); i++) {
            pdf.addPage();
            pdf.setFontSize(24);
            pdf.text(`Slide ${i}`, pageWidth / 2, pageHeight / 2, { align: 'center' });
            pdf.setFontSize(12);
            pdf.text('Content extraction from PPTX is limited in browser environment', 
                pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
        }

        onProgress(90);

        // Create blob
        const pdfBlob = pdf.output('blob');

        onProgress(100);

        return pdfBlob;

    } catch (error) {
        console.error('PowerPoint to PDF conversion error:', error);
        throw new Error('Failed to convert PowerPoint to PDF: ' + error.message);
    }
};

export default {
    convert
};
