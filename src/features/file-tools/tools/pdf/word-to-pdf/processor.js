import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Word to PDF Processor
 * Converts DOCX files to PDF using mammoth and jsPDF
 */

const convert = async (file, onProgress = () => {}) => {
    try {
        // Check if file is DOCX (mammoth only supports DOCX, not DOC)
        if (!file.name.endsWith('.docx')) {
            throw new Error('Currently only DOCX format is supported.');
        }

        onProgress(10);

        // Read the file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        onProgress(20);

        // Extract HTML from DOCX using Mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });
        onProgress(30);

        if (!result.value) {
            throw new Error('Failed to extract content from document');
        }

        onProgress(40);

        // Create a container to render the full content
        const fullContainer = document.createElement('div');
        fullContainer.style.position = 'absolute';
        fullContainer.style.left = '-9999px';
        fullContainer.style.width = '180mm'; // A4 width minus margins (210 - 30)
        fullContainer.style.fontFamily = 'Arial, sans-serif';
        fullContainer.style.fontSize = '11pt';
        fullContainer.style.lineHeight = '1.6';
        fullContainer.style.backgroundColor = 'white';
        fullContainer.style.padding = '0';
        fullContainer.innerHTML = result.value;
        document.body.appendChild(fullContainer);

        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 100));

        onProgress(50);

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const margin = 15; // Margins in mm

        // Convert the entire content to canvas first
        const fullCanvas = await html2canvas(fullContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        onProgress(70);

        // Remove the container
        document.body.removeChild(fullContainer);

        // Calculate dimensions
        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = (fullCanvas.height * imgWidth) / fullCanvas.width;
        const contentHeight = pageHeight - (2 * margin);

        // Split the canvas into pages
        let yPosition = 0;
        let pageNumber = 0;

        while (yPosition < imgHeight) {
            onProgress(70 + ((yPosition / imgHeight) * 20)); // Progress from 70% to 90%

            if (pageNumber > 0) {
                pdf.addPage();
            }

            // Create a cropped canvas for this page
            const pageCanvas = document.createElement('canvas');
            const pageContext = pageCanvas.getContext('2d');

            // Calculate source height for this page
            const sourceHeight = Math.min(
                (fullCanvas.height * contentHeight) / imgHeight,
                fullCanvas.height - (yPosition * fullCanvas.height / imgHeight)
            );

            pageCanvas.width = fullCanvas.width;
            pageCanvas.height = sourceHeight;

            // Draw the portion of the full canvas onto the page canvas
            pageContext.drawImage(
                fullCanvas,
                0,
                (yPosition * fullCanvas.height / imgHeight),
                fullCanvas.width,
                sourceHeight,
                0,
                0,
                fullCanvas.width,
                sourceHeight
            );

            // Convert canvas to image data
            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.85);

            // Calculate actual height for this page
            const actualPageHeight = Math.min(
                contentHeight,
                imgHeight - yPosition
            );

            // Add image to PDF
            pdf.addImage(pageImgData, 'JPEG', margin, margin, imgWidth, actualPageHeight);

            yPosition += contentHeight;
            pageNumber++;
        }

        onProgress(95);

        // Generate PDF blob
        const pdfBlob = pdf.output('blob');

        onProgress(100);

        return pdfBlob;

    } catch (error) {
        console.error('Word to PDF conversion error:', error);
        throw new Error('Failed to convert Word to PDF: ' + error.message);
    }
};

export default {
    convert
};
