/**
 * qr-core.js — Single source of truth for all QR generation logic.
 *
 * Every QR-related component (QRQuickPanel, QRGenerator, BulkQRGenerator)
 * imports from here. No QR generation logic should be duplicated elsewhere.
 */

import QRCode from 'qrcode';
import jsQR from 'jsqr';

/* ═══════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════ */

/** Check if native BarcodeDetector API is available (Chrome/Edge) */
export const isBarcodeDetectorSupported = () => typeof window !== 'undefined' && typeof window.BarcodeDetector !== 'undefined';

/** All supported QR content types */
export const INPUT_TYPES = [
    { value: 'url',       label: 'URL',       icon: '🔗' },
    { value: 'text',      label: 'Text',      icon: '📝' },
    { value: 'email',     label: 'Email',     icon: '📧' },
    { value: 'phone',     label: 'Phone',     icon: '📞' },
    { value: 'sms',       label: 'SMS',       icon: '💬' },
    { value: 'wifi',      label: 'WiFi',      icon: '📶' },
    { value: 'whatsapp',  label: 'WhatsApp',  icon: '🟢' },
    { value: 'upi',       label: 'UPI Pay',   icon: '💳' },
    { value: 'vcard',     label: 'vCard',     icon: '👤' },
    { value: 'maps',      label: 'Maps',      icon: '📍' },
    { value: 'social',    label: 'Social',    icon: '🌐' },
];

/** Decorative frame styles */
export const FRAME_TYPES = [
    { value: 'none',          label: 'None',           icon: '✕' },
    { value: 'border',        label: 'Border',         icon: '▢' },
    { value: 'rounded',       label: 'Rounded',        icon: '⬜' },
    { value: 'scan_me',       label: 'Scan Me',        icon: '📲' },
    { value: 'visit_website', label: 'Visit Website',  icon: '🔗' },
    { value: 'follow_us',     label: 'Follow Us',      icon: '❤' },
    { value: 'pay_here',      label: 'Pay Here',       icon: '💳' },
    { value: 'wifi_connect',  label: 'Connect WiFi',   icon: '📶' },
    { value: 'custom',        label: 'Custom Text',    icon: '✏' },
];

/** Default text for preset frame types */
export const FRAME_TEXT_DEFAULTS = {
    scan_me: 'SCAN ME',
    visit_website: 'VISIT WEBSITE',
    follow_us: 'FOLLOW US',
    pay_here: 'PAY HERE',
    wifi_connect: 'CONNECT TO WiFi',
};

/** Pre-built design templates */
export const TEMPLATES = [
    { id: 'restaurant', label: '🍽️ Restaurant Menu',  fgColor: '#166534', bgColor: '#f0fdf4', errLevel: 'H', frame: 'scan_me' },
    { id: 'payment',    label: '💳 UPI Payment',       fgColor: '#1d4ed8', bgColor: '#eff6ff', errLevel: 'M', frame: 'pay_here' },
    { id: 'wifi',       label: '📶 WiFi Sharing',      fgColor: '#0369a1', bgColor: '#f0f9ff', errLevel: 'M', frame: 'wifi_connect' },
    { id: 'event',      label: '📅 Event Check-in',    fgColor: '#6d28d9', bgColor: '#f5f3ff', errLevel: 'H', frame: 'scan_me' },
    { id: 'social',     label: '📸 Social Profile',    fgColor: '#9d174d', bgColor: '#fdf2f8', errLevel: 'H', frame: 'follow_us' },
    { id: 'product',    label: '🛍️ Product Page',      fgColor: '#b45309', bgColor: '#fffbeb', errLevel: 'M', frame: 'visit_website' },
    { id: 'business',   label: '👤 Business Card',     fgColor: '#111827', bgColor: '#ffffff', errLevel: 'H', frame: 'none' },
    { id: 'minimal',    label: '⬛ Classic Black',      fgColor: '#000000', bgColor: '#ffffff', errLevel: 'M', frame: 'none' },
];

/* ═══════════════════════════════════════════════════════
   Payload Builder
   ═══════════════════════════════════════════════════════ */

/**
 * Build the raw string payload that gets encoded into a QR code.
 * @param {'url'|'text'|'email'|'phone'|'sms'|'wifi'|'whatsapp'|'upi'|'vcard'|'maps'|'social'} type
 * @param {object} fields — type-specific field values
 * @returns {string} the payload string
 */
