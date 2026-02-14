import { useState } from 'react';
import Dropzone from '../shared/Dropzone';
import Button from '../shared/Button';
import ProgressBar from '../shared/ProgressBar';
import { useMode } from '../context/ModeContext';
import imageCompressorProcessor from '../tools/image/image-compressor/processor';
import imageConverterProcessor from '../tools/image/image-converter/processor';
import { processor as imageResizerProcessor } from '../tools/image/image-resizer/processor';
import { processor as pdfCompressorProcessor } from '../tools/pdf/pdf-compressor/processor';
import { processor as pdfConverterProcessor } from '../tools/pdf/pdf-converter/processor';
import { processor as audioCompressorProcessor } from '../tools/audio/audio-compressor/processor';
import { processor as audioConverterProcessor } from '../tools/audio/audio-converter/processor';
import { processor as videoCompressorProcessor } from '../tools/video/video-compressor/processor';
import { processor as videoConverterProcessor } from '../tools/video/video-converter/processor';
import wordToPdfProcessor from '../tools/pdf/word-to-pdf/processor';
import excelToPdfProcessor from '../tools/pdf/excel-to-pdf/processor';
import powerpointToPdfProcessor from '../tools/pdf/powerpoint-to-pdf/processor';
import epubToPdfProcessor from '../tools/document/epub-to-pdf/processor';

/**
 * Quick Converter Component
 * Allows users to drop files on the landing page and perform operations
 * without navigating to specific tool pages
 */
