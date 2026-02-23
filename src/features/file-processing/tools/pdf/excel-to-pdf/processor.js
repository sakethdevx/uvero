import * as XLSX from 'xlsx-republish';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Excel to PDF Processor
 * Converts Excel files (XLS/XLSX) to PDF using XLSX and jsPDF
 */

const convert = async (file, onProgress = () => {}) => {
    try {
        onProgress(10);

        // Read the Excel file
        const arrayBuffer = await file.arrayBuffer();
        onProgress(30);

        // Parse the Excel file
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        onProgress(50);

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        let isFirstSheet = true;

        // Process each worksheet
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];

            // Convert sheet to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

            if (jsonData.length === 0) continue;

            // Add new page for each sheet (except first)
            if (!isFirstSheet) {
                pdf.addPage();
            }
            isFirstSheet = false;

            // Add sheet title
            pdf.setFontSize(16);
            pdf.setTextColor(40);
            pdf.text(sheetName, 14, 15);

            // Prepare table data
            const tableData = jsonData.map(row =>
                row.map(cell => {
                    if (cell === null || cell === undefined) return '';
                    if (typeof cell === 'object') return JSON.stringify(cell);
                    return String(cell);
                })
            );

            // Create table
            autoTable(pdf, {
                startY: 25,
                head: tableData.length > 0 ? [tableData[0]] : [],
                body: tableData.slice(1),
                theme: 'grid',
                headStyles: {
                    fillColor: [66, 139, 202],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak',
                    halign: 'left'
                },
                columnStyles: {},
                margin: { top: 25, right: 14, bottom: 14, left: 14 },
                didDrawPage: (data) => {
                    // Footer
                    const pageCount = pdf.internal.getNumberOfPages();
                    pdf.setFontSize(8);
                    pdf.setTextColor(150);
                    pdf.text(
                        `Page ${data.pageNumber} of ${pageCount}`,
                        data.settings.margin.left,
                        pdf.internal.pageSize.height - 10
                    );
                }
            });

            onProgress(50 + ((workbook.SheetNames.indexOf(sheetName) + 1) / workbook.SheetNames.length) * 40);
        }

        onProgress(95);

        // Create blob
        const pdfBlob = pdf.output('blob');

        onProgress(100);

        return pdfBlob;

    } catch (error) {
        console.error('Excel to PDF conversion error:', error);
        throw new Error('Failed to convert Excel to PDF: ' + error.message);
    }
};

export default {
    convert
};
