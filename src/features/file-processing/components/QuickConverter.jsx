import { useState, useCallback } from 'react';
import Dropzone from '../shared/Dropzone';
import Button from '../shared/Button';
import ProgressBar from '../shared/ProgressBar';
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
    const [pdfCompressionLevel, setPdfCompressionLevel] = useState('balanced');
    const [pageRange, setPageRange] = useState('all');
    const [audioBitrate, setAudioBitrate] = useState('192');
    const [videoQuality, setVideoQuality] = useState('medium');
    const [pdfSplitMode, setPdfSplitMode] = useState('all');
    const [pdfTotalPages, setPdfTotalPages] = useState(0);
    const [pdfPageSpec, setPdfPageSpec] = useState('');
    const [pdfPassword, setPdfPassword] = useState('');
    const [pdfPasswordConfirm, setPdfPasswordConfirm] = useState('');
    const [showPdfPassword, setShowPdfPassword] = useState(false);

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
                        result = await imageConverterProcessor.convert(file, outputFormat, parseInt(width) || null, parseInt(height) || null, true, setItemProgress);
                        break;
                    case 'resize-image': {
                        const r = await imageResizerProcessor.resize(file, parseInt(width) || 800, parseInt(height) || 600, setItemProgress);
                        result = { file: new File([await fetch(r.url).then(res => res.blob())], r.filename, { type: file.type }) };
                        URL.revokeObjectURL(r.url);
                        break;
                    }
                    case 'compress-pdf':
                        const cb = await pdfCompressorProcessor.compress(file, pdfCompressionLevel, setItemProgress);
                        result = { file: new File([cb], file.name.replace(/\.pdf$/i, '_compressed.pdf'), { type: 'application/pdf' }) };
                        break;
                    case 'convert-pdf':
                        const imgs = await pdfConverterProcessor.convert(file, outputFormat, pageRange, '', setItemProgress);
                        if (imgs.length > 0) {
                            result = {
                                file: new File([imgs[0].blob], `${file.name.replace(/\.pdf$/i, '')}_page1.${outputFormat}`, { type: imgs[0].blob.type }),
                                note: imgs.length > 1 ? `Converted ${imgs.length} pages (showing first)` : null
                            };
                        }
                        break;
                    case 'split-pdf':
                        const sr = await pdfSplitterProcessor.split(file, pdfSplitMode, pdfPageSpec, pdfTotalPages, setItemProgress);
                        result = { files: sr.files, isSplit: true };
                        break;
                    case 'compress-audio':
                        const ab = await audioCompressorProcessor.compress(file, parseInt(audioBitrate), setItemProgress);
                        result = { file: new File([ab], file.name.replace(/\.[^.]+$/, '.mp3'), { type: 'audio/mpeg' }) };
                        break;
                    case 'convert-audio':
                        const ca = await audioConverterProcessor.convert(file, outputFormat, setItemProgress);
                        result = { file: new File([ca.blob], ca.filename, { type: ca.blob.type }) };
                        break;
                    case 'compress-video':
                        const vb = await videoCompressorProcessor.compress(file, videoQuality, setItemProgress);
                        result = { file: new File([vb], file.name.replace(/\.[^.]+$/, '_compressed.mp4'), { type: 'video/mp4' }) };
                        break;
                    case 'video-converter':
                        const cv = await videoConverterProcessor.convert(file, outputFormat, setItemProgress);
                        result = { file: new File([cv.blob], cv.filename, { type: cv.blob.type }) };
                        break;
                    case 'video-to-mp3':
                        const m3 = await videoToMp3Processor.convert(file, parseInt(audioBitrate) || 192, setItemProgress);
                        result = { file: new File([m3.blob], m3.filename, { type: 'audio/mpeg' }) };
                        break;
                    case 'video-to-gif':
                        const gr = await gifMakerProcessor.createGIF([file], 'video', { quality: 10, width: 480 }, setItemProgress);
                        result = { file: new File([await fetch(gr.url).then(r => r.blob())], gr.filename, { type: 'image/gif' }) };
                        URL.revokeObjectURL(gr.url);
                        break;
                    case 'protect-pdf':
                        const vErr = validatePdfPassword();
                        if (vErr) throw new Error(vErr);
                        const pb = await protectPdfProcessor.protect(file, pdfPassword, { allowPrinting: true }, setItemProgress);
                        result = { file: new File([pb], `protected_${file.name}`, { type: 'application/pdf' }), note: 'Password protected' };
                        break;
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
        <div className="max-w-5xl mx-auto py-6 sm:py-12 px-4 shadow-none">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                    Quick File Converter
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
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
                        <div className="flex items-center justify-between px-6 sm:px-10 py-8 border-b border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-500/10 dark:bg-primary-500/20 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                                    {files.length}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                        Selected Files
                                    </h3>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
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
                                className="px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                            >
                                Clear All
                            </button>
                        </div>

                        {/* Results View */}
                        {results.length > 0 ? (
                            <div className="p-6 sm:p-10 space-y-6">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-green-500/30">
                                            ✅
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Processing Complete!</h3>
                                            <p className="text-gray-500 dark:text-gray-400">Ready for download.</p>
                                        </div>
                                    </div>
                                    {results.length > 1 && (
                                        <button onClick={handleDownloadAll} className="btn-primary py-4 px-10 shadow-xl shadow-primary-500/20">
                                            Download All
                                        </button>
                                    )}
                                </div>
                                <div className="grid gap-4">
                                    {results.map(({ original, result, isMerged, sourceFiles }, ridx) => (
                                        <div key={ridx} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-green-500/30 transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-gray-100 dark:border-white/5">
                                                    {result.isSplit ? '📚' : (original?.type?.startsWith('image/') ? '🖼️' : '📄')}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                                                        {isMerged ? result.file.name : (result.file?.name || original?.name || 'Processed File')}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {isMerged ? `Merged ${sourceFiles.length} files` : (result.file ? formatFileSize(result.file.size) : '')}
                                                        {result.note && <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold uppercase">{result.note}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(result)}
                                                className="mt-4 sm:mt-0 btn-secondary dark:bg-white/10 dark:border-white/10 py-3 px-8 font-bold text-gray-900 dark:text-white"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-8 text-center">
                                    <button onClick={() => { setFiles([]); setResults([]); setSelectedOperation(''); setShowOptions(false); }} className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
                                        + Process more files
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Selection View */}
                                <div className="p-6 sm:p-10 space-y-4 max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900 custom-scrollbar">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-5 bg-gray-50/50 dark:bg-white/5 rounded-[1.5rem] border border-gray-100 dark:border-white/5 group">
                                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-2xl border border-gray-100 dark:border-white/5">
                                                    {file.type.startsWith('image/') ? '🖼️' : '📄'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                                    <p className="text-sm font-medium text-gray-400">{formatFileSize(file.size)}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveFile(index)} className="p-2 text-gray-400 hover:text-red-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}

                                    {!isProcessing && (
                                        <div className="relative group pt-2">
                                            <input type="file" multiple onChange={(e) => Array.from(e.target.files).forEach(handleFileSelect)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[1.5rem] p-8 text-center group-hover:border-primary-500/50 transition-all">
                                                <p className="text-gray-900 dark:text-white font-bold">+ Add More Files</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="p-8 sm:p-12 bg-gray-50/50 dark:bg-black/40 border-t border-gray-100 dark:border-white/5">
                                    {isProcessing ? (
                                        <div className="py-12 text-center space-y-8">
                                            <div className="flex justify-center">
                                                <div className="relative w-28 h-28">
                                                    <div className="absolute inset-0 border-[6px] border-primary-100 dark:border-primary-900/20 rounded-full"></div>
                                                    <div className="absolute inset-0 border-[6px] border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-primary-600 dark:text-primary-400">{progress}%</div>
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Processing...</h3>
                                            <ProgressBar progress={progress} className="max-w-md mx-auto" />
                                        </div>
                                    ) : showOptions ? (
                                        <div className="space-y-10 animate-fade-in">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">3. Configure Settings</h3>
                                                <button onClick={() => { setShowOptions(false); setSelectedOperation(''); }} className="text-sm font-bold text-gray-500 hover:text-primary-600">Back</button>
                                            </div>

                                            <div className="grid gap-10 max-w-2xl mx-auto py-4">
                                                {selectedOperation === 'compress-image' && (
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-center text-gray-900 dark:text-white font-bold">
                                                            <label>Quality</label>
                                                            <span>{quality}%</span>
                                                        </div>
                                                        <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full h-3 accent-primary-500 appearance-none bg-gray-200 dark:bg-white/10 rounded-full" />
                                                    </div>
                                                )}

                                                {selectedOperation === 'convert-image' && (
                                                    <div className="space-y-8">
                                                        <div className="grid grid-cols-3 gap-4">
                                                            {['png', 'jpg', 'webp'].map(f => (
                                                                <button key={f} onClick={() => setOutputFormat(f)} className={`py-4 rounded-2xl border font-bold uppercase ${outputFormat === f ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{f}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'compress-pdf' && (
                                                    <div className="grid grid-cols-3 gap-4">
                                                        {['low', 'balanced', 'high'].map(l => (
                                                            <button key={l} onClick={() => setPdfCompressionLevel(l)} className={`py-4 rounded-2xl border font-bold capitalize ${pdfCompressionLevel === l ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>{l}</button>
                                                        ))}
                                                    </div>
                                                )}

                                                {!['compress-image', 'convert-image', 'compress-pdf'].includes(selectedOperation) && (
                                                    <div className="text-center p-8 bg-primary-50/50 dark:bg-primary-500/5 rounded-3xl">
                                                        <p className="font-bold text-gray-900 dark:text-white text-lg">Ready to {selectedOperation.replace(/-/g, ' ')}</p>
                                                    </div>
                                                )}

                                                <button onClick={handleProcess} className="btn-primary w-full py-6 text-2xl font-black shadow-2xl shadow-primary-500/40">
                                                    Process Files
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">2. Choose an Operation</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {availableOperations.map((op) => (
                                                    <button
                                                        key={op.id}
                                                        onClick={() => handleOperationSelect(op.id)}
                                                        className={`p-6 rounded-3xl border transition-all flex flex-col items-center ${selectedOperation === op.id
                                                                ? 'border-primary-500 bg-white dark:bg-gray-800 shadow-xl ring-2 ring-primary-500/10'
                                                                : 'border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900/50 hover:border-primary-500/50'
                                                            }`}
                                                    >
                                                        <div className="text-4xl mb-4">{op.icon}</div>
                                                        <p className={`text-sm font-bold text-center ${selectedOperation === op.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>{op.name}</p>
                                                    </button>
                                                ))}
                                            </div>

                                            {selectedOperation && (
                                                <div className="mt-14 flex flex-col items-center gap-6">
                                                    <button onClick={() => setShowOptions(true)} className="btn-primary px-16 py-6 text-2xl font-black shadow-2xl shadow-primary-500/30">
                                                        Continue
                                                    </button>
                                                    <button onClick={handleProcess} className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                                                        Skip Settings & Process
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
                <div className="mt-8 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 rounded-[2rem] flex items-center gap-4">
                    <span className="text-2xl">⚠️</span>
                    <p className="text-red-800 dark:text-red-400 font-bold">{error}</p>
                </div>
            )}

            {/* Privacy Footer */}
            <div className="mt-20 py-10 text-center border-t border-gray-100 dark:border-white/5 max-w-2xl mx-auto">
                <p className="text-gray-900 dark:text-white font-extrabold text-lg mb-2">100% Private & Local</p>
                <p className="text-gray-500 dark:text-gray-400">Everything runs in your browser. No files are uploaded to any server.</p>
            </div>
        </div>
    );
}