export function buildPayload(type, fields) {
    switch (type) {
        case 'url':
            return fields.url || '';
        case 'text':
            return fields.text || '';
        case 'email': {
            const { email, subject, body } = fields;
            const params = [];
            if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
            if (body) params.push(`body=${encodeURIComponent(body)}`);
            return `mailto:${email || ''}${params.length ? '?' + params.join('&') : ''}`;
        }
        case 'phone':
            return `tel:${fields.phone || ''}`;
        case 'sms':
            return `sms:${fields.phone || ''}${fields.message ? `?body=${encodeURIComponent(fields.message)}` : ''}`;
        case 'wifi':
            return `WIFI:T:${fields.security || 'WPA'};S:${fields.ssid || ''};P:${fields.password || ''};;`;
        case 'whatsapp':
            return `https://wa.me/${(fields.phone || '').replace(/\D/g, '')}${fields.message ? `?text=${encodeURIComponent(fields.message)}` : ''}`;
        case 'upi':
            return `upi://pay?pa=${encodeURIComponent(fields.vpa || '')}&pn=${encodeURIComponent(fields.name || '')}${fields.amount ? `&am=${fields.amount}` : ''}&cu=INR${fields.note ? `&tn=${encodeURIComponent(fields.note)}` : ''}`;
        case 'vcard':
            return [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `FN:${[fields.firstName, fields.lastName].filter(Boolean).join(' ')}`,
                fields.org ? `ORG:${fields.org}` : '',
                fields.phone ? `TEL:${fields.phone}` : '',
                fields.email ? `EMAIL:${fields.email}` : '',
                fields.url ? `URL:${fields.url}` : '',
                fields.address ? `ADR:;;${fields.address};;;` : '',
                'END:VCARD',
            ].filter(Boolean).join('\n');
        case 'maps':
            return `https://maps.google.com/?q=${encodeURIComponent(fields.location || '')}`;
        case 'social': {
            const base = { instagram: 'https://instagram.com/', twitter: 'https://x.com/', linkedin: 'https://linkedin.com/in/', youtube: 'https://youtube.com/@', github: 'https://github.com/' };
            return `${base[fields.platform] || ''}${fields.username || ''}`;
        }
        default:
            return '';
    }
}

/* ═══════════════════════════════════════════════════════
   QR Generation
   ═══════════════════════════════════════════════════════ */

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** Default QR options */
const DEFAULT_OPTIONS = {
    width: 512,
    errorCorrectionLevel: 'M',
    margin: 4,
};

/**
 * Generate a QR code as a PNG data URL.
 * @param {string} payload — the content to encode
 * @param {object} [options] — override defaults
 * @param {number} [options.width=512]
 * @param {string} [options.errorCorrectionLevel='M']
 * @param {string} [options.darkColor] — QR module color
 * @param {string} [options.lightColor] — background color
 * @param {number} [options.margin=4]
 * @returns {Promise<string>} PNG data URL
 */
export async function generateQR(payload, options = {}) {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const opts = {
        width: clamp(options.width || DEFAULT_OPTIONS.width, 128, 2048),
        errorCorrectionLevel: options.errorCorrectionLevel || DEFAULT_OPTIONS.errorCorrectionLevel,
        color: {
            dark: options.darkColor || (isDark ? '#e8eaed' : '#1a1a2e'),
            light: options.lightColor || (isDark ? '#111118' : '#ffffff'),
        },
        margin: options.margin ?? DEFAULT_OPTIONS.margin,
    };
    return QRCode.toDataURL(payload, opts);
}

/**
 * Generate a QR code as an SVG string.
 * @param {string} payload
 * @param {object} [options] — same shape as generateQR options
 * @returns {Promise<string>} SVG markup
 */
export async function generateQRSvg(payload, options = {}) {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    return QRCode.toString(payload, {
        type: 'svg',
        width: clamp(options.width || DEFAULT_OPTIONS.width, 128, 2048),
        errorCorrectionLevel: options.errorCorrectionLevel || DEFAULT_OPTIONS.errorCorrectionLevel,
        color: {
            dark: options.darkColor || (isDark ? '#e8eaed' : '#1a1a2e'),
            light: options.lightColor || (isDark ? '#111118' : '#ffffff'),
        },
        margin: options.margin ?? DEFAULT_OPTIONS.margin,
    });
}

/* ═══════════════════════════════════════════════════════
   Download & Copy Helpers
   ═══════════════════════════════════════════════════════ */

/**
 * Trigger a PNG download from a data URL.
 * @param {string} dataUrl
 * @param {string} [filename]
 */
