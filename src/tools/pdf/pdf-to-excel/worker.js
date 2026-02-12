/**
 * PDF to Excel Conversion Worker
 * Handles PDF text extraction and Excel file creation using PDF.js and xlsx
 */

import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Configure PDF.js for worker environment
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).href;

// Constants for cell and column processing
const CELL_BOUNDARY_THRESHOLD = 20; // X-coordinate difference to determine new cell
// Note: Using approximate character width for text. This is a simplification that may not
// accurately represent variable-width fonts. For more accurate results, PDF.js text item
// width properties could be used if available in future versions.
const APPROX_CHAR_WIDTH = 5; // Approximate width per character for text
const COLUMN_PADDING = 2; // Extra padding for column width
const MAX_COLUMN_WIDTH = 50; // Maximum column width to prevent overly wide columns

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
        const allRows = [];
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            
            // Group text items by vertical position (rows)
            const rowMap = new Map();
            
            for (const item of content.items) {
                const y = Math.round(item.transform[5]); // Y coordinate
                
                if (!rowMap.has(y)) {
                    rowMap.set(y, []);
                }
                
                rowMap.get(y).push({
                    x: item.transform[4], // X coordinate
                    text: item.str.trim()
                });
            }
            
            // Sort rows by Y coordinate (top to bottom)
            const sortedRows = Array.from(rowMap.entries())
                .sort((a, b) => b[0] - a[0]); // Descending Y (top to bottom)
            
            // Process each row
            for (const [, items] of sortedRows) {
                // Sort items in row by X coordinate (left to right)
                items.sort((a, b) => a.x - b.x);
                
                // Group items that are close together into cells
                const cells = [];
                let currentCell = '';
                let lastX = -Infinity;
                
                for (const item of items) {
                    if (item.text) {
                        // If this item is far from the last one, it's a new cell
                        if (item.x - lastX > CELL_BOUNDARY_THRESHOLD) {
                            if (currentCell.trim()) {
                                cells.push(currentCell.trim());
                            }
                            currentCell = item.text;
                        } else {
                            // Add space if needed
                            currentCell += (currentCell ? ' ' : '') + item.text;
                        }
                        lastX = item.x + (item.text.length * APPROX_CHAR_WIDTH); // Approximate width
                    }
                }
                
                // Add the last cell
                if (currentCell.trim()) {
                    cells.push(currentCell.trim());
                }
                
                // Only add non-empty rows
                if (cells.length > 0) {
                    allRows.push(cells);
                }
            }
            
            // Add a page separator if not the last page
            if (pageNum < numPages) {
                allRows.push(['']); // Empty row as separator
                allRows.push([`--- Page ${pageNum + 1} ---`]);
                allRows.push(['']);
            }
            
            self.postMessage({ 
                type: 'progress', 
                progress: 20 + (pageNum / numPages) * 60 
            });
        }

        self.postMessage({ type: 'progress', progress: 80 });

        // Create Excel workbook
        const workbook = XLSX.utils.book_new();
        
        // Find the maximum number of columns across all rows
        const maxCols = Math.max(...allRows.map(row => row.length));
        
        // Pad rows to have the same number of columns
        const paddedRows = allRows.map(row => {
            const paddedRow = [...row];
            while (paddedRow.length < maxCols) {
                paddedRow.push('');
            }
            return paddedRow;
        });
        
        // Create worksheet from the data
        const worksheet = XLSX.utils.aoa_to_sheet(paddedRows);
        
        // Set column widths
        const colWidths = [];
        for (let i = 0; i < maxCols; i++) {
            const maxWidth = Math.max(
                ...paddedRows.map(row => (row[i] || '').toString().length)
            );
            colWidths.push({ wch: Math.min(maxWidth + COLUMN_PADDING, MAX_COLUMN_WIDTH) });
        }
        worksheet['!cols'] = colWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'PDF Content');

        self.postMessage({ type: 'progress', progress: 90 });

        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { 
            bookType: 'xlsx', 
            type: 'array'
        });
        
        const excelBlob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        self.postMessage({ type: 'progress', progress: 100 });

        self.postMessage({
            type: 'success',
            data: {
                blob: excelBlob,
                pageCount: numPages,
                rowCount: allRows.length
            }
        });
    } catch (error) {
        console.error('PDF to Excel conversion error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'Failed to convert PDF to Excel'
        });
    }
});
