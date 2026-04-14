import * as XLSX from 'xlsx-republish';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    onProgress?.(50);
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

    let isFirstSheet = true;

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (jsonData.length === 0) continue;

        if (!isFirstSheet) {
            pdf.addPage();
        }
        isFirstSheet = false;

        pdf.setFontSize(16);
        pdf.setTextColor(40);
        pdf.text(sheetName, 14, 15);

        const tableData = jsonData.map((row) =>
            row.map((cell) => {
                if (cell === null || cell === undefined) return '';
                if (typeof cell === 'object') return JSON.stringify(cell);
                return String(cell);
            })
        );

        pdf.autoTable({
            startY: 25,
            head: tableData.length > 0 ? [tableData[0]] : [],
            body: tableData.slice(1),
            theme: 'grid',
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
            },
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak',
                halign: 'left',
            },
            columnStyles: {},
            margin: { top: 25, right: 14, bottom: 14, left: 14 },
            didDrawPage: (data) => {
                const pageCount = pdf.internal.getNumberOfPages();
                pdf.setFontSize(8);
                pdf.setTextColor(150);
                pdf.text(
                    `Page ${data.pageNumber} of ${pageCount}`,
                    data.settings.margin.left,
                    pdf.internal.pageSize.height - 10
                );
            },
        });

        onProgress?.(50 + ((workbook.SheetNames.indexOf(sheetName) + 1) / workbook.SheetNames.length) * 40);
    }

    onProgress?.(95);
    const pdfBlob = pdf.output('blob');
    const outputFile = new File([pdfBlob], file.name.replace(/\.(xls|xlsx)$/i, '.pdf'), {
        type: 'application/pdf',
    });

    onProgress?.(100);
    return normalizeSingleFileResult(outputFile, {
        outputSize: outputFile.size,
        sheetCount: workbook.SheetNames.length,
    });
}
