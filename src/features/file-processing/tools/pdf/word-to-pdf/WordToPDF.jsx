import { useState, useRef } from 'react';
import Button from '../../../shared/Button';
import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const WordToPDF = () => {
    const [file, setFile] = useState(null);
    const [converting, setConverting] = useState(false);
    const [convertedPDF, setConvertedPDF] = useState(null);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Check file type - only DOCX supported (mammoth limitation)
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!validTypes.includes(selectedFile.type) &&
                !selectedFile.name.match(/\.docx$/i)) {
                setError('Please select a valid Word document (.docx only). Legacy .doc format is not supported.');
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
            const validTypes = [
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!validTypes.includes(droppedFile.type) &&
                !droppedFile.name.match(/\.(doc|docx)$/i)) {
                setError('Please drop a valid Word document (.doc or .docx)');
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
            // Check if file is DOCX (mammoth only supports DOCX, not DOC)
            if (!file.name.endsWith('.docx')) {
                setError('Currently only DOCX format is supported. DOC format requires server-side conversion.');
                setConverting(false);
                return;
            }

            setProgress(10);

            // Read the file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            setProgress(20);

            // Extract HTML from DOCX using Mammoth
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setProgress(30);

            if (!result.value) {
                throw new Error('Failed to extract content from document');
            }

            setProgress(40);

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

            setProgress(50);

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

            setProgress(70);

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
                setProgress(70 + ((yPosition / imgHeight) * 20)); // Progress from 70% to 90%

                if (pageNumber > 0) {
                    pdf.addPage();
                }

                // Calculate the portion of the image for this page
                const sourceY = (yPosition / imgWidth) * fullCanvas.width * (fullCanvas.height / fullCanvas.width);
                const sourceHeight = (contentHeight / imgWidth) * fullCanvas.width;

                // Create a temporary canvas for this page
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = fullCanvas.width;
                pageCanvas.height = Math.min(sourceHeight, fullCanvas.height - sourceY);

                const pageCtx = pageCanvas.getContext('2d');
                pageCtx.drawImage(
                    fullCanvas,
                    0, sourceY, // Source position
                    fullCanvas.width, pageCanvas.height, // Source dimensions
                    0, 0, // Destination position
                    pageCanvas.width, pageCanvas.height // Destination dimensions
                );

                // Add this page to the PDF
                const pageImgData = pageCanvas.toDataURL('image/png');
                const thisPageHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;

                pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, thisPageHeight);

                yPosition += contentHeight;
                pageNumber++;
            }

            setProgress(90);

            // Create blob and save
            const pdfBlob = pdf.output('blob');
            setConvertedPDF(pdfBlob);
            setProgress(100);

        } catch (err) {
            console.error('Conversion error:', err);
            setError(err.message || 'Failed to convert document. Please ensure it\'s a valid DOCX file.');
        } finally {
            setConverting(false);
        }
    };

    const handleDownload = () => {
        if (!convertedPDF) return;

        const url = URL.createObjectURL(convertedPDF);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.(doc|docx)$/i, '.pdf');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setConvertedPDF(null);
        setError('');
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
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Word to PDF Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Convert Microsoft Word documents to PDF format
                    </p>
                </div>

                {/* Main Converter */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="border-3 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-red-400 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center">
                                <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Drop Word file here or click to browse
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    Supports DOCX format only
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700">
                                    Select Word File
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* File Info */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                                <path d="M14 2v6h6" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{file.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="text-gray-400 dark:text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {converting && progress > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Converting...</span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-red-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                {!convertedPDF ? (
                                    <>
                                        <Button
                                            onClick={convertToPDF}
                                            disabled={converting}
                                            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                                        >
                                            {converting ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Converting...
                                                </span>
                                            ) : (
                                                'Convert to PDF'
                                            )}
                                        </Button>
                                        <Button
                                            onClick={handleReset}
                                            variant="secondary"
                                        >
                                            Cancel
                                        </Button>
                                    </>
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Format Support</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Converts DOCX format with text and basic formatting preservation
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Conversion</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Quick and efficient conversion process for your documents
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Your documents remain private and are never uploaded to servers
                        </p>
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How do I convert Word to PDF?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Simply drag and drop your Word document (DOCX) into the converter, or click to browse and select your file. Then click "Convert to PDF" and download the result.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What Word formats are supported?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Currently, only DOCX format is supported. Legacy DOC format requires different conversion methods. Most modern versions of Microsoft Word (2007+) use DOCX by default.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is the conversion secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! All conversions happen locally in your browser. Your documents are never uploaded to any server.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Will my formatting be preserved?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                The converter maintains formatting, fonts, images, tables, and other elements from your Word document in the resulting PDF.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WordToPDF;
