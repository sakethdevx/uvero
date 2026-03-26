import { useState, useCallback } from 'react';
import Dropzone from '../shared/Dropzone';
import Button from '../shared/Button';
import ProgressBar from '../shared/ProgressBar';
import InteractiveCropSelector from './InteractiveCropSelector';
import { useMode } from '../context/ModeContext';
import imageCompressorProcessor from '../tools/image/image-compressor/processor';
import imageConverterProcessor from '../tools/image/image-converter/processor';
import { processor as imageResizerProcessor } from '../tools/image/image-resizer/processor';
import { processor as imageCropperProcessor } from '../tools/image/image-cropper/processor';
import { processor as backgroundRemoverProcessor } from '../tools/image/background-remover/processor';
import { processor as watermarkProcessor } from '../tools/image/watermark/processor';
import { processor as imageToPdfProcessor } from '../tools/image/image-to-pdf/processor';
import { processor as gifMakerProcessor } from '../tools/image/gif-maker/processor';
import { processor as pdfCompressorProcessor } from '../tools/pdf/pdf-compressor/processor';
import { processor as pdfConverterProcessor } from '../tools/pdf/pdf-converter/processor';
import { processor as pdfSplitterProcessor } from '../tools/pdf/pdf-splitter/processor';
import { processor as pdfMergerProcessor } from '../tools/pdf/pdf-merger/processor';
import { processor as pdfToWordProcessor } from '../tools/pdf/pdf-to-word/processor';
import { processor as pdfToExcelProcessor } from '../tools/pdf/pdf-to-excel/processor';
import { processor as pdfToPowerPointProcessor } from '../tools/pdf/pdf-to-powerpoint/processor';
import { processor as audioCompressorProcessor } from '../tools/audio/audio-compressor/processor';
import { processor as audioConverterProcessor } from '../tools/audio/audio-converter/processor';
import { processor as videoCompressorProcessor } from '../tools/video/video-compressor/processor';
import { processor as videoConverterProcessor } from '../tools/video/video-converter/processor';
import videoToMp3Processor from '../tools/audio/video-to-mp3/processor';
import wordToPdfProcessor from '../tools/pdf/word-to-pdf/processor';
import excelToPdfProcessor from '../tools/pdf/excel-to-pdf/processor';
import powerpointToPdfProcessor from '../tools/pdf/powerpoint-to-pdf/processor';
import epubToPdfProcessor from '../tools/document/epub-to-pdf/processor';
import { processor as rotatePdfProcessor } from '../tools/pdf/rotate-pdf/processor';
import { processor as repairPdfProcessor } from '../tools/pdf/repair-pdf/processor';
import { processor as cropPdfProcessor } from '../tools/pdf/crop-pdf/processor';
import { processor as pageNumbersProcessor } from '../tools/pdf/page-numbers/processor';
import { processor as watermarkPdfProcessor } from '../tools/pdf/watermark-pdf/processor';
import { processor as ocrPdfProcessor } from '../tools/pdf/ocr-pdf/processor';
import { processor as unlockPdfProcessor } from '../tools/pdf/unlock-pdf/processor';
import { processor as protectPdfProcessor } from '../tools/pdf/protect-pdf/processor';
import { validatePdfPassword as validatePassword, MIN_PASSWORD_LENGTH } from '../utils/passwordValidation';

const WATERMARK_POSITIONS = [
    { value: 'top-left', label: '↖ Top Left' },
    { value: 'top-center', label: '↑ Top Center' },
    { value: 'top-right', label: '↗ Top Right' },
    { value: 'center', label: '⏺ Center' },
    { value: 'bottom-left', label: '↙ Bottom Left' },
    { value: 'bottom-center', label: '↓ Bottom Center' },
    { value: 'bottom-right', label: '↘ Bottom Right' },
];

/**
 * Quick Converter Component
 * Allows users to drop files on the landing page and perform operations
 * without navigating to specific tool pages
 */
