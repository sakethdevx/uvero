import { useState, useEffect } from 'react';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import imageCompressorExecutor from './executor';

const QUALITY_PRESETS = [
    { label: 'Maximum', value: 95, desc: 'Highest quality, larger file' },
    { label: 'High', value: 85, desc: 'Great balance' },
    { label: 'Medium', value: 70, desc: 'Good quality, smaller file' },
    { label: 'Low', value: 50, desc: 'Smallest file, visible loss' },
];

export default function ImageCompressor({ mode = 'offline', isOnlineMode = mode === 'online' }) {
    const [file, setFile] = useState(null);
    const [quality, setQuality] = useState(80);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [resultPreviewUrl, setResultPreviewUrl] = useState('');

    useEffect(() => {
        return () => {
            imageCompressorExecutor.cleanup?.();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (resultPreviewUrl) URL.revokeObjectURL(resultPreviewUrl);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
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

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setResult(null);
        setError('');
        setProgress(0);
    };

    const handleCompress = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError('');
        setProgress(0);
        try {
            const compressed = await imageCompressorExecutor.run({
                files: [file],
                options: { quality },
                mode,
                onProgress: setProgress,
            });
            setProgress(100);
            setResult(compressed);
        } catch (err) {
            setError(err.message || 'Compression failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(2)} MB`;
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
        setQuality(80);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
    };

    const reduction = result?.meta?.reductionPercent ?? null;
    const originalSize = result?.meta?.originalSize ?? null;
    const compressedSize = result?.meta?.outputSize ?? result?.primaryFile?.size ?? null;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Upload */}
                {!file && !result && (
                    <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-gray-900/40 p-4">
                        <Dropzone
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            onFileSelect={handleFileSelect}
                            maxSize={50 * 1024 * 1024}
                        />
                    </div>
                )}

                {/* Controls */}
                {file && !result && (
                    <div className="space-y-4">
                        <FileInfo file={file} />

                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Preview */}
                            {previewUrl && (
                                <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-gray-900/40 p-5">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Original Preview</p>
                                    <div className="flex justify-center items-center bg-gray-50 dark:bg-black/20 rounded-2xl p-3 min-h-48">
                                        <img src={previewUrl} alt="Original" className="max-h-56 max-w-full rounded-xl shadow object-contain" />
                                    </div>
                                    <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">{formatSize(file.size)}</p>
                                </div>
                            )}

                            {/* Quality Controls */}
                            <div className="rounded-3xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-gray-900/40 p-5 space-y-5">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Quick Presets</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {QUALITY_PRESETS.map((preset) => (
                                            <button
                                                key={preset.value}
                                                onClick={() => setQuality(preset.value)}
                                                disabled={isProcessing}
                                                className={`py-2.5 px-3 rounded-2xl border text-left transition-all disabled:opacity-50 ${
                                                    quality === preset.value
                                                        ? 'border-violet-500 bg-violet-500 text-white shadow-md shadow-violet-500/20'
                                                        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-500/40'
                                                }`}
                                            >
                                                <p className="font-bold text-xs">{preset.label}</p>
                                                <p className={`text-[10px] mt-0.5 ${quality === preset.value ? 'text-violet-100' : 'text-gray-400'}`}>{preset.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Custom Quality</p>
                                        <span className="text-sm font-black text-violet-600 dark:text-violet-400">{quality}%</span>
                                    </div>
                                    <input
                                        type="range" min="10" max="100" step="1" value={quality}
                                        onChange={(e) => setQuality(parseInt(e.target.value))}
                                        disabled={isProcessing}
                                        className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-50"
                                        style={{ background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${quality}%, #e5e7eb ${quality}%, #e5e7eb 100%)` }}
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                        <span>Smaller file</span>
                                        <span>Better quality</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress */}
                        {isProcessing && (
                            <div className="rounded-3xl border border-violet-200/80 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/5 p-5">
                                <ProgressBar progress={progress} label="Compressing image…" />
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
                            <Button onClick={handleCompress} disabled={isProcessing} loading={isProcessing} fullWidth
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
                            >
                                Compress Image
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
                                <p className="font-bold text-green-900 dark:text-green-100">Compression Complete!</p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    {formatSize(originalSize)} → {formatSize(compressedSize)}
                                    {reduction !== null && reduction > 0 && ` · saved ${reduction}%`}
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
                                <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">{formatSize(originalSize)}</p>
                            </div>
                            <div className="rounded-3xl border border-violet-200/80 bg-violet-50/30 dark:border-violet-500/20 dark:bg-violet-500/5 p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-2">Compressed</p>
                                <div className="flex justify-center items-center bg-white/60 dark:bg-black/20 rounded-2xl p-3 min-h-40">
                                    {resultPreviewUrl && <img src={resultPreviewUrl} alt="Compressed" className="max-h-48 max-w-full rounded-xl object-contain" />}
                                </div>
                                <p className="mt-2 text-center text-xs text-violet-600 dark:text-violet-400 font-semibold">
                                    {formatSize(compressedSize)}
                                    {reduction !== null && reduction > 0 && ` · −${reduction}%`}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <FileInfo file={file} compressedSize={compressedSize} showComparison={true} />

                        {/* Download */}
                        <Button onClick={handleDownload} fullWidth
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                        >
                            Download Compressed Image
                        </Button>
                        <Button onClick={handleReset} variant="secondary" fullWidth>Compress Another Image</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
