import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Dropzone from '../shared/Dropzone.jsx';
import Button from '../shared/Button.jsx';
import ProgressBar from '../shared/ProgressBar.jsx';
import FileInfo from '../shared/FileInfo.jsx';
import unifiedProcessor from '../core/unifiedProcessor.js';
import InteractiveCropSelector from '../components/InteractiveCropSelector.jsx';
import WatermarkSettings from '../components/WatermarkSettings.jsx';
import AILoader from '../../../components/AILoader.jsx';

const SUPPORTED_CATEGORIES = {
    image: {
        title: 'Image Converter',
        description: 'Convert between 50+ image formats (JPG, PNG, WebP, AVIF, HEIC, TIFF, PSD, RAW, etc.)',
        icon: '🖼️',
        badge: 'WASM powered'
    },
    document: {
        title: 'Document Converter',
        description: 'Convert documents (DOCX, PDF, EPUB, HTML, Markdown, etc.) using Pandoc',
        icon: '📄',
        badge: 'Pandoc'
    },
    audio: {
        title: 'Audio Converter',
        description: 'Convert audio files (MP3, WAV, FLAC, AAC, OGG, etc.) entirely in your browser',
        icon: '🎵',
        badge: 'FFmpeg'
    },
    video: {
        title: 'Video Converter',
        description: 'Convert video files (MP4, MKV, WebM, GIF, etc.) entirely in your browser',
        icon: '🎥',
        badge: 'FFmpeg'
    }
};

const isBrowserSupportedVideo = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext);
};