export default function QuickConverter() {
    const { isOnlineMode: _isOnlineMode } = useMode();
    const [files, setFiles] = useState([]);
    const [selectedOperation, setSelectedOperation] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);
    const [showOptions, setShowOptions] = useState(false);

    // Tool-specific options
    const [quality, setQuality] = useState(80);
    const [outputFormat, setOutputFormat] = useState('png');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [convertQuality, setConvertQuality] = useState(92);
    // Watermark options
    const [watermarkText, setWatermarkText] = useState('Watermark');
    const [watermarkFontSize, setWatermarkFontSize] = useState(24);
    const [watermarkOpacity, setWatermarkOpacity] = useState(50);
    const [watermarkPosition, setWatermarkPosition] = useState('center');
    const [watermarkColor, setWatermarkColor] = useState('#000000');
    // Interactive manual crop coordinates from InteractiveCropSelector
    const [manualCropData, setManualCropData] = useState(null);
    const [pdfCompressionLevel, setPdfCompressionLevel] = useState('balanced');
    const [pageRange, setPageRange] = useState('all');
    const [audioBitrate, setAudioBitrate] = useState('192');
    const [videoQuality, setVideoQuality] = useState('medium');
    const [pdfSplitMode, setPdfSplitMode] = useState('all');
    const [pdfTotalPages, setPdfTotalPages] = useState(0);
    const [pdfPageSpec, setPdfPageSpec] = useState('');
    const [pdfPassword, setPdfPassword] = useState('');
    const [pdfPasswordConfirm, setPdfPasswordConfirm] = useState('');
    const [pdfRotationAngle, setPdfRotationAngle] = useState(90);
    const [pageNumberPosition, setPageNumberPosition] = useState('bottom-center');
    const [pageNumberStart, setPageNumberStart] = useState(1);



    const validatePdfPassword = useCallback(() => {
        return validatePassword(pdfPassword, pdfPasswordConfirm);
    }, [pdfPassword, pdfPasswordConfirm]);

    const getOperationsForFile = (file) => {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        const operations = [];

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

        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            operations.push(
                { id: 'compress-pdf', name: 'Compress PDF', icon: '📄' },
                { id: 'convert-pdf', name: 'PDF to Image', icon: '🖼️' },
                { id: 'split-pdf', name: 'Split PDF', icon: '✂️' },
                { id: 'merge-pdf', name: 'Merge PDFs', icon: '📑' },
                { id: 'pdf-to-word', name: 'PDF to Word', icon: '📝' },
                { id: 'pdf-to-excel', name: 'PDF to Excel', icon: '📊' },
                { id: 'pdf-to-powerpoint', name: 'PDF to PowerPoint', icon: '📽️' },
                { id: 'rotate-pdf', name: 'Rotate PDF', icon: '🔄' },
                { id: 'watermark-pdf', name: 'Watermark PDF', icon: '💧' },
                { id: 'protect-pdf', name: 'Protect PDF', icon: '🔒' },
                { id: 'unlock-pdf', name: 'Unlock PDF', icon: '🔓' },
                { id: 'page-numbers', name: 'Page Numbers', icon: '#️⃣' },
                { id: 'repair-pdf', name: 'Repair PDF', icon: '🔧' },
                { id: 'crop-pdf', name: 'Crop PDF', icon: '✂️' },
                { id: 'ocr-pdf', name: 'OCR PDF', icon: '👁️' }
            );
        }

        if (fileType.startsWith('audio/')) {
            operations.push(
                { id: 'compress-audio', name: 'Compress Audio', icon: '🎵' },
                { id: 'convert-audio', name: 'Convert Audio', icon: '🔄' }
            );
        }

        if (fileType.startsWith('video/')) {
            operations.push(
                { id: 'compress-video', name: 'Compress Video', icon: '🎬' },
                { id: 'video-converter', name: 'Convert Video', icon: '🔄' },
                { id: 'video-to-mp3', name: 'Extract Audio', icon: '🎵' },
                { id: 'video-to-gif', name: 'Convert to GIF', icon: '🎞️' }
            );
        }

        if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            operations.push({ id: 'word-to-pdf', name: 'Word to PDF', icon: '📝' });
        }

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            operations.push({ id: 'excel-to-pdf', name: 'Excel to PDF', icon: '📈' });
        }

        if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
            operations.push({ id: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', icon: '📊' });
        }

        if (fileName.endsWith('.epub')) {
            operations.push({ id: 'epub-to-pdf', name: 'EPUB to PDF', icon: '📚' });
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
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        if (newFiles.length === 0) {
            setSelectedOperation('');
            setShowOptions(false);
            setResults([]);
        }
    };

    const handleOperationSelect = async (operationId) => {
        setSelectedOperation(operationId);
        setShowOptions(true);
        setError('');
        setResults([]);

        if (operationId === 'convert-image' || operationId === 'convert-pdf') {
            setOutputFormat('png');
        } else if (operationId === 'convert-audio') {
            setOutputFormat('mp3');
        } else if (operationId === 'video-converter') {
            setOutputFormat('mp4');
        }

        if (operationId === 'split-pdf' && files.length > 0) {
            try {
                const pageInfo = await pdfSplitterProcessor.getPageInfo(files[0]);
                setPdfTotalPages(pageInfo.totalPages);
            } catch (err) {
                setError('Failed to read PDF information: ' + err.message);
            }
        }
    };

    const handleProcess = async () => {
        if (!selectedOperation || files.length === 0) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);
        const processedResults = [];

        try {
            if (selectedOperation === 'merge-pdf') {
                const allPdfs = files.every(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
                if (!allPdfs) throw new Error('All files must be PDF files for merging');
                if (files.length < 2) throw new Error('Please select at least 2 PDF files to merge');

                const mergeResult = await pdfMergerProcessor.merge(files, (prog) => setProgress(prog));
                const mergeBlob = await fetch(mergeResult.url).then(r => r.blob());
                URL.revokeObjectURL(mergeResult.url);

                const resultFile = new File([mergeBlob], mergeResult.filename, { type: 'application/pdf' });
                processedResults.push({
                    original: null,
                    result: { file: resultFile, size: resultFile.size },
                    isMerged: true,
                    sourceFiles: files.map(f => f.name)
                });
                setResults(processedResults);
                setProgress(100);
                setIsProcessing(false);
                return;
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                let result;
                const setItemProgress = (p) => setProgress(Math.round((i / files.length) * 100 + (p / files.length)));

                switch (selectedOperation) {
                    case 'compress-image':
                        result = await imageCompressorProcessor.compress(file, quality, setItemProgress);
                        break;
                    case 'convert-image':
                        result = await imageConverterProcessor.convert(file, outputFormat, parseInt(width) || null, parseInt(height) || null, maintainAspectRatio, convertQuality, setItemProgress);
                        break;
                    case 'resize-image': {
                        const rw = parseInt(width) || null;
                        const rh = parseInt(height) || null;
                        if (!rw && !rh) throw new Error('Please enter a target width or height for resizing.');
                        const targetW = rw || (rh && files[0] ? Math.round(rh * 1) : 800);
                        const targetH = rh || (rw && files[0] ? Math.round(rw * 1) : 600);
                        const r = await imageResizerProcessor.resize(file, targetW, targetH, setItemProgress);
                        result = { file: new File([await fetch(r.url).then(res => res.blob())], r.filename, { type: file.type }) };
                        URL.revokeObjectURL(r.url);
                        break;
                    }
                    case 'compress-pdf': {
                        const cb = await pdfCompressorProcessor.compress(file, pdfCompressionLevel, setItemProgress);
                        result = { file: new File([cb], file.name.replace(/\.pdf$/i, '_compressed.pdf'), { type: 'application/pdf' }) };
                        break;
                    }
                    case 'convert-pdf': {
                        const imgs = await pdfConverterProcessor.convert(file, outputFormat, pageRange, pdfPageSpec, setItemProgress);
                        if (imgs.length > 0) {
                            result = {
                                file: new File([imgs[0].blob], `${file.name.replace(/\.pdf$/i, '')}_page1.${outputFormat}`, { type: imgs[0].blob.type }),
                                note: imgs.length > 1 ? `Converted ${imgs.length} pages (showing first)` : null
                            };
                        }
                        break;
                    }
                    case 'split-pdf': {
                        const sr = await pdfSplitterProcessor.split(file, pdfSplitMode, pdfPageSpec, pdfTotalPages, setItemProgress);
                        result = { files: sr.files, isSplit: true };
                        break;
                    }
                    case 'compress-audio': {
                        const ab = await audioCompressorProcessor.compress(file, parseInt(audioBitrate), setItemProgress);
                        result = { file: new File([ab], file.name.replace(/\.[^.]+$/, '.mp3'), { type: 'audio/mpeg' }) };
                        break;
                    }
                    case 'convert-audio': {
                        const ca = await audioConverterProcessor.convert(file, outputFormat, parseInt(audioBitrate), setItemProgress);
                        result = { file: new File([ca.blob], ca.filename, { type: ca.blob.type }) };
                        break;
                    }
                    case 'compress-video': {
                        const vb = await videoCompressorProcessor.compress(file, videoQuality, setItemProgress);
                        result = { file: new File([vb], file.name.replace(/\.[^.]+$/, '_compressed.mp4'), { type: 'video/mp4' }) };
                        break;
                    }
                    case 'video-converter': {
                        const cv = await videoConverterProcessor.convert(file, outputFormat, videoQuality, setItemProgress);
                        result = { file: new File([cv.blob], cv.filename, { type: cv.blob.type }) };
                        break;
                    }
                    case 'video-to-mp3': {
                        const m3 = await videoToMp3Processor.convert(file, parseInt(audioBitrate) || 192, setItemProgress);
                        result = { file: new File([m3.blob], m3.filename, { type: 'audio/mpeg' }) };
                        break;
                    }
                    case 'video-to-gif': {
                        const gr = await gifMakerProcessor.createGIF([file], 'video', { quality: 10, width: 480 }, setItemProgress);
                        result = { file: new File([await fetch(gr.url).then(r => r.blob())], gr.filename, { type: 'image/gif' }) };
                        URL.revokeObjectURL(gr.url);
                        break;
                    }
                    case 'protect-pdf': {
                        const vErr = validatePdfPassword();
                        if (vErr) throw new Error(vErr);
                        const pb = await protectPdfProcessor.protect(file, pdfPassword, { allowPrinting: true }, setItemProgress);
                        result = { file: new File([pb], `protected_${file.name}`, { type: 'application/pdf' }), note: 'Password protected' };
                        break;
                    }
                    case 'crop-image': {
                        // Use manual crop coordinates from InteractiveCropSelector if available,
                        // otherwise fall back to a sensible center-crop default
                        const cropCoords = await new Promise((res, rej) => {
                            if (manualCropData) {
                                res(manualCropData);
                                return;
                            }
                            // Fallback: 90% center crop
                            const img = new Image();
                            img.onload = () => {
                                URL.revokeObjectURL(img.src);
                                const cw = Math.floor(img.width * 0.9);
                                const ch = Math.floor(img.height * 0.9);
                                res({
                                    x: Math.floor((img.width - cw) / 2),
                                    y: Math.floor((img.height - ch) / 2),
                                    width: cw,
                                    height: ch,
                                });
                            };
                            img.onerror = () => rej(new Error('Failed to load image'));
                            img.src = URL.createObjectURL(file);
                        });
                        const cropResult = await imageCropperProcessor.cropImage(file, cropCoords, setItemProgress);
                        const cropB = await fetch(cropResult.url).then(rr => rr.blob());
                        URL.revokeObjectURL(cropResult.url);
                        result = { file: new File([cropB], cropResult.filename, { type: 'image/png' }) };
                        break;
                    }
                    case 'remove-background': {
                        const rbResult = await backgroundRemoverProcessor.removeBackground(file, 'medium', setItemProgress);
                        result = { file: new File([rbResult.blob], rbResult.filename, { type: 'image/png' }) };
                        break;
                    }
                    case 'watermark': {
                        const wmResult = await watermarkProcessor.addWatermark(file, { type: 'text', text: watermarkText || 'Watermark', fontSize: watermarkFontSize, opacity: watermarkOpacity / 100, position: watermarkPosition, color: watermarkColor }, setItemProgress);
                        const wmBlob = await fetch(wmResult.url).then(r => r.blob());
                        URL.revokeObjectURL(wmResult.url);
                        result = { file: new File([wmBlob], wmResult.filename, { type: 'image/png' }) };
                        break;
                    }
                    case 'image-to-pdf': {
                        const itpBlob = await imageToPdfProcessor.convert([file], 'fit', setItemProgress);
                        result = { file: new File([itpBlob], file.name.replace(/\.[^/.]+$/, '') + '.pdf', { type: 'application/pdf' }) };
                        break;
                    }
                    case 'pdf-to-word': {
                        const ptw = await pdfToWordProcessor.convert(file, setItemProgress);
                        result = { file: new File([ptw.blob], file.name.replace(/\.pdf$/i, '.docx'), { type: ptw.blob.type }) };
                        break;
                    }
                    case 'pdf-to-excel': {
                        const pte = await pdfToExcelProcessor.convert(file, setItemProgress);
                        result = { file: new File([pte.blob], file.name.replace(/\.pdf$/i, '.xlsx'), { type: pte.blob.type }) };
                        break;
                    }
                    case 'pdf-to-powerpoint': {
                        const ptp = await pdfToPowerPointProcessor.convert(file, setItemProgress);
                        result = { file: new File([ptp.blob], file.name.replace(/\.pdf$/i, '.pptx'), { type: ptp.blob.type }) };
                        break;
                    }
                    case 'rotate-pdf': {
                        const rotBlob = await rotatePdfProcessor.rotate(file, pdfRotationAngle, 'all', setItemProgress);
                        result = { file: new File([rotBlob], `rotated_${file.name}`, { type: 'application/pdf' }) };
                        break;
                    }
                    case 'watermark-pdf': {
                        const wmpBlob = await watermarkPdfProcessor.addWatermark(file, { type: 'text', text: watermarkText || 'Watermark', fontSize: watermarkFontSize, opacity: watermarkOpacity / 100, position: watermarkPosition, color: watermarkColor, rotation: 45 }, setItemProgress);
                        result = { file: new File([wmpBlob], `watermarked_${file.name}`, { type: 'application/pdf' }) };
                        break;
                    }
                    case 'unlock-pdf': {
                        const ulBlob = await unlockPdfProcessor.unlock(file, pdfPassword, setItemProgress);
                        result = { file: new File([ulBlob], `unlocked_${file.name}`, { type: 'application/pdf' }) };
                        break;
                    }
                    case 'page-numbers': {
                        const pnBlob = await pageNumbersProcessor.addPageNumbers(file, { position: pageNumberPosition, startNumber: pageNumberStart, fontSize: 12 }, setItemProgress);
                        result = { file: new File([pnBlob], `numbered_${file.name}`, { type: 'application/pdf' }) };
                        break;
                    }
                    case 'repair-pdf': {
                        const repResult = await repairPdfProcessor.repair(file, setItemProgress);
                        result = { file: new File([repResult.blob], `repaired_${file.name}`, { type: 'application/pdf' }) };
                        break;
                    }
                    case 'crop-pdf': {
                        const cpBlob = await cropPdfProcessor.crop(file, { top: 50, right: 50, bottom: 50, left: 50 }, setItemProgress);
                        result = { file: new File([cpBlob], `cropped_${file.name}`, { type: 'application/pdf' }) };
                        break;
                    }
                    case 'ocr-pdf': {
                        const ocrResult = await ocrPdfProcessor.processOCR(file, 'eng', setItemProgress);
                        result = { file: new File([ocrResult.blob], ocrResult.filename, { type: 'application/pdf' }) };
                        break;
                    }
                    case 'word-to-pdf': {
                        const wtpBlob = await wordToPdfProcessor.convert(file, setItemProgress);
                        result = { file: new File([wtpBlob], file.name.replace(/\.docx?$/i, '.pdf'), { type: 'application/pdf' }) };
                        break;
                    }
                    case 'excel-to-pdf': {
                        const etpBlob = await excelToPdfProcessor.convert(file, setItemProgress);
                        result = { file: new File([etpBlob], file.name.replace(/\.xlsx?$/i, '.pdf'), { type: 'application/pdf' }) };
                        break;
                    }
                    case 'powerpoint-to-pdf': {
                        const ppBlob = await powerpointToPdfProcessor.convert(file, setItemProgress);
                        result = { file: new File([ppBlob], file.name.replace(/\.pptx?$/i, '.pdf'), { type: 'application/pdf' }) };
                        break;
                    }
                    case 'epub-to-pdf': {
                        const epubResult = await epubToPdfProcessor.convert(file, setItemProgress);
                        result = { file: new File([epubResult.blob], epubResult.file.name, { type: 'application/pdf' }) };
                        break;
                    }
                    default:
                        throw new Error(`Operation not yet supported in Quick Converter: ${selectedOperation}`);
                }

                processedResults.push({ original: file, result });
            }

            setProgress(100);
            setResults(processedResults);
        } catch (err) {
            setError(err.message || 'Processing failed');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = (result) => {
        if (result.isSplit && result.files) {
            result.files.forEach(f => {
                const a = document.createElement('a');
                a.href = f.url;
                a.download = f.filename;
                a.click();
            });
            return;
        }
        if (!result.file) return;
        const url = URL.createObjectURL(result.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.file.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadAll = () => {
        results.forEach(({ result }) => handleDownload(result));
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const availableOperations = files.length > 0 ? getOperationsForFile(files[0]) : [];

    return (
        <div className="max-w-5xl mx-auto py-6 sm:py-12 px-3 sm:px-4 shadow-none">
            <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
                    Quick File Converter
                </h2>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Process your images, PDFs, audio, and video instantly in your browser.
                    Private, fast, and 100% secure.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden transition-all duration-500">
                {files.length === 0 ? (
                    <div className="p-2 sm:p-4 animate-fade-in">
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            multiple={true}
                            label="Drop your files here"
                            description="Supports images, PDFs, videos, audio, and documents"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* File Header */}
                        <div className="flex items-center justify-between px-4 sm:px-10 py-4 sm:py-8 border-b border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-500/10 dark:bg-primary-500/20 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                                    {files.length}
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                        Selected Files
                                    </h3>
                                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Ready to process
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setFiles([]);
                                    setSelectedOperation('');
                                    setShowOptions(false);
                                    setResults([]);
                                    setError('');
                                }}
                                className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                            >
                                Clear All
                            </button>
                        </div>

                        {/* Results View */}
                        {results.length > 0 ? (
                            <div className="p-4 sm:p-10 space-y-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl shadow-lg shadow-green-500/30">
                                            ✅
                                        </div>
                                        <div>
                                            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Processing Complete!</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Ready for download.</p>
                                        </div>
                                    </div>
                                    {results.length > 1 && (
                                        <button onClick={handleDownloadAll} className="btn-primary w-full sm:w-auto py-3 sm:py-4 px-8 sm:px-10 shadow-xl shadow-primary-500/20">
                                            Download All
                                        </button>
                                    )}
                                </div>
                                <div className="grid gap-3 sm:gap-4">
                                    {results.map(({ original, result, isMerged, sourceFiles }, ridx) => (
                                        <div key={ridx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-gray-50 dark:bg-white/5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 hover:border-green-500/30 transition-all group">
                                            <div className="flex items-center gap-3 sm:gap-5">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm border border-gray-100 dark:border-white/5 shrink-0">
                                                    {result.isSplit ? '📚' : (original?.type?.startsWith('image/') ? '🖼️' : '📄')}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-white truncate max-w-[160px] sm:max-w-md text-sm sm:text-base">
                                                        {isMerged ? result.file.name : (result.file?.name || original?.name || 'Processed File')}
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-500">
                                                        {isMerged ? `Merged ${sourceFiles.length} files` : (result.file ? formatFileSize(result.file.size) : '')}
                                                        {result.note && <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold uppercase">{result.note}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(result)}
                                                className="mt-3 sm:mt-0 w-full sm:w-auto btn-secondary dark:bg-white/10 dark:border-white/10 py-2.5 sm:py-3 px-6 sm:px-8 font-bold text-gray-900 dark:text-white text-sm sm:text-base"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 sm:pt-8 text-center">
                                    <button onClick={() => { setFiles([]); setResults([]); setSelectedOperation(''); setShowOptions(false); }} className="text-primary-600 dark:text-primary-400 font-bold hover:underline text-sm sm:text-base">
                                        + Process more files
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Selection View */}
                                <div className="p-4 sm:p-10 space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900 custom-scrollbar">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 sm:p-5 bg-gray-50/50 dark:bg-white/5 rounded-2xl sm:rounded-[1.5rem] border border-gray-100 dark:border-white/5 group">
                                            <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                                                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl border border-gray-100 dark:border-white/5 shrink-0">
                                                    {file.type.startsWith('image/') ? '🖼️' : '📄'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-white truncate text-sm sm:text-base">{file.name}</p>
                                                    <p className="text-xs sm:text-sm font-medium text-gray-400">{formatFileSize(file.size)}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveFile(index)} className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 shrink-0">
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}

                                    {!isProcessing && (
                                        <div className="relative group pt-2">
                                            <input type="file" multiple onChange={(e) => Array.from(e.target.files).forEach(handleFileSelect)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[1.5rem] p-5 sm:p-8 text-center group-hover:border-primary-500/50 transition-all">
                                                <p className="text-gray-900 dark:text-white font-bold text-sm sm:text-base">+ Add More Files</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="p-4 sm:p-12 bg-gray-50/50 dark:bg-black/40 border-t border-gray-100 dark:border-white/5">
                                    {isProcessing ? (
                                        <div className="py-8 sm:py-12 text-center space-y-6 sm:space-y-8">
                                            <div className="flex justify-center">
                                                <div className="relative w-20 h-20 sm:w-28 sm:h-28">
                                                    <div className="absolute inset-0 border-[6px] border-primary-100 dark:border-primary-900/20 rounded-full"></div>
                                                    <div className="absolute inset-0 border-[6px] border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xl sm:text-2xl text-primary-600 dark:text-primary-400">{progress}%</div>
                                                </div>
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Processing...</h3>
                                            <ProgressBar progress={progress} className="max-w-md mx-auto" />
                                        </div>
                                    ) : showOptions ? (
                                        <div className="space-y-6 sm:space-y-10 animate-fade-in">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">3. Configure Settings</h3>
                                                <button onClick={() => { setShowOptions(false); setSelectedOperation(''); }} className="text-xs sm:text-sm font-bold text-gray-500 hover:text-primary-600">Back</button>
                                            </div>

                                            <div className="grid gap-6 sm:gap-10 max-w-2xl mx-auto py-2 sm:py-4">
                                                {selectedOperation === 'compress-image' && (
                                                    <div className="space-y-4 sm:space-y-6">
                                                        <div className="flex justify-between items-center text-gray-900 dark:text-white font-bold">
                                                            <label>Compression Quality</label>
                                                            <span className="text-primary-600 dark:text-primary-400">{quality}%</span>
                                                        </div>
                                                        <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full h-3 accent-primary-500 appearance-none bg-gray-200 dark:bg-white/10 rounded-full" />
                                                        <div className="flex justify-between text-xs text-gray-400">
                                                            <span>Smaller file</span><span>Better quality</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'convert-image' && (
                                                    <div className="space-y-5 sm:space-y-6">
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Output Format</p>
                                                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                                                {['png', 'jpg', 'webp'].map(f => (
                                                                    <button key={f} onClick={() => setOutputFormat(f)} className={`py-3 sm:py-4 rounded-2xl border font-bold uppercase text-sm sm:text-base ${outputFormat === f ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{f}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {['jpg', 'webp'].includes(outputFormat) && (
                                                            <div>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quality</p>
                                                                    <span className="text-sm font-black text-primary-600 dark:text-primary-400">{convertQuality}%</span>
                                                                </div>
                                                                <input type="range" min="10" max="100" value={convertQuality} onChange={(e) => setConvertQuality(parseInt(e.target.value))} className="w-full h-3 accent-primary-500 appearance-none bg-gray-200 dark:bg-white/10 rounded-full" />
                                                                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Smaller</span><span>Best quality</span></div>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Resize (optional)</p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <input type="number" min="1" placeholder="Width (px)" value={width} onChange={(e) => setWidth(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                                <input type="number" min="1" placeholder="Height (px)" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                            </div>
                                                            <label className="mt-2 flex items-center gap-2 cursor-pointer">
                                                                <input type="checkbox" checked={maintainAspectRatio} onChange={(e) => setMaintainAspectRatio(e.target.checked)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">Maintain aspect ratio</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'resize-image' && (
                                                    <div className="space-y-4">
                                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Target Dimensions</p>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
                                                                <input type="number" min="1" placeholder="e.g. 1280" value={width} onChange={(e) => setWidth(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
                                                                <input type="number" min="1" placeholder="e.g. 720" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-400">Enter at least one dimension. Both values will be used as-is.</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {[['HD', '1280', '720'], ['Full HD', '1920', '1080'], ['Web', '800', '600'], ['Thumbnail', '256', '256']].map(([lbl, w, h]) => (
                                                                <button key={lbl} onClick={() => { setWidth(w); setHeight(h); }} className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:border-primary-400 transition-all">{lbl} {w}×{h}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'crop-image' && files.length > 0 && (
                                                    <InteractiveCropSelector
                                                        file={files[0]}
                                                        onChange={setManualCropData}
                                                    />
                                                )}

                                                {selectedOperation === 'watermark' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Watermark Text</label>
                                                            <input type="text" placeholder="Your watermark text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <div className="flex justify-between mb-1">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Font Size</label>
                                                                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{watermarkFontSize}px</span>
                                                                </div>
                                                                <input type="range" min="12" max="120" value={watermarkFontSize} onChange={(e) => setWatermarkFontSize(parseInt(e.target.value))} className="w-full h-2 accent-primary-500 rounded-full" />
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between mb-1">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Opacity</label>
                                                                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{watermarkOpacity}%</span>
                                                                </div>
                                                                <input type="range" min="10" max="100" value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(parseInt(e.target.value))} className="w-full h-2 accent-primary-500 rounded-full" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Position</label>
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                                                                {WATERMARK_POSITIONS.map(p => (
                                                                    <button key={p.value} onClick={() => setWatermarkPosition(p.value)} className={`py-2 px-1.5 rounded-xl border text-[11px] font-semibold transition-all ${watermarkPosition === p.value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-primary-400'}`}>
                                                                        {p.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Text Color</label>
                                                            <div className="flex items-center gap-3">
                                                                <input type="color" value={watermarkColor} onChange={(e) => setWatermarkColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 dark:border-white/10" />
                                                                <span className="text-sm text-gray-600 dark:text-gray-400">{watermarkColor}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'compress-pdf' && (
                                                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                                        {['low', 'balanced', 'high'].map(l => (
                                                            <button key={l} onClick={() => setPdfCompressionLevel(l)} className={`py-3 sm:py-4 rounded-2xl border font-bold capitalize text-sm sm:text-base ${pdfCompressionLevel === l ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{l}</button>
                                                        ))}
                                                    </div>
                                                )}

                                                {selectedOperation === 'convert-pdf' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Output Format</p>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {['png', 'jpg'].map(f => (
                                                                    <button key={f} onClick={() => setOutputFormat(f)} className={`py-3 rounded-2xl border font-bold uppercase text-sm ${outputFormat === f ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{f}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Pages to Convert</p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {[['all', 'All Pages'], ['first', 'First Page Only'], ['custom', 'Custom Range']].map(([val, lbl]) => (
                                                                    <button key={val} onClick={() => setPageRange(val)} className={`py-2 px-2 rounded-xl border font-semibold text-xs ${pageRange === val ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{lbl}</button>
                                                                ))}
                                                            </div>
                                                            {pageRange === 'custom' && (
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. 1,3,5-7"
                                                                    value={pdfPageSpec}
                                                                    onChange={e => setPdfPageSpec(e.target.value)}
                                                                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'split-pdf' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Split Method</p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {[['all', 'All Pages'], ['pages', 'Extract Pages'], ['ranges', 'By Ranges']].map(([val, lbl]) => (
                                                                    <button key={val} onClick={() => setPdfSplitMode(val)} className={`py-2 px-2 rounded-xl border font-semibold text-xs ${pdfSplitMode === val ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{lbl}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {pdfSplitMode !== 'all' && (
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                                                                    {pdfSplitMode === 'pages' ? 'Page Numbers (e.g. 1,3,5-7)' : 'Page Ranges (e.g. 1-5,6-10)'}
                                                                </p>
                                                                <input
                                                                    type="text"
                                                                    placeholder={pdfSplitMode === 'pages' ? 'e.g. 1,3,5-7' : 'e.g. 1-5,6-10'}
                                                                    value={pdfPageSpec}
                                                                    onChange={e => setPdfPageSpec(e.target.value)}
                                                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                                />
                                                                {pdfTotalPages > 0 && (
                                                                    <p className="mt-1 text-xs text-gray-400">PDF has {pdfTotalPages} pages</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {selectedOperation === 'protect-pdf' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Password</label>
                                                            <input
                                                                type="password"
                                                                placeholder="Enter password (min 4 chars)"
                                                                value={pdfPassword}
                                                                onChange={e => setPdfPassword(e.target.value)}
                                                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Confirm Password</label>
                                                            <input
                                                                type="password"
                                                                placeholder="Confirm your password"
                                                                value={pdfPasswordConfirm}
                                                                onChange={e => setPdfPasswordConfirm(e.target.value)}
                                                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                            />
                                                        </div>
                                                        {pdfPassword && pdfPasswordConfirm && pdfPassword !== pdfPasswordConfirm && (
                                                            <p className="text-xs text-red-500">Passwords do not match</p>
                                                        )}
                                                        {pdfPassword && pdfPassword.length < MIN_PASSWORD_LENGTH && (
                                                            <p className="text-xs text-red-500">Password must be at least {MIN_PASSWORD_LENGTH} characters</p>
                                                        )}
                                                    </div>
                                                )}

                                                {selectedOperation === 'unlock-pdf' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">PDF Password</label>
                                                            <input
                                                                type="password"
                                                                placeholder="Enter the PDF password to unlock"
                                                                value={pdfPassword}
                                                                onChange={e => setPdfPassword(e.target.value)}
                                                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-400">Enter the password to remove protection from this PDF</p>
                                                    </div>
                                                )}

                                                {selectedOperation === 'rotate-pdf' && (
                                                    <div className="space-y-4">
                                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Rotation Angle</p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[['90', '↻ 90°'], ['180', '↻ 180°'], ['270', '↺ 90°']].map(([val, lbl]) => (
                                                                <button key={val} onClick={() => setPdfRotationAngle(parseInt(val))} className={`py-4 rounded-2xl border font-bold text-sm ${pdfRotationAngle === parseInt(val) ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{lbl}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'watermark-pdf' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Watermark Text</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Your watermark text"
                                                                value={watermarkText}
                                                                onChange={e => setWatermarkText(e.target.value)}
                                                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <div className="flex justify-between mb-1">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Opacity</label>
                                                                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{watermarkOpacity}%</span>
                                                                </div>
                                                                <input type="range" min="10" max="100" value={watermarkOpacity} onChange={e => setWatermarkOpacity(parseInt(e.target.value))} className="w-full h-2 accent-primary-500 rounded-full" />
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between mb-1">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Font Size</label>
                                                                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{watermarkFontSize}pt</span>
                                                                </div>
                                                                <input type="range" min="12" max="72" value={watermarkFontSize} onChange={e => setWatermarkFontSize(parseInt(e.target.value))} className="w-full h-2 accent-primary-500 rounded-full" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Position</label>
                                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                                                                {WATERMARK_POSITIONS.map(p => (
                                                                    <button key={p.value} onClick={() => setWatermarkPosition(p.value)} className={`py-2 px-1.5 rounded-xl border text-[11px] font-semibold transition-all ${watermarkPosition === p.value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}>
                                                                        {p.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Color</label>
                                                            <div className="flex items-center gap-3">
                                                                <input type="color" value={watermarkColor} onChange={e => setWatermarkColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 dark:border-white/10" />
                                                                <span className="text-sm text-gray-600 dark:text-gray-400">{watermarkColor}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'page-numbers' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Position</p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {[['bottom-center', '↓ Bottom Center'], ['bottom-left', '↙ Bottom Left'], ['bottom-right', '↘ Bottom Right'], ['top-center', '↑ Top Center'], ['top-left', '↖ Top Left'], ['top-right', '↗ Top Right']].map(([val, lbl]) => (
                                                                    <button key={val} onClick={() => setPageNumberPosition(val)} className={`py-2 px-1 rounded-xl border text-xs font-semibold ${pageNumberPosition === val ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{lbl}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Starting Number</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={pageNumberStart}
                                                                onChange={e => setPageNumberStart(Math.max(1, parseInt(e.target.value) || 1))}
                                                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'compress-audio' && (
                                                    <div className="space-y-4">
                                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Audio Bitrate</p>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {['64', '128', '192', '320'].map(b => (
                                                                <button key={b} onClick={() => setAudioBitrate(b)} className={`py-3 rounded-2xl border font-bold text-sm ${audioBitrate === b ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{b}k</button>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-gray-400">Lower bitrate = smaller file, higher bitrate = better quality</p>
                                                    </div>
                                                )}

                                                {selectedOperation === 'convert-audio' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Output Format</p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {['mp3', 'wav', 'ogg'].map(f => (
                                                                    <button key={f} onClick={() => setOutputFormat(f)} className={`py-3 rounded-2xl border font-bold uppercase text-sm ${outputFormat === f ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{f}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Audio Bitrate</p>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {['64', '128', '192', '320'].map(b => (
                                                                    <button key={b} onClick={() => setAudioBitrate(b)} className={`py-3 rounded-2xl border font-bold text-sm ${audioBitrate === b ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{b}k</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'compress-video' && (
                                                    <div className="space-y-4">
                                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Quality</p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[['low', 'Low (smallest)'], ['medium', 'Medium'], ['high', 'High (best)']].map(([val, lbl]) => (
                                                                <button key={val} onClick={() => setVideoQuality(val)} className={`py-3 rounded-2xl border font-bold text-xs ${videoQuality === val ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{lbl}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'video-converter' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Output Format</p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {['mp4', 'webm', 'avi'].map(f => (
                                                                    <button key={f} onClick={() => setOutputFormat(f)} className={`py-3 rounded-2xl border font-bold uppercase text-sm ${outputFormat === f ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{f}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Quality</p>
                                                            <div className="grid grid-cols-3 gap-3">
                                                                {[['low', 'Low'], ['medium', 'Medium'], ['high', 'High']].map(([val, lbl]) => (
                                                                    <button key={val} onClick={() => setVideoQuality(val)} className={`py-3 rounded-2xl border font-bold text-sm ${videoQuality === val ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{lbl}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {!['compress-image', 'convert-image', 'resize-image', 'crop-image', 'watermark', 'compress-pdf', 'convert-pdf', 'split-pdf', 'protect-pdf', 'unlock-pdf', 'rotate-pdf', 'watermark-pdf', 'page-numbers', 'compress-audio', 'convert-audio', 'compress-video', 'video-converter'].includes(selectedOperation) && (
                                                    <div className="text-center p-5 sm:p-8 bg-primary-50/50 dark:bg-primary-500/5 rounded-3xl">
                                                        <p className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">Ready to {selectedOperation.replace(/-/g, ' ')}</p>
                                                    </div>
                                                )}

                                                <button onClick={handleProcess} className="btn-primary w-full py-4 sm:py-6 text-lg sm:text-2xl font-black shadow-2xl shadow-primary-500/40">
                                                    Process Files
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in">
                                            <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-8">2. Choose an Operation</h3>
                                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 max-h-[360px] sm:max-h-none overflow-y-auto pb-2 custom-scrollbar">
                                                {availableOperations.map((op) => (
                                                    <button
                                                        key={op.id}
                                                        onClick={() => handleOperationSelect(op.id)}
                                                        className={`p-3 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all flex flex-col items-center ${selectedOperation === op.id
                                                                ? 'border-primary-500 bg-white dark:bg-gray-800 shadow-xl ring-2 ring-primary-500/10'
                                                                : 'border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900/50 hover:border-primary-500/50'
                                                            }`}
                                                    >
                                                        <div className="text-2xl sm:text-4xl mb-1.5 sm:mb-4">{op.icon}</div>
                                                        <p className={`text-xs sm:text-sm font-bold text-center leading-tight ${selectedOperation === op.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>{op.name}</p>
                                                    </button>
                                                ))}
                                            </div>

                                            {selectedOperation && (
                                                <div className="mt-8 sm:mt-14 flex flex-col items-center gap-4 sm:gap-6">
                                                    <button onClick={() => setShowOptions(true)} className="btn-primary w-full sm:w-auto px-10 sm:px-16 py-4 sm:py-6 text-lg sm:text-2xl font-black shadow-2xl shadow-primary-500/30">
                                                        Continue
                                                    </button>
                                                    <button onClick={handleProcess} className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest">
                                                        Skip Settings &amp; Process
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 rounded-[1.5rem] sm:rounded-[2rem] flex items-start sm:items-center gap-3 sm:gap-4">
                    <span className="text-xl sm:text-2xl shrink-0">⚠️</span>
                    <p className="text-red-800 dark:text-red-400 font-bold text-sm sm:text-base">{error}</p>
                </div>
            )}

            {/* Privacy Footer */}
            <div className="mt-12 sm:mt-20 py-8 sm:py-10 text-center border-t border-gray-100 dark:border-white/5 max-w-2xl mx-auto">
                <p className="text-gray-900 dark:text-white font-extrabold text-base sm:text-lg mb-2">100% Private &amp; Local</p>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Everything runs in your browser. No files are uploaded to any server.</p>
            </div>
        </div>
    );
}
