import { useState, useRef } from 'react';
import Button from '../../../shared/Button';
import { useMode } from '../../../context/ModeContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ExcelToPDF = () => {
    const [file, setFile] = useState(null);
    const [converting, setConverting] = useState(false);
    const [convertedPDF, setConvertedPDF] = useState(null);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const { isOnlineMode } = useMode();

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];

            if (!validTypes.includes(selectedFile.type) &&
                !selectedFile.name.match(/\.(xls|xlsx)$/i)) {
                setError('Please select a valid Excel file (.xls or .xlsx)');
                return;
            }

            setFile(selectedFile);
            setError('');
            setConvertedPDF(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            if (!droppedFile.name.match(/\.(xls|xlsx)$/i)) {
                setError('Please drop a valid Excel file (.xls or .xlsx)');
                return;
            }

            setFile(droppedFile);
            setError('');
            setConvertedPDF(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const convertToPDF = async () => {
        if (!file) return;

        setConverting(true);
        setError('');
        setProgress(0);

        try {
            setProgress(10);

            // Read the Excel file
            const arrayBuffer = await file.arrayBuffer();
            setProgress(30);

            // Parse the Excel file
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            setProgress(50);

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
                pdf.autoTable({
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

                setProgress(50 + ((workbook.SheetNames.indexOf(sheetName) + 1) / workbook.SheetNames.length) * 40);
            }

            setProgress(95);

            // Create blob
            const pdfBlob = pdf.output('blob');
            setConvertedPDF(pdfBlob);
            setProgress(100);

        } catch (err) {
            console.error('Conversion error:', err);
            setError(err.message || 'Failed to convert Excel file. Please ensure it\'s a valid Excel file.');
        } finally {
            setConverting(false);
        }
    };

    const handleDownload = () => {
        if (!convertedPDF) return;

        const url = URL.createObjectURL(convertedPDF);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.(xls|xlsx)$/i, '.pdf');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setConvertedPDF(null);
        setError('');
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Excel to PDF Converter
                    </h1>
                    <p className="text-lg text-gray-600">
                        Convert Microsoft Excel spreadsheets to PDF format
                    </p>
                </div>

                {/* Main Converter */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="border-3 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-green-400 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center">
                                <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    Drop Excel file here or click to browse
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Supports XLS and XLSX formats
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                                    Select Excel File
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* File Info */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                                <path d="M14 2v6h6" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{file.name}</h3>
                                            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                                    <p className="text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {converting && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Converting...</span>
                                        <span className="text-sm font-medium text-gray-700">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-green-600 to-teal-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                {!convertedPDF ? (
                                    <Button
                                        onClick={convertToPDF}
                                        disabled={converting}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                                    >
                                        {converting ? 'Converting...' : 'Convert to PDF'}
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleDownload}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                        >
                                            Download PDF
                                        </Button>
                                        <Button
                                            onClick={handleReset}
                                            variant="secondary"
                                        >
                                            Convert Another
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">All Worksheets</h3>
                        <p className="text-gray-600 text-sm">
                            Converts all worksheets in your Excel file to separate PDF pages
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Table Formatting</h3>
                        <p className="text-gray-600 text-sm">
                            Preserves table structure and data formatting in the PDF output
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Client-Side</h3>
                        <p className="text-gray-600 text-sm">
                            All conversion happens locally - your files never leave your device
                        </p>
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">How do I convert Excel to PDF?</h3>
                            <p className="text-gray-600 text-sm">
                                Simply drag and drop your Excel file (XLS or XLSX) into the converter, or click to browse and select your file. Then click "Convert to PDF" and download the result.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Are all worksheets converted?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes, all worksheets in your Excel file will be converted to separate pages in the PDF, with each worksheet's name displayed as a title.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Will formulas be included?</h3>
                            <p className="text-gray-600 text-sm">
                                The PDF will show the calculated values from your formulas, not the formulas themselves. This is similar to printing an Excel file.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is the conversion secure?</h3>
                            <p className="text-gray-600 text-sm">
                                Yes! All conversions happen locally in your browser. Your Excel files are never uploaded to any server, ensuring complete privacy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelToPDF;