export default function UnifiedConverter() {
    const [searchParams] = useSearchParams();
    const [file, setFile] = useState(null);
    const [category, setCategory] = useState(null);
    const [outputFormats, setOutputFormats] = useState([]);
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [processingMessage, setProcessingMessage] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [resultPreviewUrl, setResultPreviewUrl] = useState('');
    const [cropArea, setCropArea] = useState(null);

    // Resize state
    const [resizeMode, setResizeMode] = useState('dimensions'); // 'dimensions' or 'percentage'
    const [resizeWidth, setResizeWidth] = useState('');
    const [resizeHeight, setResizeHeight] = useState('');
    const [resizePercentage, setResizePercentage] = useState('100');
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [originalDimensions, setOriginalDimensions] = useState(null);
    const [formatSearchQuery, setFormatSearchQuery] = useState('');

    // Watermark state
    const [watermarkOptions, setWatermarkOptions] = useState({
        type: 'text',
        text: '© Uvero',
        fontSize: 48,
        color: '#ffffff',
        opacity: 0.5,
        position: 'bottom-right',
        watermarkImage: null
    });

    const [engineStatus, setEngineStatus] = useState(unifiedProcessor.engineStatus);

    useEffect(() => {
        // Start preloading the engine in the background
        unifiedProcessor.preload();

        // Subscribe to engine status changes
        const unsubscribe = unifiedProcessor.subscribe((status) => {
            setEngineStatus(status);
        });

        return () => {
            unsubscribe();
            unifiedProcessor.cancelPreload();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (resultPreviewUrl) URL.revokeObjectURL(resultPreviewUrl);
        };
    }, [previewUrl, resultPreviewUrl]);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    }, [file]);

    useEffect(() => {
        if (result?.file) {
            const url = URL.createObjectURL(result.file);
            setResultPreviewUrl(url);
        }
    }, [result]);

    // Handle deep linking from search
    useEffect(() => {
        const targetFormat = searchParams.get('to');
        if (targetFormat && outputFormats.some(f => f.value === targetFormat)) {
            setSelectedFormat(targetFormat);
        }
    }, [outputFormats, searchParams]);

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setResult(null);
        setError('');
        setProgress(0);
        setSelectedFormat(null);
        setCropArea(null);
        setOriginalDimensions(null);
        setResizeWidth('');
        setResizeHeight('');

        // Detect category and available outputs
        const cat = unifiedProcessor.detectCategory(selectedFile);
        setCategory(cat);
        if (cat) {
            setOutputFormats(unifiedProcessor.getSupportedOutputs(selectedFile));

            // If image, get dimensions for resizing
            if (cat === 'image') {
                const img = new Image();
                img.src = URL.createObjectURL(selectedFile);
                img.onload = () => {
                    setOriginalDimensions({ width: img.width, height: img.height });
                    setResizeWidth(img.width.toString());
                    setResizeHeight(img.height.toString());
                    URL.revokeObjectURL(img.src);
                };
            }
        } else {
            setOutputFormats([]);
            setError('Unsupported file type. Please upload an image, audio file, or document.');
        }
    };

    const handleWidthChange = (value) => {
        setResizeWidth(value);
        if (maintainAspectRatio && originalDimensions && value) {
            const newWidth = parseInt(value);
            if (!isNaN(newWidth)) {
                const aspectRatio = originalDimensions.height / originalDimensions.width;
                setResizeHeight(Math.round(newWidth * aspectRatio).toString());
            }
        }
    };

    const handleHeightChange = (value) => {
        setResizeHeight(value);
        if (maintainAspectRatio && originalDimensions && value) {
            const newHeight = parseInt(value);
            if (!isNaN(newHeight)) {
                const aspectRatio = originalDimensions.width / originalDimensions.height;
                setResizeWidth(Math.round(newHeight * aspectRatio).toString());
            }
        }
    };

    const handleConvert = async () => {
        if (!file || !selectedFormat) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);
        // Set appropriate initial message
        if (selectedFormat === 'remove-background') {
            setProcessingMessage('Loading AI Model...');
        } else if (selectedFormat === 'crop') {
            setProcessingMessage('Preparing Crop...');
        } else if (selectedFormat === 'resize') {
            setProcessingMessage('Preparing Resize...');
        } else if (selectedFormat === 'watermark') {
            setProcessingMessage('Preparing Watermark...');
        } else {
            setProcessingMessage('Initializing Engine...');
        }
        setResult(null);

        try {
            let convertOptions = {};
            if (selectedFormat === 'crop') {
                convertOptions = { cropArea };
            } else if (selectedFormat === 'resize') {
                let targetWidth, targetHeight;
                if (resizeMode === 'percentage') {
                    const scale = parseFloat(resizePercentage) / 100;
                    targetWidth = Math.round(originalDimensions.width * scale);
                    targetHeight = Math.round(originalDimensions.height * scale);
                } else {
                    targetWidth = parseInt(resizeWidth);
                    targetHeight = parseInt(resizeHeight);
                }
                convertOptions = { width: targetWidth, height: targetHeight };
            } else if (selectedFormat === 'watermark') {
                convertOptions = watermarkOptions;
            }
            const res = await unifiedProcessor.convert(file, selectedFormat, (prog) => {
                setProgress(prog);
                if (prog > 0) setProcessingMessage('Processing...');
            }, convertOptions);
            setResult(res);
        } catch (err) {
            setError(err.message || 'Conversion failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result?.file) return;
        const url = URL.createObjectURL(result.file);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.file.name;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError('');
        setProgress(0);
        setCategory(null);
        setOutputFormats([]);
        setSelectedFormat(null);
        setCropArea(null);
        setOriginalDimensions(null);
    };

    const categoryInfo = category ? SUPPORTED_CATEGORIES[category] : null;

    return (
        <div className="w-full">
            <div className="glass-panel relative overflow-hidden transition-all duration-300 ease-apple">
                <div className="relative p-4 sm:p-5">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                            <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white sm:text-xl">
                                Unified Converter
                            </h2>
                            <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                                Private file processing. Drop, choose output, run.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 md:gap-4 w-full sm:w-auto">
                            {/* Neural Engine Status Indicator */}
                            <div className={`flex items-center gap-2 px-3 h-10 rounded-xl border transition-all duration-500 shrink-0 ${
                                engineStatus === 'ready' 
                                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
                                : engineStatus === 'downloading'
                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 animate-pulse'
                                : 'bg-gray-100 dark:bg-white/[0.05] border-gray-200 dark:border-white/10 text-gray-500'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    engineStatus === 'ready' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                                    engineStatus === 'downloading' ? 'bg-indigo-500 animate-ping' : 'bg-gray-400'
                                }`} />
                                <span className="text-[10px] font-black uppercase tracking-wider">
                                    {engineStatus === 'ready' ? 'Engine Ready' : engineStatus === 'downloading' ? 'Optimizing' : 'Engine Idle'}
                                </span>
                            </div>

                            {file && (
                                <button 
                                    onClick={handleReset}
                                    className="suggestion-chip !opacity-100 !animate-none h-10 text-red-600 dark:text-red-400 flex items-center gap-2 px-4 group/discard"
                                >
                                    <svg className="w-4 h-4 transition-transform group-hover/discard:rotate-90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="text-[10px] font-black uppercase tracking-wider">Discard</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                    {/* AI Enhanced Dropzone */}
                    <div className="relative">
                        <div className="relative">
                            <Dropzone
                                onFileSelect={handleFileSelect}
                                accept="image/*,video/*,audio/*,.doc,.docx,.pdf,.epub,.odt,.html,.md,.txt,.rst,.csv,.tsv,.json,.docbook"
                                disabled={isProcessing}
                                minimized={!!file}
                            />
                        </div>
                    </div>

                    {file && categoryInfo && (
                        <div className="grid gap-6 md:grid-cols-[minmax(280px,0.4fr)_1fr] lg:grid-cols-[minmax(320px,0.75fr)_minmax(0,1fr)]">
                            {/* Input Preview */}
                            <div className="glass-subtle p-5 flex flex-col bg-white/5 dark:bg-black/20 border-gray-200/50 dark:border-white/5">
                                <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
                                    Source Node
                                </h3>
                                <div className="aspect-video md:aspect-[4/3] lg:aspect-square overflow-hidden rounded-2xl bg-gray-100 dark:bg-black/40 flex items-center justify-center border border-gray-200 dark:border-white/10 shadow-inner">
                                    {category === 'image' && previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                                    ) : category === 'video' && previewUrl ? (
                                        <div className="w-full px-4 flex flex-col items-center justify-center">
                                            {isBrowserSupportedVideo(file.name) ? (
                                                <video src={previewUrl} controls className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <div className="text-center">
                                                    <div className="text-6xl mb-4">{categoryInfo.icon}</div>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-[200px] break-words mx-auto">
                                                        Preview not available for .{file.name.split('.').pop()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : category === 'audio' && previewUrl ? (
                                        <div className="w-full px-4 flex flex-col items-center justify-center">
                                            <div className="text-6xl mb-4">{categoryInfo.icon}</div>
                                            <audio src={previewUrl} controls className="w-full mt-2" />
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">{categoryInfo.icon}</div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 break-words px-2">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                    <FileInfo file={file} variant="ghost" />
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                                        <label className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.15em]">
                                            Target Format
                                        </label>
                                        <div className="relative flex-1 max-w-xs">
                                            <input
                                                type="text"
                                                placeholder="Search formats..."
                                                value={formatSearchQuery}
                                                onChange={(e) => setFormatSearchQuery(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                            />
                                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="max-h-[260px] overflow-y-auto pr-2 -mr-2 custom-scrollbar">
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                                            {outputFormats
                                                .filter(fmt => 
                                                    fmt.label.toLowerCase().includes(formatSearchQuery.toLowerCase()) || 
                                                    fmt.value.toLowerCase().includes(formatSearchQuery.toLowerCase()) ||
                                                    fmt.desc?.toLowerCase().includes(formatSearchQuery.toLowerCase())
                                                )
                                                .map((fmt) => {
                                                    const isSpecial = fmt.value === 'remove-background' || fmt.value === 'crop' || fmt.value === 'resize' || fmt.value === 'watermark';
                                                    const isSelected = selectedFormat === fmt.value;
                                                    return (
                                                        <button
                                                            key={fmt.value}
                                                            type="button"
                                                            onClick={() => { setSelectedFormat(fmt.value); if (fmt.value !== 'crop') setCropArea(null); }}
                                                            disabled={isProcessing}
                                                            className={`relative overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-300 ease-apple group/fmt flex flex-col justify-between min-h-[72px] ${isSelected
                                                                ? isSpecial
                                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                                                                    : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                                                                : isSpecial
                                                                    ? 'border-purple-100 dark:border-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-white/[0.02]'
                                                                    : 'border-gray-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-900/50 bg-white dark:bg-white/[0.02]'
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start gap-1">
                                                                <div className={`font-black text-[13px] tracking-tight transition-colors ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 group-hover/fmt:text-indigo-600 dark:group-hover/fmt:text-indigo-400'}`}>
                                                                    {fmt.label}
                                                                </div>
                                                                {isSelected && (
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isSpecial ? 'bg-purple-500' : 'bg-indigo-500'} animate-pulse shrink-0 mt-1`} />
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium leading-tight line-clamp-2">
                                                                {fmt.desc}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                        {outputFormats.filter(fmt => 
                                            fmt.label.toLowerCase().includes(formatSearchQuery.toLowerCase()) || 
                                            fmt.value.toLowerCase().includes(formatSearchQuery.toLowerCase())
                                        ).length === 0 && (
                                            <div className="py-12 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl">
                                                <div className="mx-auto w-12 h-12 mb-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No formats found matching "{formatSearchQuery}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Crop Selector - shown when crop format is selected */}
                                {selectedFormat === 'crop' && file && (
                                    <div className="border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                            ✂️ Adjust Crop Area
                                        </h3>
                                        <InteractiveCropSelector
                                            file={file}
                                            onChange={setCropArea}
                                        />
                                    </div>
                                 )}

                                 {/* Resize Settings */}
                                 {selectedFormat === 'resize' && originalDimensions && (
                                     <div className="border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4 space-y-4">
                                         <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                             📏 Resize Settings
                                         </h3>
                                         
                                         <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                             <button
                                                 onClick={() => setResizeMode('dimensions')}
                                                 className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${resizeMode === 'dimensions' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                             >
                                                 Dimensions
                                             </button>
                                             <button
                                                 onClick={() => setResizeMode('percentage')}
                                                 className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${resizeMode === 'percentage' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                             >
                                                 Percentage
                                             </button>
                                         </div>

                                         {resizeMode === 'dimensions' ? (
                                             <div className="space-y-3">
                                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                     <div>
                                                         <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Width</label>
                                                         <input
                                                             type="number"
                                                             value={resizeWidth}
                                                             onChange={(e) => handleWidthChange(e.target.value)}
                                                             className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                         />
                                                     </div>
                                                     <div>
                                                         <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Height</label>
                                                         <input
                                                             type="number"
                                                             value={resizeHeight}
                                                             onChange={(e) => handleHeightChange(e.target.value)}
                                                             className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                         />
                                                     </div>
                                                 </div>
                                                 <label className="flex items-center gap-2 cursor-pointer group">
                                                     <input
                                                         type="checkbox"
                                                         checked={maintainAspectRatio}
                                                         onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                                                         className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                     />
                                                     <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Maintain aspect ratio</span>
                                                 </label>
                                             </div>
                                         ) : (
                                             <div className="space-y-3">
                                                 <div>
                                                     <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Scale Percentage</label>
                                                     <div className="flex items-center gap-3">
                                                         <input
                                                             type="range"
                                                             min="1"
                                                             max="200"
                                                             value={resizePercentage}
                                                             onChange={(e) => setResizePercentage(e.target.value)}
                                                             className="flex-1 accent-purple-600"
                                                         />
                                                         <span className="text-sm font-mono w-12 text-right">{resizePercentage}%</span>
                                                     </div>
                                                 </div>
                                                 <div className="flex flex-wrap gap-2">
                                                     {[25, 50, 75, 100, 150, 200].map(p => (
                                                         <button
                                                             key={p}
                                                             onClick={() => setResizePercentage(p.toString())}
                                                             className={`px-2 py-1 text-[10px] font-bold rounded ${resizePercentage === p.toString() ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                                         >
                                                             {p}%
                                                         </button>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}
                                         
                                         <div className="pt-2 border-t border-purple-100 dark:border-purple-900/30">
                                             <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                 New dimensions: <span className="font-bold text-gray-700 dark:text-gray-300">
                                                     {resizeMode === 'percentage' 
                                                        ? `${Math.round(originalDimensions.width * parseInt(resizePercentage)/100)} × ${Math.round(originalDimensions.height * parseInt(resizePercentage)/100)}`
                                                        : `${resizeWidth || 0} × ${resizeHeight || 0}`
                                                     } px
                                                 </span>
                                             </p>
                                         </div>
                                     </div>
                                 )}

                                 {/* Watermark Settings */}
                                 {selectedFormat === 'watermark' && (
                                     <WatermarkSettings 
                                         options={watermarkOptions} 
                                         onChange={setWatermarkOptions} 
                                     />
                                 )}

                                <Button
                                    onClick={handleConvert}
                                    disabled={!selectedFormat || isProcessing || (selectedFormat === 'crop' && !cropArea) || (selectedFormat === 'resize' && (!resizeWidth || !resizeHeight)) || (selectedFormat === 'watermark' && (watermarkOptions.type === 'text' ? !watermarkOptions.text : !watermarkOptions.watermarkImage))}
                                    loading={isProcessing}
                                    className="w-full"
                                >
                                    {isProcessing
                                        ? (selectedFormat === 'remove-background' ? 'Removing Background...' : selectedFormat === 'crop' ? 'Cropping...' : selectedFormat === 'resize' ? 'Resizing...' : selectedFormat === 'watermark' ? 'Watermarking...' : 'Converting...')
                                        : (selectedFormat === 'remove-background' ? 'Remove Background with AI' : selectedFormat === 'crop' ? 'Crop Image' : selectedFormat === 'resize' ? 'Resize Image' : selectedFormat === 'watermark' ? 'Add Watermark' : 'Convert')}
                                </Button>

                                {isProcessing && (
                                    <div className="space-y-3 pt-2">
                                        <AILoader mode="steps" steps={['Prepare', 'Process', 'Package']} currentStep={progress > 85 ? 2 : progress > 5 ? 1 : 0} />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">
                                                    {processingMessage}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                {Math.round(progress)}%
                                            </span>
                                        </div>
                                        <ProgressBar progress={progress} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                     {/* Result */}
                     {result && (
                         <div className="result-card rounded-xl border border-green-200 bg-green-50/80 p-4 dark:border-green-800/60 dark:bg-green-500/10">
                             <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
                                 <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                                     {selectedFormat === 'remove-background' ? '✓ Background Removed' : selectedFormat === 'crop' ? '✓ Image Cropped' : selectedFormat === 'resize' ? '✓ Image Resized' : selectedFormat === 'watermark' ? '✓ Watermark Added' : '✓ Conversion Complete'}
                                 </h3>
                                 <div className="flex gap-2 w-full sm:w-auto">
                                     <Button onClick={handleReset} variant="outline" size="sm" className="flex-1 sm:flex-none">
                                         {selectedFormat === 'remove-background' ? 'Process Another' : selectedFormat === 'crop' ? 'Crop Another' : selectedFormat === 'resize' ? 'Resize Another' : selectedFormat === 'watermark' ? 'Add to Another' : 'New Conversion'}
                                     </Button>
                                     <Button onClick={handleDownload} size="sm" className="flex-1 sm:flex-none">
                                         Download
                                     </Button>
                                 </div>
                             </div>
                             <div className="grid gap-4 md:grid-cols-2">
                                 <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                                     {category === 'image' && resultPreviewUrl ? (
                                         <img src={resultPreviewUrl} alt="Result" className="max-w-full max-h-full object-contain" />
                                     ) : category === 'video' && resultPreviewUrl ? (
                                         <div className="w-full px-4 flex flex-col items-center justify-center">
                                             {isBrowserSupportedVideo(result.file.name) ? (
                                                 <video src={resultPreviewUrl} controls className="max-w-full max-h-full object-contain" />
                                             ) : (
                                                 <div className="text-center">
                                                     <div className="text-6xl mb-4 text-center">{categoryInfo?.icon || '🎥'}</div>
                                                     <p className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-[200px] break-words mx-auto">
                                                         Preview not available for .{result.file.name.split('.').pop()}
                                                     </p>
                                                 </div>
                                             )}
                                         </div>
                                     ) : category === 'audio' && resultPreviewUrl ? (
                                         <div className="w-full px-4 flex flex-col items-center justify-center">
                                             <div className="text-6xl mb-4 text-center">{categoryInfo?.icon || '🎵'}</div>
                                             <audio src={resultPreviewUrl} controls className="w-full mt-2" />
                                         </div>
                                     ) : (
                                         <div className="text-center">
                                             <div className="text-4xl mb-2">📄</div>
                                             <p className="font-medium text-gray-900 dark:text-white">
                                                 {result.file.name}
                                             </p>
                                         </div>
                                     )}
                                 </div>
                                 <div className="space-y-2">
                                     <FileInfo
                                         file={result.file}
                                         originalSize={result.originalSize}
                                     />
                                     <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                         {selectedFormat === 'remove-background' || selectedFormat === 'crop' || selectedFormat === 'resize' || selectedFormat === 'watermark' ? (
                                             <>
                                                 <p className="text-sm text-gray-600 dark:text-gray-400">
                                                     Output: <span className="font-mono">{result.format || 'PNG'}</span>
                                                 </p>
                                                 {result.width && result.height && (
                                                     <p className="text-sm text-gray-600 dark:text-gray-400">
                                                         Dimensions: <span className="font-mono">{result.width} × {result.height}</span>
                                                     </p>
                                                 )}
                                             </>
                                         ) : (
                                             <>
                                                 <p className="text-sm text-gray-600 dark:text-gray-400">
                                                     Format: <span className="font-mono">{selectedFormat.toUpperCase()}</span>
                                                 </p>
                                                 {category === 'image' && (
                                                     <p className="text-sm text-gray-600 dark:text-gray-400">
                                                         Quality: <span className="font-mono">92%</span>
                                                     </p>
                                                 )}
                                             </>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                            <p className="font-semibold">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
    );
}
