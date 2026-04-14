import { useState, useEffect, useRef } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import imageConverterExecutor from './executor';

const OUTPUT_FORMATS = [
    { value: 'jpg', label: 'JPG', desc: 'Photos & small files' },
    { value: 'png', label: 'PNG', desc: 'Lossless & transparency' },
    { value: 'webp', label: 'WebP', desc: 'Best compression' },
];

const PRESET_SIZES = [
    { label: 'Original', w: null, h: null },
    { label: 'HD 1280×720', w: 1280, h: 720 },
    { label: 'Full HD 1920×1080', w: 1920, h: 1080 },
    { label: 'Web 800×600', w: 800, h: 600 },
    { label: 'Thumbnail 256×256', w: 256, h: 256 },
    { label: 'Custom', w: 'custom', h: 'custom' },
];

export default function ImageConverter({ mode = 'offline', isOnlineMode = mode === 'online' }) {
    const [file, setFile] = useState(null);
    const [outputFormat, setOutputFormat] = useState('png');
    const [quality, setQuality] = useState(92);
    const [sizePreset, setSizePreset] = useState(0); // index into PRESET_SIZES
    const [customWidth, setCustomWidth] = useState('');
    const [customHeight, setCustomHeight] = useState('');
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [imageDimensions, setImageDimensions] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [resultPreviewUrl, setResultPreviewUrl] = useState('');
    const aspectRef = useRef(1);

    useEffect(() => {
        return () => {
            imageConverterExecutor.cleanup?.();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (resultPreviewUrl) URL.revokeObjectURL(resultPreviewUrl);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            const img = new Image();
            img.onload = () => {
                setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
                aspectRef.current = img.naturalWidth / img.naturalHeight;
            };
            img.src = url;
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    useEffect(() => {
        if (result?.primaryFile) {
            const url = URL.createObjectURL(result.primaryFile);
            setResultPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [result]);

    const getTargetDimensions = () => {
        const preset = PRESET_SIZES[sizePreset];
        if (!preset || preset.w === null) return { width: null, height: null };
        if (preset.w === 'custom') {
            return {
                width: customWidth ? parseInt(customWidth) : null,
                height: customHeight ? parseInt(customHeight) : null,
            };
        }
        return { width: preset.w, height: preset.h };
    };

    const handleWidthChange = (val) => {
        setCustomWidth(val);
        if (maintainAspectRatio && val && aspectRef.current) {
            setCustomHeight(String(Math.round(parseInt(val) / aspectRef.current)));
        }
    };

    const handleHeightChange = (val) => {
        setCustomHeight(val);
        if (maintainAspectRatio && val && aspectRef.current) {
            setCustomWidth(String(Math.round(parseInt(val) * aspectRef.current)));
        }
    };

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setResult(null);
        setError('');
        setProgress(0);
        setImageDimensions(null);
    };

    const handleConvert = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError('');
        setProgress(0);
        try {
            const { width, height } = getTargetDimensions();
            const qualityValue = ['jpg', 'jpeg', 'webp'].includes(outputFormat) ? quality : null;
            const converted = await imageConverterExecutor.run({
                files: [file],
                options: {
                    outputFormat,
                    width,
                    height,
                    maintainAspectRatio,
                    quality: qualityValue,
                },
                mode,
                onProgress: setProgress,
            });
            setProgress(100);
            setResult(converted);
        } catch (err) {
            setError(err.message || 'Conversion failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        const url = URL.createObjectURL(result.primaryFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.primaryFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError('');
        setProgress(0);
        setCustomWidth('');
        setCustomHeight('');
        setSizePreset(0);
        setMaintainAspectRatio(true);
        setOutputFormat('png');
        setQuality(92);
        setImageDimensions(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
    };

    const formatSize = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(2)} MB`;
    };

    const resultFormat = result?.meta?.format ?? outputFormat.toUpperCase();
    const resultDimensions = result?.meta?.dimensions;
    const resultOriginalSize = result?.meta?.originalSize ?? file?.size ?? 0;
    const resultConvertedSize = result?.meta?.outputSize ?? result?.primaryFile?.size ?? 0;

    const isLossy = ['jpg', 'jpeg', 'webp'].includes(outputFormat);
    const selectedPreset = PRESET_SIZES[sizePreset];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-8 dark:border-white/[0.08] dark:from-sky-500/10 dark:via-gray-950 dark:to-blue-500/10">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">Image Tools</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Image Converter
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300 max-w-xl">
                        Convert between JPG, PNG, and WebP. Control output quality and resize in one step.
                        {isOnlineMode
                            ? ' Online mode uses the server image runtime for the conversion step.'
                            : ' Offline mode keeps processing in your browser for maximum privacy.'}
                    </p>
                    <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border ${
                        isOnlineMode
                            ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300'
                            : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnlineMode ? 'bg-amber-500' : 'bg-green-500'}`} />
                        {isOnlineMode ? 'Online Runtime — Files are sent to the image transform service' : 'Offline Mode — Files stay on your device'}
                    </div>
                </div>

                {/* Upload */}
                {!file && !result && (
                    <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-gray-900/40 p-4">
                        <Dropzone
                            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp"
                            onFileSelect={handleFileSelect}
                            maxSize={50 * 1024 * 1024}
                        />
                    </div>
                )}

                {/* Controls */}
                {file && !result && (
                    <div className="space-y-4">
                        <FileInfo file={file} />

                        {/* Preview + Options side-by-side on desktop */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Preview */}
                            {previewUrl && (
                                <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-gray-900/40 p-5">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Original Preview</p>
                                    <div className="flex justify-center items-center bg-gray-50 dark:bg-black/20 rounded-2xl p-3 min-h-48">
                                        <img src={previewUrl} alt="Original" className="max-h-56 max-w-full rounded-xl shadow object-contain" />
                                    </div>
                                    {imageDimensions && (
                                        <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
                                            {imageDimensions.w} × {imageDimensions.h} px · {formatSize(file.size)}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Options */}
                            <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-gray-900/40 p-5 space-y-5">
                                {/* Output Format */}
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Output Format</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {OUTPUT_FORMATS.map((fmt) => (
                                            <button
                                                key={fmt.value}
                                                onClick={() => setOutputFormat(fmt.value)}
                                                disabled={isProcessing}
                                                className={`py-3 px-2 rounded-2xl border text-center transition-all disabled:opacity-50 ${
                                                    outputFormat === fmt.value
                                                        ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/20'
                                                        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:border-sky-300 dark:hover:border-sky-500/40'
                                                }`}
                                            >
                                                <p className="font-bold text-sm">{fmt.label}</p>
                                                <p className={`text-[10px] mt-0.5 ${outputFormat === fmt.value ? 'text-sky-100' : 'text-gray-400'}`}>{fmt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quality Slider (for lossy formats) */}
                                {isLossy && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Output Quality</p>
                                            <span className="text-sm font-black text-sky-600 dark:text-sky-400">{quality}%</span>
                                        </div>
                                        <input
                                            type="range" min="10" max="100" step="1" value={quality}
                                            onChange={(e) => setQuality(parseInt(e.target.value))}
                                            disabled={isProcessing}
                                            className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-50"
                                            style={{ background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${quality}%, #e5e7eb ${quality}%, #e5e7eb 100%)` }}
                                        />
                                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                            <span>Smaller file</span>
                                            <span>Best quality</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resize Options */}
                        <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-gray-900/40 p-5">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Resize (Optional)</p>

                            {/* Presets */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {PRESET_SIZES.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSizePreset(idx);
                                            if (preset.w !== 'custom') { setCustomWidth(''); setCustomHeight(''); }
                                        }}
                                        disabled={isProcessing}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-50 ${
                                            sizePreset === idx
                                                ? 'border-sky-500 bg-sky-500 text-white'
                                                : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-sky-300 dark:hover:border-sky-500/40'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom size inputs */}
                            {selectedPreset?.w === 'custom' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width (px)</label>
                                            <input
                                                type="number" min="1" placeholder={imageDimensions?.w || 'Auto'}
                                                value={customWidth}
                                                onChange={(e) => handleWidthChange(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none disabled:opacity-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height (px)</label>
                                            <input
                                                type="number" min="1" placeholder={imageDimensions?.h || 'Auto'}
                                                value={customHeight}
                                                onChange={(e) => handleHeightChange(e.target.value)}
                                                disabled={isProcessing}
                                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox" checked={maintainAspectRatio}
                                            onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                                            disabled={isProcessing}
                                            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Maintain aspect ratio</span>
                                    </label>
                                </div>
                            )}
                            {selectedPreset?.w !== null && selectedPreset?.w !== 'custom' && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Output will be resized to {selectedPreset.w} × {selectedPreset.h} px
                                </p>
                            )}
                        </div>

                        {/* Progress */}
                        {isProcessing && (
                            <div className="rounded-3xl border border-sky-200/80 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/5 p-5">
                                <ProgressBar progress={progress} label="Converting image…" />
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="rounded-3xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 p-4">
                                <p className="text-sm font-semibold text-red-600 dark:text-red-400">⚠️ {error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button onClick={handleConvert} disabled={isProcessing} loading={isProcessing} fullWidth
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                            >
                                Convert Image
                            </Button>
                            <Button onClick={handleReset} variant="secondary" disabled={isProcessing}>Cancel</Button>
                        </div>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="space-y-4">
                        {/* Success Banner */}
                        <div className="rounded-3xl border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5 p-5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center text-white text-lg shadow-lg shadow-green-500/30 shrink-0">✓</div>
                            <div>
                                <p className="font-bold text-green-900 dark:text-green-100">Conversion Complete!</p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Converted to {resultFormat} · {formatSize(resultConvertedSize)}
                                    {resultDimensions && ` · ${resultDimensions.converted.width} × ${resultDimensions.converted.height} px`}
                                </p>
                            </div>
                        </div>

                        {/* Before / After Preview */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-gray-900/40 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Original</p>
                                <div className="flex justify-center items-center bg-gray-50 dark:bg-black/20 rounded-2xl p-3 min-h-40">
                                    {previewUrl && <img src={previewUrl} alt="Original" className="max-h-48 max-w-full rounded-xl object-contain" />}
                                </div>
                                <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
                                    {file?.type.split('/')[1]?.toUpperCase()} · {formatSize(resultOriginalSize)}
                                    {resultDimensions && ` · ${resultDimensions.original.width}×${resultDimensions.original.height}`}
                                </p>
                            </div>
                            <div className="rounded-3xl border border-sky-200/80 bg-sky-50/30 dark:border-sky-500/20 dark:bg-sky-500/5 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-sky-500 dark:text-sky-400 mb-2">Converted</p>
                                <div className="flex justify-center items-center bg-white/60 dark:bg-black/20 rounded-2xl p-3 min-h-40">
                                    {resultPreviewUrl && <img src={resultPreviewUrl} alt="Converted" className="max-h-48 max-w-full rounded-xl object-contain" />}
                                </div>
                                <p className="mt-2 text-center text-xs text-sky-600 dark:text-sky-400 font-semibold">
                                    {resultFormat} · {formatSize(resultConvertedSize)}
                                    {resultDimensions && ` · ${resultDimensions.converted.width}×${resultDimensions.converted.height}`}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-gray-900/40 p-5">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Conversion Results</p>
                            <div className="grid sm:grid-cols-3 gap-3">
                                <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] p-4 text-center">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Format</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {file?.type.split('/')[1]?.toUpperCase()} → {resultFormat}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] p-4 text-center">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">File Size</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {formatSize(resultOriginalSize)} → {formatSize(resultConvertedSize)}
                                    </p>
                                </div>
                                {resultDimensions && (
                                    <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] p-4 text-center">
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Dimensions</p>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {resultDimensions.converted.width} × {resultDimensions.converted.height}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Download */}
                        <Button onClick={handleDownload} fullWidth
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                        >
                            Download Converted Image
                        </Button>
                        <Button onClick={handleReset} variant="secondary" fullWidth>Convert Another Image</Button>
                    </div>
                )}

                {/* FAQ */}
                <div className="rounded-3xl border border-gray-200/80 bg-gray-50/80 dark:border-white/[0.08] dark:bg-white/[0.02] p-6 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">FAQ</p>
                    {[
                        { q: 'What formats are supported?', a: 'You can convert between JPG/JPEG, PNG, and WebP. Input also accepts GIF and BMP files.' },
                        { q: 'What does the quality slider control?', a: 'For JPG and WebP output the quality slider (10–100%) trades file size against visual sharpness. PNG is always lossless, so the slider is hidden.' },
                        { q: 'Are my images uploaded to a server?', a: isOnlineMode ? 'Yes in online mode. This page sends the image to the server transform runtime so conversion can finish there.' : 'No in offline mode. Conversion runs entirely in your browser using a Web Worker.' },
                        { q: 'Which format should I choose?', a: 'JPG for photos with small file sizes; PNG for graphics and transparency; WebP for the best size-to-quality ratio on the web.' },
                    ].map((faq, i) => (
                        <div key={i}>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{faq.q}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
