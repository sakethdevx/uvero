import { useState, useCallback } from 'react';
import useSEO from '../../../hooks/useSEO';
import AILoader from '../../../components/AILoader';
import { AIBackLink, AIInlinePanel, AIServiceShell, CompactServiceHeader } from '../../../components/AIServiceLayout';

/**
 * QR Validator
 * Uploads a QR image and runs heuristic checks:
 * - Contrast ratio analysis
 * - Quiet zone detection
 * - Size recommendation
 * - Logo obstruction warning (central area darkness)
 * - Basic scan attempt via BarcodeDetector
 */

const MIN_RECOMMENDED_PX = 200; // minimum recommended px for a reliable QR

function luminance(r, g, b) {
    // Relative luminance per WCAG 2.x
    const s = [r, g, b].map((v) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}

function contrastRatio(lum1, lum2) {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}

async function analyzeQR(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;

    // ── helpers ──
    const px = (x, y) => {
        const i = (y * width + x) * 4;
        return { r: data[i], g: data[i + 1], b: data[i + 2] };
    };

    // Sample corner pixels (quiet zone candidates: outermost 5% border)
    const borderW = Math.max(1, Math.round(width * 0.05));
    const borderH = Math.max(1, Math.round(height * 0.05));

    let borderSum = 0, borderCount = 0;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < borderH; y++) { const p = px(x, y); borderSum += luminance(p.r, p.g, p.b); borderCount++; }
        for (let y = height - borderH; y < height; y++) { const p = px(x, y); borderSum += luminance(p.r, p.g, p.b); borderCount++; }
    }
    for (let y = borderH; y < height - borderH; y++) {
        for (let x = 0; x < borderW; x++) { const p = px(x, y); borderSum += luminance(p.r, p.g, p.b); borderCount++; }
        for (let x = width - borderW; x < width; x++) { const p = px(x, y); borderSum += luminance(p.r, p.g, p.b); borderCount++; }
    }
    const avgBorderLum = borderCount > 0 ? borderSum / borderCount : 1;

    // Sample inner area (inner 60%)
    const innerX0 = Math.round(width * 0.20);
    const innerX1 = Math.round(width * 0.80);
    const innerY0 = Math.round(height * 0.20);
    const innerY1 = Math.round(height * 0.80);
    let darkCount = 0, lightCount = 0;
    const step = Math.max(1, Math.round(width / 60));
    for (let x = innerX0; x < innerX1; x += step) {
        for (let y = innerY0; y < innerY1; y += step) {
            const p = px(x, y);
            if (luminance(p.r, p.g, p.b) < 0.35) darkCount++;
            else lightCount++;
        }
    }
    const totalInner = darkCount + lightCount || 1;
    const avgInnerLum = darkCount / totalInner > 0.5 ? 0.05 : 0.8; // rough estimate

    const ratio = contrastRatio(avgBorderLum, avgInnerLum);

    // Centre 22% area — detect logo obstruction heuristic
    const cx0 = Math.round(width * 0.39), cx1 = Math.round(width * 0.61);
    const cy0 = Math.round(height * 0.39), cy1 = Math.round(height * 0.61);
    let centerDark = 0, centerTotal = 0;
    for (let x = cx0; x < cx1; x += step) {
        for (let y = cy0; y < cy1; y += step) {
            const p = px(x, y);
            if (luminance(p.r, p.g, p.b) < 0.6) centerDark++;
            centerTotal++;
        }
    }
    const centerDarkRatio = centerDark / (centerTotal || 1);

    // Quiet zone (border brightness)
    const quietZoneOk = avgBorderLum > 0.7;

    // Try scanning via BarcodeDetector
    let scannable = null;
    if (typeof BarcodeDetector !== 'undefined') {
        try {
            const detector = new BarcodeDetector({ formats: ['qr_code'] });
            const codes = await detector.detect(canvas);
            scannable = codes.length > 0 ? codes[0].rawValue : false;
        } catch {
            scannable = null;
        }
    }

    URL.revokeObjectURL(url);

    return {
        width,
        height,
        contrastRatio: ratio,
        quietZoneOk,
        avgBorderLum,
        centerDarkRatio,
        scannable,
        hasLogo: centerDarkRatio > 0.55 && centerDarkRatio < 0.92,
    };
}

