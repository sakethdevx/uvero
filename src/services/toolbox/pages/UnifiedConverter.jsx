import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Dropzone from '../shared/Dropzone.jsx';
import Button from '../shared/Button.jsx';
import ProgressBar from '../shared/ProgressBar.jsx';
import FileInfo from '../shared/FileInfo.jsx';
import unifiedProcessor from '../core/unifiedProcessor.js';
import InteractiveCropSelector from '../components/InteractiveCropSelector.jsx';
import WatermarkSettings from '../components/WatermarkSettings.jsx';

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

    useEffect(() => {
        return () => {
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
            const res = await unifiedProcessor.convert(file, selectedFormat, (prog) => setProgress(prog), convertOptions);
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
        <div className="max-w-4xl mx-auto">
            <div className="relative group overflow-hidden rounded-[2.5rem] border border-gray-200/80 bg-white shadow-2xl shadow-gray-200/50 transition-all duration-500 hover:shadow-primary-500/10 dark:border-white/[0.08] dark:bg-gray-900/60 dark:shadow-none">
                {/* Premium Card Header Decoration */}
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-500" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors duration-700" />
                
                <div className="relative p-8 sm:p-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                                <svg className="w-3 h-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Powerful & Secure
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                Unified File <span className="text-primary-600 dark:text-primary-400">Converter</span>
                            </h2>
                            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl font-medium leading-relaxed">
                                Convert images, audio, and documents using <span className="text-gray-900 dark:text-white">WebAssembly</span>. 
                                <span className="hidden sm:inline"> Instant processing, 100% private, zero uploads.</span>
                            </p>
                        </div>
                        
                        {file && (
                            <button 
                                onClick={handleReset}
                                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clear File
                            </button>
                        )}
                    </div>

                    <div className="space-y-8">
                    {/* Dropzone */}
                    <Dropzone
                        onFileSelect={handleFileSelect}
                        accept="image/*,video/*,audio/*,.doc,.docx,.pdf,.epub,.odt,.html,.md,.txt,.rst,.csv,.tsv,.json,.docbook"
                        disabled={isProcessing}
                        value={file}
                    />

                    {file && categoryInfo && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Input Preview */}
                            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Original File
                                </h3>
                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
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
                                <FileInfo file={file} className="mt-2" />
                            </div>

                            {/* Settings */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Output Format
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {outputFormats.map((fmt) => {
                                            const isSpecial = fmt.value === 'remove-background' || fmt.value === 'crop' || fmt.value === 'resize' || fmt.value === 'watermark';
                                            const isSelected = selectedFormat === fmt.value;
                                            return (
                                                <button
                                                    key={fmt.value}
                                                    type="button"
                                                    onClick={() => { setSelectedFormat(fmt.value); if (fmt.value !== 'crop') setCropArea(null); }}
                                                    disabled={isProcessing}
                                                    className={`p-3 rounded-lg border text-left transition-colors ${isSelected
                                                        ? isSpecial
                                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-500'
                                                            : 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-500'
                                                        : isSpecial
                                                            ? 'border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 bg-purple-25 dark:bg-purple-900/10'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }`}
                                                >
                                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                        {fmt.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {fmt.desc}
                                                    </div>
                                                </button>
                                            );
                                        })}
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
                                                 <div className="grid grid-cols-2 gap-3">
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
                                        ? (selectedFormat === 'crop' ? 'Cropping...' : selectedFormat === 'resize' ? 'Resizing...' : selectedFormat === 'watermark' ? 'Watermarking...' : 'Converting...')
                                        : (selectedFormat === 'crop' ? 'Crop Image' : selectedFormat === 'resize' ? 'Resize Image' : selectedFormat === 'watermark' ? 'Add Watermark' : 'Convert')}
                                </Button>

                                {isProcessing && (
                                    <ProgressBar progress={progress} label="Processing..." />
                                )}
                            </div>
                        </div>
                    )}

                     {/* Result */}
                     {result && (
                         <div className="border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
                             <div className="flex items-center justify-between mb-3">
                                 <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                                     {selectedFormat === 'remove-background' ? '✓ Background Removed' : selectedFormat === 'crop' ? '✓ Image Cropped' : selectedFormat === 'resize' ? '✓ Image Resized' : selectedFormat === 'watermark' ? '✓ Watermark Added' : '✓ Conversion Complete'}
                                 </h3>
                                 <div className="flex gap-2">
                                     <Button onClick={handleReset} variant="outline" size="sm">
                                         {selectedFormat === 'remove-background' ? 'Process Another' : selectedFormat === 'crop' ? 'Crop Another' : selectedFormat === 'resize' ? 'Resize Another' : selectedFormat === 'watermark' ? 'Add to Another' : 'New Conversion'}
                                     </Button>
                                     <Button onClick={handleDownload} size="sm">
                                         Download
                                     </Button>
                                 </div>
                             </div>
                             <div className="grid md:grid-cols-2 gap-4">
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
    );
}