export function downloadPNG(dataUrl, filename) {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.download = filename || `qr-${Date.now()}.png`;
    a.href = dataUrl;
    a.click();
}

/**
 * Generate and download an SVG file.
 * @param {string} payload — the QR content
 * @param {object} [options] — same as generateQR options
 * @param {string} [filename]
 * @returns {Promise<void>}
 */
export async function downloadSVG(payload, options = {}, filename) {
    const svg = await generateQRSvg(payload, options);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = filename || `qr-${Date.now()}.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Copy a QR code image to the clipboard.
 * @param {string} dataUrl
 * @returns {Promise<boolean>} true if successful
 */
export async function copyQRImage(dataUrl) {
    if (!dataUrl) return false;
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        return true;
    } catch {
        return false;
    }
}

/* ═══════════════════════════════════════════════════════
   Frame Compositing
   ═══════════════════════════════════════════════════════ */

/**
 * Apply a decorative frame around a QR code image.
 * @param {string} sourceDataUrl — the base QR code PNG data URL
 * @param {number} qrWidth — pixel width of the QR code
 * @param {string} frame — frame type from FRAME_TYPES
 * @param {string} customText — custom text for 'custom' frame type
 * @param {string} fgColor — foreground color
 * @param {string} bgColor — background color
 * @returns {Promise<string>} framed PNG data URL
 */
export async function applyFrame(sourceDataUrl, qrWidth, frame, customText, fgColor, bgColor) {
    if (frame === 'none') return sourceDataUrl;

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            const bw = 16; // border width
            if (frame === 'border' || frame === 'rounded') {
                canvas.width = qrWidth + bw * 2;
                canvas.height = qrWidth + bw * 2;
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = fgColor;
                ctx.lineWidth = bw;
                if (frame === 'rounded') {
                    ctx.beginPath();
                    ctx.roundRect(bw / 2, bw / 2, canvas.width - bw, canvas.height - bw, 24);
                    ctx.stroke();
                } else {
                    ctx.strokeRect(bw / 2, bw / 2, canvas.width - bw, canvas.height - bw);
                }
                ctx.drawImage(img, bw, bw, qrWidth, qrWidth);
            } else {
                // Text band frames
                const padX = Math.round(qrWidth * 0.04);
                const bandH = Math.round(qrWidth * 0.16);
                const padTop = Math.round(qrWidth * 0.04);
                const padBottom = Math.round(qrWidth * 0.02);
                canvas.width = qrWidth + padX * 2;
                canvas.height = qrWidth + padTop + bandH + padBottom;

                // White/light background
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // QR image with top/side padding
                ctx.drawImage(img, padX, padTop, qrWidth, qrWidth);

                // Colored band
                ctx.fillStyle = fgColor;
                ctx.fillRect(0, padTop + qrWidth, canvas.width, bandH + padBottom);

                // Label text centered in band (with ellipsis if too wide)
                const label = customText.trim() || FRAME_TEXT_DEFAULTS[frame] || 'SCAN ME';
                const fontSize = Math.max(12, Math.round(bandH * 0.48));
                const maxTextWidth = canvas.width - padX * 2;
                ctx.fillStyle = bgColor;
                ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const cy = padTop + qrWidth + (bandH + padBottom) / 2;
                // Truncate with ellipsis if text overflows
                let displayLabel = label;
                if (ctx.measureText(displayLabel).width > maxTextWidth) {
                    while (displayLabel.length > 1 && ctx.measureText(displayLabel + '…').width > maxTextWidth) {
                        displayLabel = displayLabel.slice(0, -1);
                    }
                    displayLabel += '…';
                }
                ctx.fillText(displayLabel, canvas.width / 2, cy);
            }
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = sourceDataUrl;
    });
}

/* ═══════════════════════════════════════════════════════
   QR Detection (Scanning)
   ═══════════════════════════════════════════════════════ */

/**
 * Detects QR code from a canvas element.
 * Tries the native BarcodeDetector API first; falls back to jsQR for full
 * browser compatibility (Safari, Firefox, etc.).
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<string|null>} decoded string or null
 */
export async function detectQRFromCanvas(canvas) {
    if (isBarcodeDetectorSupported()) {
        try {
            // eslint-disable-next-line no-undef
            const detector = new BarcodeDetector({ formats: ['qr_code'] });
            const codes = await detector.detect(canvas);
            if (codes.length > 0) return codes[0].rawValue;
        } catch { /* fall through to jsQR */ }
    }

    // jsQR fallback — works in all browsers including Safari on iOS
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(data, width, height);
    return code ? code.data : null;
}
