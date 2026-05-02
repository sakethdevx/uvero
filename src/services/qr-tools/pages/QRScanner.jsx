import { useState, useRef, useEffect, useCallback } from 'react';
import useSEO from '../../../hooks/useSEO';
import jsQR from 'jsqr';
import AILoader from '../../../components/AILoader';
import { AIBackLink, AIInlinePanel, AIServiceShell, CompactServiceHeader } from '../../../components/AIServiceLayout';

/**
 * QR Scanner — camera live scan + image upload
 * Uses BarcodeDetector API (Chromium 88+) with jsQR as a universal fallback.
 */
const isBarcodeDetectorSupported = () => typeof BarcodeDetector !== 'undefined';

const HISTORY_KEY = 'qr-scan-history';

function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveHistory(entries) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function getTypeLabel(value) {
    if (/^https?:\/\/wa\.me\//i.test(value)) return '🟢 WhatsApp';
    if (/^https?:\/\//i.test(value)) return '🔗 URL';
    if (/^upi:\/\//i.test(value)) return '💳 UPI Payment';
    if (/^mailto:/i.test(value)) return '📧 Email';
    if (/^tel:/i.test(value)) return '📞 Phone';
    if (/^WIFI:/i.test(value)) return '📶 WiFi';
    return '📝 Text';
}

/**
 * Detects QR code from a canvas element.
 * Tries the native BarcodeDetector API first; falls back to jsQR for full
 * browser compatibility (Safari, Firefox, etc.).
 */
async function detectQRFromCanvas(canvas) {
    if (isBarcodeDetectorSupported()) {
        try {
            const detector = new BarcodeDetector({ formats: ['qr_code'] });
            const codes = await detector.detect(canvas);
            if (codes.length > 0) return codes[0].rawValue;
        } catch { /* fall through to jsQR */ }
    }
    // jsQR fallback — works in all browsers including Safari on iOS
    const ctx = canvas.getContext('2d');
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(data, width, height);
    return code ? code.data : null;
}

function copyToClipboard(text) {
    if (navigator.clipboard) return navigator.clipboard.writeText(text);
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve();
}

function ResultCard({ result, onClear }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await copyToClipboard(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isUrl = /^https?:\/\//i.test(result);
    const isUpi = /^upi:\/\//i.test(result);
    const isEmail = /^mailto:/i.test(result);
    const isPhone = /^tel:/i.test(result);
    const isWhatsApp = /^https?:\/\/wa\.me\//i.test(result);
    const typeLabel = getTypeLabel(result);

    return (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">QR Decoded</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-300">{typeLabel}</span>
                </div>
                <button onClick={onClear} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 break-all font-mono text-sm text-gray-800 dark:text-gray-200 select-all border border-gray-100 dark:border-white/5">
                {result}
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                    {copied ? '✓ Copied!' : 'Copy Text'}
                </button>
                {(isUrl || isWhatsApp) && (
                    <a
                        href={result}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:border-emerald-400 transition-colors"
                    >
                        Open URL →
                    </a>
                )}
                {isEmail && (
                    <a
                        href={result}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:border-emerald-400 transition-colors"
                    >
                        Open Email App
                    </a>
                )}
                {isPhone && (
                    <a
                        href={result}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:border-emerald-400 transition-colors"
                    >
                        Call
                    </a>
                )}
                {isUpi && (
                    <a
                        href={result}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:border-emerald-400 transition-colors"
                    >
                        Open Payment App
                    </a>
                )}
            </div>
        </div>
    );
}

function ScanHistoryPanel({ history, onDelete, onDeleteAll }) {
    const [selected, setSelected] = useState(new Set());

    if (history.length === 0) return null;

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleDeleteSelected = () => {
        onDelete([...selected]);
        setSelected(new Set());
    };

    return (
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Scan History</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{history.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    {selected.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                        >
                            Delete {selected.size} selected
                        </button>
                    )}
                    <button
                        onClick={onDeleteAll}
                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-semibold rounded-lg transition-colors"
                    >
                        Clear all
                    </button>
                </div>
            </div>

            <ul className="divide-y divide-gray-50 dark:divide-white/5">
                {history.map((entry) => (
                    <li
                        key={entry.id}
                        className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${selected.has(entry.id) ? 'bg-sky-50 dark:bg-sky-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'}`}
                    >
                        <input
                            type="checkbox"
                            checked={selected.has(entry.id)}
                            onChange={() => toggleSelect(entry.id)}
                            className="mt-1 rounded border-gray-300 dark:border-gray-600 accent-sky-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs text-gray-400 dark:text-gray-500">{entry.typeLabel}</span>
                                <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(entry.ts).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate font-mono">{entry.value}</p>
                        </div>
                        <button
                            onClick={() => onDelete([entry.id])}
                            className="flex-shrink-0 mt-0.5 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
                            aria-label="Delete entry"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function QRScanner() {
    useSEO({
        title: 'Online QR Code Scanner - Camera & Image Scan',
        description: 'Scan and decode QR codes instantly using your device camera or by uploading an image. Supports URLs, WiFi, UPI, and plain text with scan history.',
        keywords: ['qr scanner', 'scan qr code', 'online qr reader', 'qr code decoder', 'camera qr scan']
    });

    const [mode, setMode] = useState('camera'); // 'camera' | 'upload'
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [cameraError, setCameraError] = useState('');
    const [uploadPreview, setUploadPreview] = useState(null);
    const [uploadScanning, setUploadScanning] = useState(false);
    const [history, setHistory] = useState(() => loadHistory());

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const fileInputRef = useRef(null);

    const addToHistory = useCallback((value) => {
        setHistory((prev) => {
            const id = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const entry = { id, value, typeLabel: getTypeLabel(value), ts: Date.now() };
            const next = [entry, ...prev].slice(0, 50); // keep latest 50
            saveHistory(next);
            return next;
        });
    }, []);

    const deleteEntries = useCallback((ids) => {
        setHistory((prev) => {
            const idSet = new Set(ids);
            const next = prev.filter((e) => !idSet.has(e.id));
            saveHistory(next);
            return next;
        });
    }, []);

    const deleteAll = useCallback(() => {
        saveHistory([]);
        setHistory([]);
    }, []);

    const stopCamera = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setScanning(false);
    }, []);

    useEffect(() => () => stopCamera(), [stopCamera]);

    const startCamera = useCallback(async () => {
        setError('');
        setCameraError('');
        setResult('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setScanning(true);

            const scan = async () => {
                if (!videoRef.current || !canvasRef.current) return;
                const video = videoRef.current;
                if (video.readyState < 2) { rafRef.current = requestAnimationFrame(scan); return; }

                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);

                try {
                    const value = await detectQRFromCanvas(canvas);
                    if (value) {
                        stopCamera();
                        setResult(value);
                        addToHistory(value);
                        return;
                    }
                } catch { /* continue scanning */ }

                rafRef.current = requestAnimationFrame(scan);
            };

            rafRef.current = requestAnimationFrame(scan);
        } catch (err) {
            const msg = err.name === 'NotAllowedError'
                ? 'Camera access denied. Please allow camera permissions and try again.'
                : 'Unable to access camera. Try uploading an image instead.';
            setCameraError(msg);
        }
    }, [stopCamera, addToHistory]);

    const handleUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        setResult('');
        setUploadPreview(URL.createObjectURL(file));
        setUploadScanning(true);

        try {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);

            const value = await detectQRFromCanvas(canvas);
            if (value) {
                setResult(value);
                addToHistory(value);
            } else {
                setError('No QR code found in this image. Make sure the QR code is clearly visible.');
            }
        } catch {
            setError('Failed to scan image. Please try a clearer image.');
        } finally {
            setUploadScanning(false);
        }
    }, [addToHistory]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const dt = new DataTransfer();
            dt.items.add(file);
            handleUpload({ target: { files: dt.files } });
        }
    }, [handleUpload]);

    const clearResult = () => {
        setResult('');
        setUploadPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <AIServiceShell>
            <AIBackLink to="/qr-tools">QR tools</AIBackLink>
            <CompactServiceHeader
                eyebrow="QR Scanner"
                title="Decode a QR code"
                description="Start the camera or drop an image. Results stay inline."
            />
            <AIInlinePanel>

                {/* Mode tabs */}
                <div className="flex gap-2 mb-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-1.5 shadow-sm">
                    {[
                        { id: 'camera', label: 'Camera Scan', icon: '📷' },
                        { id: 'upload', label: 'Upload Image', icon: '🖼️' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { stopCamera(); setMode(tab.id); setError(''); setResult(''); setUploadPreview(null); setCameraError(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === tab.id ? 'bg-sky-500 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Camera mode */}
                {mode === 'camera' && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm space-y-4">
                        {cameraError ? (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-sm border border-amber-200 dark:border-amber-500/30">
                                {cameraError}
                            </div>
                        ) : (
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-900">
                                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Scan overlay */}
                                {scanning && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-56 h-56 relative">
                                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-sky-400 rounded-tl-lg" />
                                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-sky-400 rounded-tr-lg" />
                                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-sky-400 rounded-bl-lg" />
                                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-sky-400 rounded-br-lg" />
                                            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-sky-400 opacity-70 animate-pulse" />
                                        </div>
                                        <p className="absolute bottom-4 text-xs text-white/70">Align QR code in the frame</p>
                                    </div>
                                )}

                                {!scanning && !cameraError && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center text-white/60 p-8">
                                            <svg className="w-16 h-16 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                            </svg>
                                            <p className="text-sm">Camera not started</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!cameraError && (
                            <button
                                onClick={scanning ? stopCamera : startCamera}
                                className={`w-full py-3 font-semibold rounded-xl transition-all ${scanning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}
                            >
                                {scanning ? 'Stop Camera' : 'Start Camera'}
                            </button>
                        )}
                    </div>
                )}

                {/* Upload mode */}
                {mode === 'upload' && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm space-y-4">
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-sky-400 dark:hover:border-sky-500 rounded-xl p-10 text-center cursor-pointer transition-colors"
                        >
                            {uploadPreview ? (
                                <img src={uploadPreview} alt="Uploaded" className="max-h-56 mx-auto rounded-lg object-contain" />
                            ) : (
                                <>
                                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Drop an image here or click to upload</p>
                                    <p className="text-xs text-gray-400">PNG, JPG, WebP supported</p>
                                </>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                        </div>

                {uploadScanning && <AILoader label="Scanning image..." />}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-500/20">
                        {error}
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="mt-4">
                        <ResultCard result={result} onClear={clearResult} />
                    </div>
                )}

                {/* Scan history */}
                <ScanHistoryPanel history={history} onDelete={deleteEntries} onDeleteAll={deleteAll} />
            </AIInlinePanel>
        </AIServiceShell>
    );
}
