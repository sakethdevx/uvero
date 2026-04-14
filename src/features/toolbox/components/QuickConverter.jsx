import { useEffect, useMemo, useState } from 'react';
import Dropzone from '../shared/Dropzone';
import ProgressBar from '../shared/ProgressBar';
import InteractiveCropSelector from './InteractiveCropSelector';
import { useMode } from '../context/ModeContext';
import ModeToggle from './ModeToggle';
import { getToolById } from '../tools';
import { getToolExecutor } from '../core/toolExecutors';

// Quick Converter stays intentionally curated. Only include executor-backed tools
// that are single-step, compact in options, and safe for batch execution.
const QUICK_CONVERTER_OPERATIONS = [
    {
        id: 'compress-image',
        label: 'Compress Image',
        icon: '🖼️',
        matches: (file) => file.type.startsWith('image/') && !isHeicFile(file),
    },
    {
        id: 'convert-image',
        label: 'Convert Image',
        icon: '🔄',
        matches: (file) => file.type.startsWith('image/') && !isHeicFile(file),
    },
    {
        id: 'resize-image',
        label: 'Resize Image',
        icon: '📏',
        matches: (file) => file.type.startsWith('image/') && !isHeicFile(file),
    },
    {
        id: 'crop-image',
        label: 'Crop Image',
        icon: '✂️',
        matches: (file) => file.type.startsWith('image/') && !isHeicFile(file),
        singleFileOnly: true,
    },
    {
        id: 'watermark',
        label: 'Add Watermark',
        icon: '©️',
        matches: (file) => file.type.startsWith('image/') && !isHeicFile(file),
    },
    {
        id: 'remove-background',
        label: 'Remove Background',
        icon: '🎨',
        matches: (file) => file.type.startsWith('image/') && !isHeicFile(file),
    },
    {
        id: 'image-to-pdf',
        label: 'Image to PDF',
        icon: '📄',
        matches: (file) => file.type.startsWith('image/') && !isHeicFile(file),
    },
    {
        id: 'heic-to-jpg',
        label: 'HEIC to JPG',
        icon: '📱',
        matches: (file) => isHeicFile(file),
    },
    {
        id: 'compress-pdf',
        label: 'Compress PDF',
        icon: '📄',
        matches: (file) => isPdfFile(file),
    },
    {
        id: 'pdf-to-jpg',
        label: 'PDF to JPG',
        icon: '🖼️',
        matches: (file) => isPdfFile(file),
        singleFileOnly: true,
    },
    {
        id: 'video-to-mp3',
        label: 'Extract Audio',
        icon: '🎵',
        matches: (file) => file.type.startsWith('video/'),
    },
];

function isPdfFile(file) {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function isHeicFile(file) {
    const lowerName = file.name.toLowerCase();
    return (
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        lowerName.endsWith('.heic') ||
        lowerName.endsWith('.heif')
    );
}

function getResultIcon(file) {
    if (!file) return '📄';
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type.startsWith('video/')) return '🎬';
    if (isPdfFile(file)) return '📄';
    return '📦';
}

function getAvailableOperations(files, mode) {
    if (!files.length) return [];

    return QUICK_CONVERTER_OPERATIONS
        .filter((operation) => files.every((file) => operation.matches(file)))
        .filter((operation) => !operation.singleFileOnly || files.length === 1)
        .map((operation) => {
            const tool = getToolById(operation.id);

            if (!tool || !tool.quickConverterEligible || !tool.modes.includes(mode)) {
                return null;
            }

            return {
                ...operation,
                description: tool.description,
            };
        })
        .filter(Boolean);
}

