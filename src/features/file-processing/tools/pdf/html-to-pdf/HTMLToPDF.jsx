import { useState } from 'react';
import Button from '../../../shared/Button';
import Dropzone from '../../../shared/Dropzone';
import ProgressBar from '../../../shared/ProgressBar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const HTMLToPDF = () => {
    const [file, setFile] = useState(null);
    const [converting, setConverting] = useState(false);
    const [convertedPDF, setConvertedPDF] = useState(null);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setError('');
        setConvertedPDF(null);
        setProgress(0);
    };

    const convertToPDF = async () => {
        if (!file) return;

        setConverting(true);
        setError('');
        setProgress(0);

        try {
            setProgress(10);

            // Read the HTML file
            const htmlContent = await file.text();
            setProgress(30);

            // Create a temporary container for the HTML content
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.width = '180mm'; // A4 width minus margins
            container.style.fontFamily = 'Arial, sans-serif';
            container.style.fontSize = '11pt';
            container.style.lineHeight = '1.6';
            container.style.backgroundColor = 'white';
            container.style.padding = '0';
            container.innerHTML = htmlContent;
            document.body.appendChild(container);

            // Wait for any images to load
            const images = container.querySelectorAll('img');
            await Promise.all(
                Array.from(images).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                })
            );

            setProgress(50);

            // Convert the entire content to canvas
            const fullCanvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            setProgress(70);

            // Remove the container
            document.body.removeChild(container);

            // Create PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const margin = 15; // Margins in mm

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
                    0, sourceY,
                    fullCanvas.width, pageCanvas.height,
                    0, 0,
                    pageCanvas.width, pageCanvas.height
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
            setError(err.message || 'Failed to convert HTML file. Please ensure it\'s a valid HTML file.');
        } finally {
            setConverting(false);
        }
    };

    const handleDownload = () => {
        if (!convertedPDF) return;

        const url = URL.createObjectURL(convertedPDF);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace(/\.html?$/i, '.pdf');
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
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-gray-900 to-indigo-50 dark:to-gray-800 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        HTML to PDF Converter
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Convert HTML files and web pages to PDF format
                    </p>
                </div>

                {/* Main Converter */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {!file ? (
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            accept=".html,.htm,text/html"
                            maxSize={10 * 1024 * 1024}
                            label="Drop your HTML file here or click to browse"
                            description="HTML and HTM files (Max 10MB)"
                        />
                    ) : (
                        <div>
                            {/* File Info */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
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
                                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded">
                                    <p className="text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {converting && (
                                <div className="mb-6">
                                    <ProgressBar progress={progress} label="Converting..." />
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                {!convertedPDF ? (
                                    <Button
                                        onClick={convertToPDF}
                                        disabled={converting}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Client-Side Processing</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            All conversion happens in your browser - no uploads required
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Conversion</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Quick and efficient HTML to PDF conversion with formatting preserved
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure & Private</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Your HTML files remain private and are never uploaded to any server
                        </p>
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How do I convert HTML to PDF?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Simply drag and drop your HTML file into the converter, or click to browse and select your file. Then click "Convert to PDF" and download the result.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What HTML features are supported?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Most HTML elements including text, images, tables, and basic CSS styling are supported. Complex JavaScript and external resources may not render correctly.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Is the conversion secure?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes! All conversions happen locally in your browser. Your HTML files are never uploaded to any server, ensuring complete privacy.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Will images in my HTML be included?</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Yes, embedded images will be included in the PDF. External images may require a stable internet connection to load before conversion.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HTMLToPDF;
