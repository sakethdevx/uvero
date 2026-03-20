import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * QR Scanner — camera live scan + image upload
 * Uses BarcodeDetector API (Chromium 88+) with a canvas-based fallback message.
 */
const isBarcodeDetectorSupported = () => typeof BarcodeDetector !== 'undefined';

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
    const isWifi = /^WIFI:/i.test(result);
    const isWhatsApp = /^https?:\/\/wa\.me\//i.test(result);

    const typeLabel = isUrl ? '🔗 URL'
        : isUpi ? '💳 UPI Payment'
        : isEmail ? '📧 Email'
        : isPhone ? '📞 Phone'
        : isWifi ? '📶 WiFi'
        : isWhatsApp ? '🟢 WhatsApp'
        : '📝 Text';

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

export default function QRScanner() {
    const [mode, setMode] = useState('camera'); // 'camera' | 'upload'
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [cameraError, setCameraError] = useState('');
    const [uploadPreview, setUploadPreview] = useState(null);
    const [uploadScanning, setUploadScanning] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const detectorRef = useRef(null);
    const fileInputRef = useRef(null);

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

        if (!isBarcodeDetectorSupported()) {
            setCameraError('Your browser does not support the BarcodeDetector API. Please use Chrome/Edge 88+ or upload an image instead.');
            return;
        }

        try {
            detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
        } catch {
            setCameraError('BarcodeDetector could not be initialised. Try uploading an image.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setScanning(true);

            const scan = async () => {
                if (!videoRef.current || !canvasRef.current || !detectorRef.current) return;
                const video = videoRef.current;
                if (video.readyState < 2) { rafRef.current = requestAnimationFrame(scan); return; }

                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);

                try {
                    const codes = await detectorRef.current.detect(canvas);
                    if (codes.length > 0) {
                        stopCamera();
                        setResult(codes[0].rawValue);
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
    }, [stopCamera]);

    const handleUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        setResult('');
        setUploadPreview(URL.createObjectURL(file));
        setUploadScanning(true);

        if (!isBarcodeDetectorSupported()) {
            setUploadScanning(false);
            setError('Your browser does not support QR scanning. Please use Chrome/Edge 88+.');
            return;
        }

        try {
            const detector = new BarcodeDetector({ formats: ['qr_code'] });
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);

            const codes = await detector.detect(canvas);
            if (codes.length > 0) {
                setResult(codes[0].rawValue);
            } else {
                setError('No QR code found in this image. Make sure the QR code is clearly visible.');
            }
        } catch {
            setError('Failed to scan image. Please try a clearer image.');
        } finally {
            setUploadScanning(false);
        }
    }, []);

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">QR Scanner</h1>
                    <p className="text-gray-500 dark:text-gray-400">Scan with your camera or upload an image to decode a QR code.</p>
                </div>

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

                        {!isBarcodeDetectorSupported() && !cameraError && (
                            <p className="text-xs text-center text-gray-400">Camera scanning requires Chrome or Edge 88+. Firefox users can use the Upload tab.</p>
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

                        {uploadScanning && (
                            <div className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Scanning image…
                            </div>
                        )}
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

                {/* Browser support note */}
                {!isBarcodeDetectorSupported() && (
                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-sm border border-amber-200 dark:border-amber-500/30">
                        <strong>Browser note:</strong> QR scanning requires Chrome or Edge 88+. The BarcodeDetector API is not available in your current browser. Please switch to Chrome or Edge for the best experience.
                    </div>
                )}
            </div>
        </div>
    );
}