function ScoreRing({ score }) {
    const color = score >= 80 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444';
    const label = score >= 80 ? 'Good' : score >= 55 ? 'Fair' : 'Poor';
    const r = 36;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                    cx="48" cy="48" r={r} fill="none"
                    stroke={color} strokeWidth="10"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
                <text x="48" y="48" textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="bold" fill={color}>{score}</text>
            </svg>
            <span className="text-sm font-semibold" style={{ color }}>{label}</span>
        </div>
    );
}

function Check({ status, label, detail }) {
    const icons = { pass: '✅', warn: '⚠️', fail: '❌', info: 'ℹ️' };
    const colors = { pass: 'text-emerald-700 dark:text-emerald-400', warn: 'text-amber-700 dark:text-amber-400', fail: 'text-red-700 dark:text-red-400', info: 'text-blue-600 dark:text-blue-400' };
    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${status === 'pass' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20' : status === 'warn' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-500/20' : status === 'fail' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-500/20' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-500/20'}`}>
            <span className="text-lg flex-shrink-0">{icons[status]}</span>
            <div>
                <p className={`text-sm font-semibold ${colors[status]}`}>{label}</p>
                {detail && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{detail}</p>}
            </div>
        </div>
    );
}

export default function QRValidator() {
    useSEO({
        title: 'QR Code Validator - Quality & Print Safety Check',
        description: 'Verify your QR code for scan reliability, contrast, and print safety. Upload any QR image to get a quality score and optimization recommendations.',
        keywords: ['qr validator', 'qr code checker', 'qr quality check', 'qr print safety', 'verify qr code']
    });

    const [analyzing, setAnalyzing] = useState(false);
    const [preview, setPreview] = useState(null);
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');

    const handleFile = useCallback(async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setError('Please upload a valid image file.');
            return;
        }
        setError('');
        setReport(null);
        setPreview(URL.createObjectURL(file));
        setAnalyzing(true);
        try {
            const r = await analyzeQR(file);
            setReport(r);
        } catch {
            setError('Failed to analyze image. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    }, []);

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    // Compute checks and score from report
    let checks = [];
    let score = 0;
    if (report) {
        const { width, height, contrastRatio: cr, quietZoneOk, centerDarkRatio, scannable, hasLogo } = report;
        const minDim = Math.min(width, height);

        // 1. Scannability (40 pts)
        if (scannable !== null) {
            if (scannable) {
                checks.push({ status: 'pass', label: 'QR code is scannable', detail: `Decoded: "${String(scannable).slice(0, 80)}${scannable.length > 80 ? '…' : ''}"` });
                score += 40;
            } else {
                checks.push({ status: 'fail', label: 'QR code could not be decoded', detail: 'The QR may be too damaged, too small, or have poor contrast.' });
            }
        } else {
            checks.push({ status: 'info', label: 'Scan test skipped', detail: 'BarcodeDetector API not available in this browser (Chrome/Edge 88+ required).' });
            score += 20; // partial credit
        }

        // 2. Contrast (25 pts)
        if (cr >= 4.5) {
            checks.push({ status: 'pass', label: `Contrast ratio: ${cr.toFixed(1)} — Excellent`, detail: 'WCAG AA passes at 4.5:1. Your QR has great contrast.' });
            score += 25;
        } else if (cr >= 3) {
            checks.push({ status: 'warn', label: `Contrast ratio: ${cr.toFixed(1)} — Fair`, detail: 'Minimum recommended is 4.5:1. Low contrast may cause scan failures in poor light.' });
            score += 12;
        } else {
            checks.push({ status: 'fail', label: `Contrast ratio: ${cr.toFixed(1)} — Poor`, detail: 'Very low contrast. Increase the difference between QR module color and background.' });
        }

        // 3. Quiet zone (15 pts)
        if (quietZoneOk) {
            checks.push({ status: 'pass', label: 'Quiet zone present', detail: 'The border around the QR appears sufficiently light.' });
            score += 15;
        } else {
            checks.push({ status: 'fail', label: 'Quiet zone may be missing', detail: 'QR codes need a white border (quiet zone) of at least 4 modules for reliable scanning.' });
        }

        // 4. Size (10 pts)
        if (minDim >= MIN_RECOMMENDED_PX) {
            checks.push({ status: 'pass', label: `Image size: ${width}×${height}px — OK`, detail: 'Large enough for reliable digital use. For print, ensure at least 2×2 cm at 300 DPI.' });
            score += 10;
        } else {
            checks.push({ status: 'warn', label: `Image size: ${width}×${height}px — Small`, detail: `Minimum recommended: ${MIN_RECOMMENDED_PX}px on the shortest side. Scale up before printing.` });
            score += 5;
        }

        // 5. Logo (10 pts)
        if (hasLogo) {
            if (centerDarkRatio < 0.78) {
                checks.push({ status: 'warn', label: 'Logo detected in centre', detail: 'A logo is present. Make sure error correction is set to HIGH (30%) to compensate for data loss.' });
                score += 5;
            } else {
                checks.push({ status: 'fail', label: 'Logo may be too large', detail: 'The central logo area appears to cover more than ~22% of the QR. This risks scan failure.' });
            }
        } else {
            checks.push({ status: 'pass', label: 'No oversized logo obstruction detected', detail: 'The QR centre area looks clear.' });
            score += 10;
        }

        score = Math.min(100, Math.max(0, score));
    }

    return (
            <AIServiceShell>
                <AIBackLink to="/qr-tools">QR tools</AIBackLink>
                <CompactServiceHeader
                    eyebrow="QR Validator"
                    title="Check scan quality"
                    description="Drop a QR image and get contrast, quiet-zone, logo, and size feedback."
                />
                <AIInlinePanel>

                {/* Upload */}
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm"
                >
                    <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 rounded-xl p-8 text-center transition-colors">
                            {preview ? (
                                <img src={preview} alt="QR to validate" className="max-h-48 mx-auto rounded-lg object-contain mb-3" />
                            ) : (
                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                            )}
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {preview ? 'Click to change image' : 'Drop a QR code image or click to upload'}
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG, WebP supported</p>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
                    </label>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-500/20">
                        {error}
                    </div>
                )}

                {analyzing && <AILoader label="Analyzing QR code..." />}

                {report && !analyzing && (
                    <div className="mt-6 space-y-4">
                        {/* Score */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm flex items-center gap-6">
                            <ScoreRing score={score} />
                            <div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">Scan Quality Score</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    {score >= 80
                                        ? 'Your QR code looks great and should scan reliably in most conditions.'
                                        : score >= 55
                                        ? 'Your QR code is usable but has some issues worth fixing before printing.'
                                        : 'Your QR code has serious issues. Fix the warnings before use.'}
                                </p>
                            </div>
                        </div>

                        {/* Checks */}
                        <div className="space-y-2">
                            {checks.map((c, i) => (
                                <Check key={i} status={c.status} label={c.label} detail={c.detail} />
                            ))}
                        </div>

                        {/* Recommendations */}
                        <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl p-4 text-sm text-violet-700 dark:text-violet-300 space-y-1.5">
                            <p className="font-semibold">📋 General QR Recommendations</p>
                            <p>• Minimum print size: <strong>2 × 2 cm</strong> at 300 DPI</p>
                            <p>• Maintain a quiet zone of <strong>at least 4 modules</strong> around all edges</p>
                            <p>• Use <strong>High (H) error correction</strong> when embedding a logo</p>
                            <p>• Logo should cover no more than <strong>22%</strong> of the QR area</p>
                            <p>• Black on white provides the best contrast for scanners</p>
                        </div>
                    </div>
                )}
                </AIInlinePanel>
            </AIServiceShell>
    );
}