export default function QuickConverter() {
    const { isOnlineMode: _isOnlineMode } = useMode(); // Reserved for future mode-based filtering
    const [files, setFiles] = useState([]);
    const [selectedOperation, setSelectedOperation] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    
    // Tool-specific options
    const [quality, setQuality] = useState(80); // For image/video compression
    const [outputFormat, setOutputFormat] = useState('png'); // For image/pdf/audio/video conversion
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [pdfCompressionLevel, setPdfCompressionLevel] = useState('balanced'); // For PDF compression: low, balanced, high
    const [pageRange, setPageRange] = useState('all'); // For PDF conversion: all, first
    const [audioBitrate, setAudioBitrate] = useState('192'); // For audio compression
    const [videoQuality, setVideoQuality] = useState('medium'); // For video compression: low, medium, high

    // Detect file type and suggest operations
    const getOperationsForFile = (file) => {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        
        const operations = [];

        // Image operations
        if (fileType.startsWith('image/')) {
            operations.push(
                { id: 'compress-image', name: 'Compress Image', icon: '🖼️' },
                { id: 'convert-image', name: 'Convert Image', icon: '🔄' },
                { id: 'resize-image', name: 'Resize Image', icon: '📏' },
                { id: 'crop-image', name: 'Crop Image', icon: '✂️' },
                { id: 'remove-background', name: 'Remove Background', icon: '🎨' },
                { id: 'watermark', name: 'Add Watermark', icon: '©️' },
                { id: 'image-to-pdf', name: 'Convert to PDF', icon: '📄' }
            );
        }

        // PDF operations
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            operations.push(
                { id: 'compress-pdf', name: 'Compress PDF', icon: '📄' },
                { id: 'convert-pdf', name: 'PDF to Image', icon: '🖼️' },
                { id: 'split-pdf', name: 'Split PDF', icon: '✂️' }
            );
        }

        // Audio operations
        if (fileType.startsWith('audio/')) {
            operations.push(
                { id: 'compress-audio', name: 'Compress Audio', icon: '🎵' },
                { id: 'convert-audio', name: 'Convert Audio', icon: '🔄' },
                { id: 'video-to-mp3', name: 'Extract Audio', icon: '🎬' }
            );
        }

        // Video operations
        if (fileType.startsWith('video/')) {
            operations.push(
                { id: 'compress-video', name: 'Compress Video', icon: '🎬' },
                { id: 'video-converter', name: 'Convert Video', icon: '🔄' },
                { id: 'video-to-mp3', name: 'Extract Audio', icon: '🎵' },
                { id: 'video-to-gif', name: 'Convert to GIF', icon: '🎞️' }
            );
        }

        // Document operations
        if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            operations.push(
                { id: 'word-to-pdf', name: 'Word to PDF', icon: '📝' }
            );
        }

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            operations.push(
                { id: 'excel-to-pdf', name: 'Excel to PDF', icon: '📈' }
            );
        }

        if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
            operations.push(
                { id: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', icon: '📊' }
            );
        }

        if (fileName.endsWith('.epub')) {
            operations.push(
                { id: 'epub-to-pdf', name: 'EPUB to PDF', icon: '📚' }
            );
        }

        // If no specific operations, suggest general tools
        if (operations.length === 0) {
            operations.push(
                { id: 'qr-generator', name: 'Generate QR Code', icon: '📱' },
                { id: 'password-generator', name: 'Password Generator', icon: '🔐' },
                { id: 'unit-converter', name: 'Unit Converter', icon: '📏' }
            );
        }

        return operations;
    };

    const handleFileSelect = (file) => {
        setFiles(prevFiles => [...prevFiles, file]);
        setError('');
        setSelectedOperation('');
        setShowOptions(false);
        setResults([]);
    };

    const handleRemoveFile = (index) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
        if (files.length === 1) {
            setSelectedOperation('');
            setShowOptions(false);
            setResults([]);
        }
    };

    const handleOperationSelect = (operationId) => {
        setSelectedOperation(operationId);
        setShowOptions(true);
        setError('');
        setResults([]);
        
        // Set default output formats based on operation
        if (operationId === 'convert-image' || operationId === 'convert-pdf') {
            setOutputFormat('png');
        } else if (operationId === 'convert-audio') {
            setOutputFormat('mp3');
        } else if (operationId === 'video-converter') {
            setOutputFormat('mp4');
        }
    };

    const handleProcess = async () => {
        if (!selectedOperation || files.length === 0) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);
        const processedResults = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                let result;

                // Update progress
                setProgress(Math.round((i / files.length) * 100));

                switch (selectedOperation) {
                    case 'compress-image':
                        result = await imageCompressorProcessor.compress(
                            file,
                            quality,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        break;

                    case 'convert-image':
                        const widthNum = width ? parseInt(width) : null;
                        const heightNum = height ? parseInt(height) : null;
                        result = await imageConverterProcessor.convert(
                            file,
                            outputFormat,
                            widthNum,
                            heightNum,
                            true, // maintain aspect ratio
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        break;

                    case 'resize-image':
                        const resizeWidth = width ? parseInt(width) : 800;
                        const resizeHeight = height ? parseInt(height) : 600;
                        const resizeResult = await imageResizerProcessor.resize(
                            file,
                            resizeWidth,
                            resizeHeight,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        // Convert to expected format
                        result = {
                            file: new File([await fetch(resizeResult.url).then(r => r.blob())], resizeResult.filename, { type: file.type }),
                            originalSize: file.size,
                            convertedSize: resizeResult.size
                        };
                        break;

                    case 'compress-pdf':
                        const pdfBlob = await pdfCompressorProcessor.compress(
                            file,
                            pdfCompressionLevel,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([pdfBlob], file.name.replace(/\.pdf$/i, '_compressed.pdf'), { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: pdfBlob.size
                        };
                        break;

                    case 'convert-pdf':
                        const pdfImages = await pdfConverterProcessor.convert(
                            file,
                            outputFormat,
                            pageRange,
                            '',
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        // For PDF conversion, we get multiple images, so we'll process the first one
                        // and add a note about multiple pages
                        if (pdfImages.length > 0) {
                            const firstImage = pdfImages[0];
                            result = {
                                file: new File([firstImage.blob], `${file.name.replace(/\.pdf$/i, '')}_page1.${outputFormat}`, { type: firstImage.blob.type }),
                                originalSize: file.size,
                                convertedSize: firstImage.blob.size,
                                note: pdfImages.length > 1 ? `Converted ${pdfImages.length} pages (showing first page)` : null
                            };
                        }
                        break;

                    case 'compress-audio':
                        const audioBlob = await audioCompressorProcessor.compress(
                            file,
                            parseInt(audioBitrate),
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([audioBlob], file.name.replace(/\.[^.]+$/, '.mp3'), { type: 'audio/mpeg' }),
                            originalSize: file.size,
                            convertedSize: audioBlob.size
                        };
                        break;

                    case 'convert-audio':
                        const convertedAudio = await audioConverterProcessor.convert(
                            file,
                            outputFormat,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([convertedAudio.blob], convertedAudio.filename, { type: convertedAudio.blob.type }),
                            originalSize: file.size,
                            convertedSize: convertedAudio.blob.size
                        };
                        break;

                    case 'compress-video':
                        const videoBlob = await videoCompressorProcessor.compress(
                            file,
                            videoQuality,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([videoBlob], file.name.replace(/\.[^.]+$/, '_compressed.mp4'), { type: 'video/mp4' }),
                            originalSize: file.size,
                            convertedSize: videoBlob.size
                        };
                        break;

                    case 'video-converter':
                        const convertedVideo = await videoConverterProcessor.convert(
                            file,
                            outputFormat,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([convertedVideo.blob], convertedVideo.filename, { type: convertedVideo.blob.type }),
                            originalSize: file.size,
                            convertedSize: convertedVideo.blob.size
                        };
                        break;

                    case 'word-to-pdf':
                        const wordPdfBlob = await wordToPdfProcessor.convert(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([wordPdfBlob], file.name.replace(/\.(doc|docx)$/i, '.pdf'), { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: wordPdfBlob.size
                        };
                        break;

                    case 'excel-to-pdf':
                        const excelPdfBlob = await excelToPdfProcessor.convert(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([excelPdfBlob], file.name.replace(/\.(xls|xlsx)$/i, '.pdf'), { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: excelPdfBlob.size
                        };
                        break;

                    case 'powerpoint-to-pdf':
                        const pptPdfBlob = await powerpointToPdfProcessor.convert(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([pptPdfBlob], file.name.replace(/\.(ppt|pptx)$/i, '.pdf'), { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: pptPdfBlob.size
                        };
                        break;

                    case 'epub-to-pdf':
                        const epubPdfBlob = await epubToPdfProcessor.convert(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([epubPdfBlob], file.name.replace(/\.epub$/i, '.pdf'), { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: epubPdfBlob.size
                        };
                        break;

                    default:
                        throw new Error(`Operation ${selectedOperation} is not yet supported in Quick Converter. Please use the dedicated tool page.`);
                }

                processedResults.push({
                    original: file,
                    result: result,
                    index: i
                });
            }

            setProgress(100);
            setResults(processedResults);
        } catch (err) {
            setError(err.message || 'Processing failed. Please try again.');
            console.error('Processing error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = (result) => {
        if (!result || !result.file) return;

        const url = URL.createObjectURL(result.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadAll = () => {
        results.forEach(({ result }) => {
            handleDownload(result);
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Get operations based on the first file
    const availableOperations = files.length > 0 ? getOperationsForFile(files[0]) : [];

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    Quick File Converter
                </h2>
                <p className="text-lg text-gray-600">
                    Drop your files here, choose an operation, and convert instantly
                </p>
            </div>

            <div className="card mb-6">
                {files.length === 0 ? (
                    <Dropzone
                        onFileSelect={handleFileSelect}
                        multiple={true}
                        label="Drop your files here"
                        description="Supports images, PDFs, videos, audio, and documents"
                    />
                ) : (
                    <div className="space-y-4">
                        {/* File List */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Selected Files ({files.length})
                                </h3>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setFiles([]);
                                        setSelectedOperation('');
                                        setShowOptions(false);
                                        setResults([]);
                                    }}
                                >
                                    Clear All
                                </Button>
                            </div>

                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="text-3xl">
                                            {file.type.startsWith('image/') ? '🖼️' :
                                             file.type.startsWith('video/') ? '🎬' :
                                             file.type.startsWith('audio/') ? '🎵' :
                                             file.type === 'application/pdf' ? '📄' : '📁'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFile(index)}
                                        className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        aria-label="Remove file"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}

                            {/* Add More Files Button */}
                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => {
                                        const newFiles = Array.from(e.target.files);
                                        newFiles.forEach(handleFileSelect);
                                        e.target.value = '';
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 hover:bg-gray-50 transition-all cursor-pointer">
                                    <p className="text-gray-600 font-medium">
                                        ➕ Add More Files
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Operation Selector */}
                        {availableOperations.length > 0 && !showOptions && !results.length && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Choose an Operation
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {availableOperations.map((operation) => (
                                        <button
                                            key={operation.id}
                                            onClick={() => handleOperationSelect(operation.id)}
                                            className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                                                selectedOperation === operation.id
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-primary-300'
                                            }`}
                                        >
                                            <div className="text-2xl mb-2">{operation.icon}</div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {operation.name}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tool Options */}
                        {showOptions && !isProcessing && !results.length && (
                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Settings
                                    </h3>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setShowOptions(false);
                                            setSelectedOperation('');
                                        }}
                                    >
                                        Back
                                    </Button>
                                </div>

                                {/* Image Compression Options */}
                                {selectedOperation === 'compress-image' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Quality: {quality}%
                                            </label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="100"
                                                value={quality}
                                                onChange={(e) => setQuality(parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Lower quality = smaller file size
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Image Conversion Options */}
                                {selectedOperation === 'convert-image' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Output Format
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['png', 'jpg', 'webp'].map((format) => (
                                                    <button
                                                        key={format}
                                                        onClick={() => setOutputFormat(format)}
                                                        className={`p-3 rounded-lg border-2 transition-all uppercase font-semibold ${
                                                            outputFormat === format
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {format}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Width (optional)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={width}
                                                    onChange={(e) => setWidth(e.target.value)}
                                                    placeholder="Auto"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Height (optional)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={height}
                                                    onChange={(e) => setHeight(e.target.value)}
                                                    placeholder="Auto"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Leave empty to keep original dimensions. Aspect ratio will be maintained.
                                        </p>
                                    </div>
                                )}

                                {/* Image Resizing Options */}
                                {selectedOperation === 'resize-image' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Width (pixels)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={width}
                                                    onChange={(e) => setWidth(e.target.value)}
                                                    placeholder="800"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Height (pixels)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={height}
                                                    onChange={(e) => setHeight(e.target.value)}
                                                    placeholder="600"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Specify target dimensions. Defaults to 800x600 if not specified.
                                        </p>
                                    </div>
                                )}

                                {/* PDF Compression Options */}
                                {selectedOperation === 'compress-pdf' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Compression Level
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['low', 'balanced', 'high'].map((level) => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setPdfCompressionLevel(level)}
                                                        className={`p-3 rounded-lg border-2 transition-all capitalize font-semibold ${
                                                            pdfCompressionLevel === level
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Higher compression = smaller file size but may reduce quality
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* PDF Conversion Options */}
                                {selectedOperation === 'convert-pdf' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Output Format
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['png', 'jpg'].map((format) => (
                                                    <button
                                                        key={format}
                                                        onClick={() => setOutputFormat(format)}
                                                        className={`p-3 rounded-lg border-2 transition-all uppercase font-semibold ${
                                                            outputFormat === format
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {format}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Pages to Convert
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: 'all', label: 'All Pages' },
                                                    { id: 'first', label: 'First Page' }
                                                ].map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => setPageRange(option.id)}
                                                        className={`p-3 rounded-lg border-2 transition-all font-semibold ${
                                                            pageRange === option.id
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Audio Compression Options */}
                                {selectedOperation === 'compress-audio' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Bitrate: {audioBitrate} kbps
                                            </label>
                                            <div className="grid grid-cols-4 gap-3">
                                                {['128', '192', '256', '320'].map((bitrate) => (
                                                    <button
                                                        key={bitrate}
                                                        onClick={() => setAudioBitrate(bitrate)}
                                                        className={`p-3 rounded-lg border-2 transition-all font-semibold ${
                                                            audioBitrate === bitrate
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {bitrate}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Lower bitrate = smaller file size but may reduce audio quality
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Audio Conversion Options */}
                                {selectedOperation === 'convert-audio' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Output Format
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['mp3', 'wav', 'ogg'].map((format) => (
                                                    <button
                                                        key={format}
                                                        onClick={() => setOutputFormat(format)}
                                                        className={`p-3 rounded-lg border-2 transition-all uppercase font-semibold ${
                                                            outputFormat === format
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {format}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Video Compression Options */}
                                {selectedOperation === 'compress-video' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Quality Level
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['low', 'medium', 'high'].map((level) => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setVideoQuality(level)}
                                                        className={`p-3 rounded-lg border-2 transition-all capitalize font-semibold ${
                                                            videoQuality === level
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Lower quality = smaller file size
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Video Conversion Options */}
                                {selectedOperation === 'video-converter' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Output Format
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['mp4', 'webm', 'avi'].map((format) => (
                                                    <button
                                                        key={format}
                                                        onClick={() => setOutputFormat(format)}
                                                        className={`p-3 rounded-lg border-2 transition-all uppercase font-semibold ${
                                                            outputFormat === format
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {format}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Operations that need dedicated tool pages */}
                                {['crop-image', 'remove-background', 'watermark', 'image-to-pdf', 'split-pdf', 'video-to-mp3', 'video-to-gif'].includes(selectedOperation) && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                ℹ️ This operation requires additional settings and is best done on the dedicated tool page. 
                                                You can still select this operation to be redirected to the appropriate tool with your files pre-loaded.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-center pt-4">
                                    <Button
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        className="px-8 py-3 text-lg"
                                    >
                                        {isProcessing ? 'Processing...' : 'Start Conversion'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar */}
                        {isProcessing && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Processing...
                                </h3>
                                <ProgressBar progress={progress} />
                                <p className="text-sm text-gray-600 text-center">
                                    Processing {files.length} file{files.length > 1 ? 's' : ''}...
                                </p>
                            </div>
                        )}

                        {/* Results */}
                        {results.length > 0 && (
                            <div className="space-y-4 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        ✅ Conversion Complete!
                                    </h3>
                                    {results.length > 1 && (
                                        <Button
                                            onClick={handleDownloadAll}
                                            variant="secondary"
                                        >
                                            Download All
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {results.map(({ original, result }, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">
                                                    {result.file.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {formatFileSize(original.size)} → {formatFileSize(result.file.size)}
                                                    {result.originalSize && result.convertedSize && (
                                                        <span className="ml-2 text-green-600 font-semibold">
                                                            ({Math.round((1 - result.convertedSize / result.originalSize) * 100)}% smaller)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => handleDownload(result)}
                                                className="ml-4"
                                            >
                                                Download
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setFiles([]);
                                            setSelectedOperation('');
                                            setShowOptions(false);
                                            setResults([]);
                                        }}
                                    >
                                        Convert More Files
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="text-center text-sm text-gray-500 space-y-2">
                <p className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-green-600">
                        Your files are processed entirely in your browser - no uploads, 100% private
                    </span>
                </p>
                <p>
                    Select files, choose an operation, customize settings, and download - all without leaving this page!
                </p>
            </div>
        </div>
    );
}