export default function QuickConverter() {
    const { isOnlineMode } = useMode();
    const mode = isOnlineMode ? 'online' : 'offline';
    const [files, setFiles] = useState([]);
    const [selectedOperation, setSelectedOperation] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    const [quality, setQuality] = useState(80);
    const [outputFormat, setOutputFormat] = useState('png');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [convertQuality, setConvertQuality] = useState(92);
    const [manualCropData, setManualCropData] = useState(null);
    const [watermarkText, setWatermarkText] = useState('Watermark');
    const [watermarkFontSize, setWatermarkFontSize] = useState(24);
    const [watermarkOpacity, setWatermarkOpacity] = useState(50);
    const [watermarkPosition, setWatermarkPosition] = useState('center');
    const [watermarkColor, setWatermarkColor] = useState('#000000');
    const [backgroundRemovalQuality, setBackgroundRemovalQuality] = useState('medium');
    const [pageSize, setPageSize] = useState('fit');
    const [pageRange, setPageRange] = useState('all');
    const [customPages, setCustomPages] = useState('');
    const [pdfCompressionLevel, setPdfCompressionLevel] = useState('balanced');
    const [audioBitrate, setAudioBitrate] = useState(192);

    const availableOperations = useMemo(
        () => getAvailableOperations(files, mode),
        [files, mode]
    );

    useEffect(() => {
        if (selectedOperation && !availableOperations.some((operation) => operation.id === selectedOperation)) {
            setSelectedOperation('');
            setShowOptions(false);
        }
    }, [availableOperations, selectedOperation]);

    const handleFileSelect = (file) => {
        setFiles((prevFiles) => [...prevFiles, file]);
        setError('');
        setSelectedOperation('');
        setShowOptions(false);
        setResults([]);
        setManualCropData(null);
    };

    const handleRemoveFile = (index) => {
        const nextFiles = files.filter((_, fileIndex) => fileIndex !== index);
        setFiles(nextFiles);
        setResults([]);
        setError('');
        setManualCropData(null);

        if (nextFiles.length === 0) {
            setSelectedOperation('');
            setShowOptions(false);
        }
    };

    const handleOperationSelect = (operationId) => {
        setSelectedOperation(operationId);
        setShowOptions(true);
        setError('');
        setResults([]);
        setManualCropData(null);
    };

    const resetAll = () => {
        setFiles([]);
        setSelectedOperation('');
        setShowOptions(false);
        setResults([]);
        setError('');
        setProgress(0);
        setManualCropData(null);
    };

    const getOperationOptions = () => {
        switch (selectedOperation) {
            case 'compress-image':
                return { quality };
            case 'convert-image':
                return {
                    outputFormat,
                    width: width ? parseInt(width, 10) : null,
                    height: height ? parseInt(height, 10) : null,
                    maintainAspectRatio,
                    quality: ['jpg', 'jpeg', 'webp'].includes(outputFormat) ? convertQuality : null,
                };
            case 'resize-image':
                return {
                    width: width ? parseInt(width, 10) : null,
                    height: height ? parseInt(height, 10) : null,
                };
            case 'crop-image':
                return {
                    cropArea: manualCropData,
                };
            case 'watermark':
                return {
                    type: 'text',
                    text: watermarkText,
                    fontSize: watermarkFontSize,
                    opacity: watermarkOpacity / 100,
                    position: watermarkPosition,
                    color: watermarkColor,
                };
            case 'remove-background':
                return {
                    quality: backgroundRemovalQuality,
                };
            case 'image-to-pdf':
                return {
                    pageSize,
                };
            case 'heic-to-jpg':
                return { quality: quality / 100 };
            case 'compress-pdf':
                return { compressionLevel: pdfCompressionLevel };
            case 'pdf-to-jpg':
                return {
                    pageRange,
                    customPages,
                };
            case 'video-to-mp3':
                return { bitrate: audioBitrate };
            default:
                return {};
        }
    };

    const handleProcess = async () => {
        if (!selectedOperation || files.length === 0) return;

        const executor = getToolExecutor(selectedOperation);

        if (!executor) {
            setError('This quick action has not been migrated to the shared executor yet.');
            return;
        }

        setIsProcessing(true);
        setError('');
        setProgress(0);

        try {
            const executionResult = await executor.run({
                files,
                options: getOperationOptions(),
                mode,
                onProgress: setProgress,
            });
            const outputFiles = executionResult.primaryFile
                ? [executionResult.primaryFile]
                : (executionResult.files || []);
            const metaItems = Array.isArray(executionResult.meta?.items)
                ? executionResult.meta.items
                : outputFiles.map(() => executionResult.meta || {});
            const processedResults = outputFiles.map((outputFile, index) => ({
                original: outputFiles.length === files.length ? (files[index] || files[0] || null) : files[0],
                result: {
                    file: outputFile,
                    meta: metaItems[index] || executionResult.meta || {},
                },
            }));

            setResults(processedResults);
            setProgress(100);
        } catch (err) {
            setError(err.message || 'Processing failed.');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = (result) => {
        if (!result.file) return;

        const url = URL.createObjectURL(result.file);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.file.name;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadAll = () => {
        results.forEach(({ result }) => handleDownload(result));
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const units = ['Bytes', 'KB', 'MB', 'GB'];
        const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        return `${parseFloat((bytes / (1024 ** index)).toFixed(2))} ${units[index]}`;
    };

    const currentOperation = availableOperations.find((operation) => operation.id === selectedOperation);

    return (
        <div className="mx-auto w-full max-w-5xl px-3 py-4 shadow-none sm:px-4 sm:py-6">
            <div className="mb-8 grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
                <div className="rounded-[2rem] border border-gray-200/80 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/[0.08] dark:bg-gray-950/40 sm:p-7">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                        <span className="h-2 w-2 rounded-full bg-primary-500" />
                        Quick Convert
                    </div>
                    <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Drop a file, pick a fast path.
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base">
                        This surface is tuned for compact, executor-backed actions that feel instant. It is intentionally focused: simple inputs here, deeper workflows on the dedicated tool pages.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {['Images', 'PDFs', 'HEIC', 'Video to audio'].map((item) => (
                            <span
                                key={item}
                                className="inline-flex items-center rounded-full border border-gray-200/80 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300"
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="rounded-[2rem] border border-gray-200/80 bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-sm dark:border-white/[0.08] dark:from-gray-900 dark:to-black sm:p-7">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Processing Mode</p>
                    <div className="mt-4">
                        <ModeToggle />
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-white/75">
                        {isOnlineMode
                            ? 'Online mode unlocks tool-specific server paths where they exist, while still keeping the quick flow compact.'
                            : 'Offline mode keeps supported quick actions in the browser so you can work without upload overhead.'}
                    </p>
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Why this surface works</p>
                        <p className="mt-2 text-sm text-white/80">
                            Curated actions, fewer decisions, and direct handoff into executor-backed processing.
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-gray-200/80 bg-white/90 shadow-2xl transition-all duration-500 dark:border-white/10 dark:bg-gray-900/80">
                {files.length === 0 ? (
                    <div className="animate-fade-in p-3 sm:p-4">
                        <Dropzone
                            onFileSelect={handleFileSelect}
                            multiple={true}
                            label="Drop your files here"
                            description="Supports executor-backed quick actions for images, HEIC, PDFs, and videos"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col">
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
                                        Executor-backed quick actions only
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={resetAll}
                                className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                            >
                                Clear All
                            </button>
                        </div>

                        {results.length > 0 ? (
                            <div className="p-4 sm:p-10 space-y-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl shadow-lg shadow-green-500/30">
                                            ✓
                                        </div>
                                        <div>
                                            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Processing Complete</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Your files are ready to download.</p>
                                        </div>
                                    </div>
                                    {results.length > 1 && (
                                        <button onClick={handleDownloadAll} className="btn-primary w-full sm:w-auto py-3 sm:py-4 px-8 sm:px-10 shadow-xl shadow-primary-500/20">
                                            Download All
                                        </button>
                                    )}
                                </div>
                                <div className="grid gap-3 sm:gap-4">
                                    {results.map(({ original, result }, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-gray-50 dark:bg-white/5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 hover:border-green-500/30 transition-all group">
                                            <div className="flex items-center gap-3 sm:gap-5">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm border border-gray-100 dark:border-white/5 shrink-0">
                                                    {getResultIcon(result.file)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-white truncate max-w-[160px] sm:max-w-md text-sm sm:text-base">
                                                        {result.file?.name || original?.name || 'Processed File'}
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-500">
                                                        {result.file ? formatFileSize(result.file.size) : ''}
                                                        {result.meta?.note && (
                                                            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold uppercase">
                                                                {result.meta.note}
                                                            </span>
                                                        )}
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
                                    <button onClick={resetAll} className="text-primary-600 dark:text-primary-400 font-bold hover:underline text-sm sm:text-base">
                                        + Process more files
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 sm:p-10 space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900 custom-scrollbar">
                                    {files.map((file, index) => (
                                        <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 sm:p-5 bg-gray-50/50 dark:bg-white/5 rounded-2xl sm:rounded-[1.5rem] border border-gray-100 dark:border-white/5 group">
                                            <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                                                <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl border border-gray-100 dark:border-white/5 shrink-0">
                                                    {getResultIcon(file)}
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
                                            <input type="file" multiple onChange={(event) => Array.from(event.target.files || []).forEach(handleFileSelect)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[1.5rem] p-5 sm:p-8 text-center group-hover:border-primary-500/50 transition-all">
                                                <p className="text-gray-900 dark:text-white font-bold text-sm sm:text-base">+ Add More Files</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

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
                                                <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">Configure Settings</h3>
                                                <button onClick={() => { setShowOptions(false); setSelectedOperation(''); }} className="text-xs sm:text-sm font-bold text-gray-500 hover:text-primary-600">Back</button>
                                            </div>

                                            <div className="grid gap-6 sm:gap-10 max-w-2xl mx-auto py-2 sm:py-4">
                                                {selectedOperation === 'compress-image' && (
                                                    <div className="space-y-4 sm:space-y-6">
                                                        <div className="flex justify-between items-center text-gray-900 dark:text-white font-bold">
                                                            <label>Compression Quality</label>
                                                            <span className="text-primary-600 dark:text-primary-400">{quality}%</span>
                                                        </div>
                                                        <input type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(parseInt(event.target.value, 10))} className="w-full h-3 accent-primary-500 appearance-none bg-gray-200 dark:bg-white/10 rounded-full" />
                                                        <div className="flex justify-between text-xs text-gray-400">
                                                            <span>Smaller file</span>
                                                            <span>Better quality</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'convert-image' && (
                                                    <div className="space-y-5 sm:space-y-6">
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Output Format</p>
                                                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                                                {['png', 'jpg', 'webp'].map((format) => (
                                                                    <button key={format} onClick={() => setOutputFormat(format)} className={`py-3 sm:py-4 rounded-2xl border font-bold uppercase text-sm sm:text-base ${outputFormat === format ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>
                                                                        {format}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {['jpg', 'webp'].includes(outputFormat) && (
                                                            <div>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quality</p>
                                                                    <span className="text-sm font-black text-primary-600 dark:text-primary-400">{convertQuality}%</span>
                                                                </div>
                                                                <input type="range" min="10" max="100" value={convertQuality} onChange={(event) => setConvertQuality(parseInt(event.target.value, 10))} className="w-full h-3 accent-primary-500 appearance-none bg-gray-200 dark:bg-white/10 rounded-full" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Resize (optional)</p>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <input type="number" min="1" placeholder="Width (px)" value={width} onChange={(event) => setWidth(event.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                                <input type="number" min="1" placeholder="Height (px)" value={height} onChange={(event) => setHeight(event.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                            </div>
                                                            <label className="mt-2 flex items-center gap-2 cursor-pointer">
                                                                <input type="checkbox" checked={maintainAspectRatio} onChange={(event) => setMaintainAspectRatio(event.target.checked)} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">Maintain aspect ratio</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedOperation === 'resize-image' && (
                                                    <div className="space-y-4 sm:space-y-6">
                                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Target Dimensions</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input type="number" min="1" placeholder="Width (px)" value={width} onChange={(event) => setWidth(event.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                            <input type="number" min="1" placeholder="Height (px)" value={height} onChange={(event) => setHeight(event.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Resize executor currently expects both width and height.
                                                        </p>
                                                    </div>
                                                )}

                                                {selectedOperation === 'crop-image' && files.length === 1 && (
                                                    <InteractiveCropSelector
                                                        file={files[0]}
                                                        onChange={setManualCropData}
                                                    />
                                                )}

                                                {selectedOperation === 'image-to-pdf' && (
                                                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                                        {['fit', 'a4', 'letter'].map((value) => (
                                                            <button key={value} onClick={() => setPageSize(value)} className={`py-3 sm:py-4 rounded-2xl border font-bold uppercase text-sm sm:text-base ${pageSize === value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>
                                                                {value}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {selectedOperation === 'watermark' && (
                                                    <div className="space-y-4 sm:space-y-6">
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Watermark Text</label>
                                                            <input type="text" value={watermarkText} onChange={(event) => setWatermarkText(event.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <div className="flex justify-between mb-1">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Font Size</label>
                                                                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{watermarkFontSize}px</span>
                                                                </div>
                                                                <input type="range" min="12" max="120" value={watermarkFontSize} onChange={(event) => setWatermarkFontSize(parseInt(event.target.value, 10))} className="w-full h-2 accent-primary-500 rounded-full" />
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between mb-1">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Opacity</label>
                                                                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{watermarkOpacity}%</span>
                                                                </div>
                                                                <input type="range" min="10" max="100" value={watermarkOpacity} onChange={(event) => setWatermarkOpacity(parseInt(event.target.value, 10))} className="w-full h-2 accent-primary-500 rounded-full" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Position</label>
                                                            <div className="grid grid-cols-3 gap-1.5">
                                                                {['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map((value) => (
                                                                    <button key={value} onClick={() => setWatermarkPosition(value)} className={`py-2 px-1.5 rounded-xl border text-[11px] font-semibold transition-all ${watermarkPosition === value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-primary-400'}`}>
                                                                        {value}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Text Color</label>
                                                            <div className="flex items-center gap-3">
                                                                <input type="color" value={watermarkColor} onChange={(event) => setWatermarkColor(event.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 dark:border-white/10" />
                                                                <span className="text-sm text-gray-600 dark:text-gray-400">{watermarkColor}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Quick Converter uses the text watermark flow. Use the full tool for logo uploads.
                                                        </p>
                                                    </div>
                                                )}

                                                {selectedOperation === 'remove-background' && (
                                                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                                        {['low', 'medium'].map((value) => (
                                                            <button key={value} onClick={() => setBackgroundRemovalQuality(value)} className={`py-3 sm:py-4 rounded-2xl border font-bold uppercase text-sm sm:text-base ${backgroundRemovalQuality === value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>
                                                                {value === 'low' ? 'Fast' : 'High Quality'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {selectedOperation === 'heic-to-jpg' && (
                                                    <div className="space-y-4 sm:space-y-6">
                                                        <div className="flex justify-between items-center text-gray-900 dark:text-white font-bold">
                                                            <label>JPEG Quality</label>
                                                            <span className="text-primary-600 dark:text-primary-400">{quality}%</span>
                                                        </div>
                                                        <input type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(parseInt(event.target.value, 10))} className="w-full h-3 accent-primary-500 appearance-none bg-gray-200 dark:bg-white/10 rounded-full" />
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Online mode uses the explicit HEIC rescue path when browser decoding is not enough.
                                                        </p>
                                                    </div>
                                                )}

                                                {selectedOperation === 'compress-pdf' && (
                                                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                                        {['low', 'balanced', 'high'].map((level) => (
                                                            <button key={level} onClick={() => setPdfCompressionLevel(level)} className={`py-3 sm:py-4 rounded-2xl border font-bold capitalize text-sm sm:text-base ${pdfCompressionLevel === level ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>
                                                                {level}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {selectedOperation === 'pdf-to-jpg' && (
                                                    <div className="space-y-4 sm:space-y-6">
                                                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                                            {['all', 'first', 'custom'].map((value) => (
                                                                <button key={value} onClick={() => setPageRange(value)} className={`py-3 sm:py-4 rounded-2xl border font-bold uppercase text-sm sm:text-base ${pageRange === value ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-white/10'}`}>
                                                                    {value}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {pageRange === 'custom' && (
                                                            <input
                                                                type="text"
                                                                value={customPages}
                                                                onChange={(event) => setCustomPages(event.target.value)}
                                                                placeholder="e.g. 1,3-5"
                                                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                                            />
                                                        )}
                                                    </div>
                                                )}

                                                {selectedOperation === 'video-to-mp3' && (
                                                    <div className="space-y-4 sm:space-y-6">
                                                        <div className="flex justify-between items-center text-gray-900 dark:text-white font-bold">
                                                            <label>Audio Bitrate</label>
                                                            <span className="text-primary-600 dark:text-primary-400">{audioBitrate} kbps</span>
                                                        </div>
                                                        <input type="range" min="64" max="320" step="32" value={audioBitrate} onChange={(event) => setAudioBitrate(parseInt(event.target.value, 10))} className="w-full h-3 accent-primary-500 appearance-none bg-gray-200 dark:bg-white/10 rounded-full" />
                                                        <div className="flex justify-between text-xs text-gray-400">
                                                            <span>Smaller file</span>
                                                            <span>Higher quality</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="text-center p-5 sm:p-8 bg-primary-50/50 dark:bg-primary-500/5 rounded-3xl">
                                                    <p className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{currentOperation?.label || 'Ready to process'}</p>
                                                    {currentOperation?.description && (
                                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{currentOperation.description}</p>
                                                    )}
                                                </div>

                                                <button onClick={handleProcess} className="btn-primary w-full py-4 sm:py-6 text-lg sm:text-2xl font-black shadow-2xl shadow-primary-500/40">
                                                    Process Files
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in">
                                            <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-8">Choose an Operation</h3>

                                            {availableOperations.length === 0 ? (
                                                <div className="rounded-3xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-5 sm:p-8">
                                                    <p className="font-bold text-amber-900 dark:text-amber-300">No quick actions available for this file set in {mode} mode.</p>
                                                    <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                                                        Quick Converter only shows curated executor-backed tools. Try matching file types, switch modes if needed, or open the full tool page for more advanced workflows.
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4 max-h-[360px] sm:max-h-none overflow-y-auto pb-2 custom-scrollbar">
                                                        {availableOperations.map((operation) => (
                                                            <button
                                                                key={operation.id}
                                                                onClick={() => handleOperationSelect(operation.id)}
                                                                className={`p-3 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all flex flex-col items-center ${selectedOperation === operation.id ? 'border-primary-500 bg-white dark:bg-gray-800 shadow-xl ring-2 ring-primary-500/10' : 'border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900/50 hover:border-primary-500/50'}`}
                                                            >
                                                                <div className="text-2xl sm:text-4xl mb-1.5 sm:mb-4">{operation.icon}</div>
                                                                <p className={`text-xs sm:text-sm font-bold text-center leading-tight ${selectedOperation === operation.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>{operation.label}</p>
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {selectedOperation && (
                                                        <div className="mt-8 sm:mt-14 flex flex-col items-center gap-4 sm:gap-6">
                                                            <button onClick={() => setShowOptions(true)} className="btn-primary w-full sm:w-auto px-10 sm:px-16 py-4 sm:py-6 text-lg sm:text-2xl font-black shadow-2xl shadow-primary-500/30">
                                                                Continue
                                                            </button>
                                                            <button onClick={handleProcess} className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest">
                                                                Skip Settings and Process
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 rounded-[1.5rem] sm:rounded-[2rem] flex items-start sm:items-center gap-3 sm:gap-4">
                    <span className="text-xl sm:text-2xl shrink-0">⚠️</span>
                    <p className="text-red-800 dark:text-red-400 font-bold text-sm sm:text-base">{error}</p>
                </div>
            )}

            <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 text-center border-t border-gray-100 dark:border-white/5 max-w-2xl mx-auto">
                <p className="text-gray-900 dark:text-white font-extrabold text-base sm:text-lg mb-2">Executor-backed Quick Actions</p>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                    This surface now shares the same mode-aware runtime contract as the standalone pilot tools.
                </p>
            </div>
        </div>
    );
}
