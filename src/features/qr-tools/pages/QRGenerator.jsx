import { useState, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

/* ── helpers ── */
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function buildPayload(type, fields) {
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

const INPUT_TYPES = [
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

function FieldGroup({ label, children }) {
    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
            {children}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            {children}
        </div>
    );
}

const inputCls =
    'w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';

function PayloadFields({ type, fields, onChange }) {
    const set = (k, v) => onChange({ ...fields, [k]: v });

    const inp = (k, placeholder, type_ = 'text') => (
        <input className={inputCls} value={fields[k] || ''} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} type={type_} />
    );
    const txt = (k, placeholder, rows = 3) => (
        <textarea className={inputCls} value={fields[k] || ''} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} rows={rows} />
    );

    switch (type) {
        case 'url':
            return <Field label="Website URL">{inp('url', 'https://example.com', 'url')}</Field>;
        case 'text':
            return <Field label="Plain Text">{txt('text', 'Enter your text here…', 4)}</Field>;
        case 'email':
            return (
                <FieldGroup label="Email">
                    <Field label="To">{inp('email', 'contact@example.com', 'email')}</Field>
                    <Field label="Subject (optional)">{inp('subject', 'Hello!')}</Field>
                    <Field label="Body (optional)">{txt('body', 'Your message…', 2)}</Field>
                </FieldGroup>
            );
        case 'phone':
            return <Field label="Phone Number">{inp('phone', '+91 98765 43210', 'tel')}</Field>;
        case 'sms':
            return (
                <FieldGroup label="SMS">
                    <Field label="Phone Number">{inp('phone', '+91 98765 43210', 'tel')}</Field>
                    <Field label="Message (optional)">{txt('message', 'Your message…', 2)}</Field>
                </FieldGroup>
            );
        case 'wifi':
            return (
                <FieldGroup label="WiFi">
                    <Field label="Network Name (SSID)">{inp('ssid', 'MyHomeNetwork')}</Field>
                    <Field label="Password">{inp('password', 'secretpassword')}</Field>
                    <Field label="Security">
                        <select className={inputCls} value={fields.security || 'WPA'} onChange={(e) => set('security', e.target.value)}>
                            <option value="WPA">WPA / WPA2</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">Open (no password)</option>
                        </select>
                    </Field>
                </FieldGroup>
            );
        case 'whatsapp':
            return (
                <FieldGroup label="WhatsApp">
                    <Field label="Phone Number (with country code)">{inp('phone', '+91 98765 43210', 'tel')}</Field>
                    <Field label="Pre-filled Message (optional)">{txt('message', 'Hi there! 👋', 2)}</Field>
                </FieldGroup>
            );
        case 'upi':
            return (
                <FieldGroup label="UPI Payment">
                    <Field label="UPI ID (VPA)">{inp('vpa', 'merchant@upi')}</Field>
                    <Field label="Payee Name">{inp('name', 'Business Name')}</Field>
                    <Field label="Amount (optional)">{inp('amount', '0.00', 'number')}</Field>
                    <Field label="Payment Note (optional)">{inp('note', 'Order #1234')}</Field>
                </FieldGroup>
            );
        case 'vcard':
            return (
                <FieldGroup label="Contact (vCard)">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="First Name">{inp('firstName', 'Jane')}</Field>
                        <Field label="Last Name">{inp('lastName', 'Doe')}</Field>
                    </div>
                    <Field label="Organisation (optional)">{inp('org', 'Acme Corp')}</Field>
                    <Field label="Phone">{inp('phone', '+91 98765 43210', 'tel')}</Field>
                    <Field label="Email">{inp('email', 'jane@example.com', 'email')}</Field>
                    <Field label="Website (optional)">{inp('url', 'https://example.com', 'url')}</Field>
                    <Field label="Address (optional)">{inp('address', '123 Main St, City')}</Field>
                </FieldGroup>
            );
        case 'maps':
            return <Field label="Location (address or coordinates)">{inp('location', 'Times Square, New York')}</Field>;
        case 'social':
            return (
                <FieldGroup label="Social Profile">
                    <Field label="Platform">
                        <select className={inputCls} value={fields.platform || 'instagram'} onChange={(e) => set('platform', e.target.value)}>
                            <option value="instagram">Instagram</option>
                            <option value="twitter">X (Twitter)</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="youtube">YouTube</option>
                            <option value="github">GitHub</option>
                        </select>
                    </Field>
                    <Field label="Username / Handle">{inp('username', 'yourusername')}</Field>
                </FieldGroup>
            );
        default:
            return null;
    }
}

export default function QRGenerator() {
    const [type, setType] = useState('url');
    const [fields, setFields] = useState({ url: '' });
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [size, setSize] = useState(512);
    const [errLevel, setErrLevel] = useState('M');
    const [logoFile, setLogoFile] = useState(null);
    const [logoDataUrl, setLogoDataUrl] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const logoInputRef = useRef(null);

    const handleTypeChange = useCallback((t) => {
        setType(t);
        setFields({});
        setQrDataUrl(null);
        setError('');
    }, []);

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setLogoDataUrl(ev.target.result);
        reader.readAsDataURL(file);
        setLogoFile(file);
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoDataUrl(null);
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const generate = useCallback(async () => {
        const payload = buildPayload(type, fields);
        if (!payload.trim()) {
            setError('Please fill in the required fields.');
            return;
        }
        setError('');
        setGenerating(true);
        try {
            const opts = {
                width: clamp(size, 128, 2048),
                errorCorrectionLevel: errLevel,
                color: { dark: fgColor, light: bgColor },
                margin: 4,
            };
            const base = await QRCode.toDataURL(payload, opts);

            if (logoDataUrl) {
                const canvas = document.createElement('canvas');
                canvas.width = opts.width;
                canvas.height = opts.width;
                const ctx = canvas.getContext('2d');

                const qrImg = new Image();
                await new Promise((res, rej) => { qrImg.onload = res; qrImg.onerror = rej; qrImg.src = base; });
                ctx.drawImage(qrImg, 0, 0, opts.width, opts.width);

                const logoImg = new Image();
                await new Promise((res, rej) => { logoImg.onload = res; logoImg.onerror = rej; logoImg.src = logoDataUrl; });
                const logoSize = Math.round(opts.width * 0.22);
                const logoX = Math.round((opts.width - logoSize) / 2);
                const logoY = Math.round((opts.width - logoSize) / 2);

                // white background badge for logo
                ctx.fillStyle = '#ffffff';
                const pad = 6;
                ctx.beginPath();
                ctx.roundRect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2, 8);
                ctx.fill();
                ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

                setQrDataUrl(canvas.toDataURL('image/png'));
            } else {
                setQrDataUrl(base);
            }
        } catch (err) {
            setError('Failed to generate QR code. Please check your input.');
            console.error(err);
        } finally {
            setGenerating(false);
        }
    }, [type, fields, size, errLevel, fgColor, bgColor, logoDataUrl]);

    const downloadPNG = () => {
        if (!qrDataUrl) return;
        const a = document.createElement('a');
        a.download = `qr-${type}-${Date.now()}.png`;
        a.href = qrDataUrl;
        a.click();
    };

    const downloadSVG = async () => {
        const payload = buildPayload(type, fields);
        if (!payload.trim()) return;
        try {
            const svg = await QRCode.toString(payload, {
                type: 'svg',
                width: size,
                errorCorrectionLevel: errLevel,
                color: { dark: fgColor, light: bgColor },
                margin: 4,
            });
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = `qr-${type}-${Date.now()}.svg`;
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setError('Failed to generate SVG.');
        }
    };

    const copyImage = async () => {
        if (!qrDataUrl) return;
        try {
            const res = await fetch(qrDataUrl);
            const blob = await res.blob();
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        } catch {
            // fallback: nothing to do silently
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">QR Code Generator</h1>
                    <p className="text-gray-500 dark:text-gray-400">Create QR codes for URLs, WiFi, UPI, vCard, WhatsApp, and more — no login required.</p>
                </div>

                <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
                    {/* Left: config */}
                    <div className="space-y-6">
                        {/* Type selector */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">QR Code Type</p>
                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                                {INPUT_TYPES.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => handleTypeChange(t.value)}
                                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${type === t.value ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700'}`}
                                    >
                                        <span className="text-xl">{t.icon}</span>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Payload fields */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                            <PayloadFields type={type} fields={fields} onChange={setFields} />
                        </div>

                        {/* Design options */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm space-y-5">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Design Options</p>

                            {/* Colors */}
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="QR Color">
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{fgColor}</span>
                                    </div>
                                </Field>
                                <Field label="Background Color">
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{bgColor}</span>
                                    </div>
                                </Field>
                            </div>

                            {/* Size */}
                            <Field label={`Output Size: ${size}px`}>
                                <input
                                    type="range" min="128" max="2048" step="64" value={size}
                                    onChange={(e) => setSize(Number(e.target.value))}
                                    className="w-full accent-violet-500"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                                    <span>128px</span><span>2048px</span>
                                </div>
                            </Field>

                            {/* Error correction */}
                            <Field label="Error Correction">
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { v: 'L', label: 'Low', desc: '7%' },
                                        { v: 'M', label: 'Medium', desc: '15%' },
                                        { v: 'Q', label: 'Quartile', desc: '25%' },
                                        { v: 'H', label: 'High', desc: '30%' },
                                    ].map((ec) => (
                                        <button
                                            key={ec.v}
                                            onClick={() => setErrLevel(ec.v)}
                                            className={`p-2 rounded-lg border-2 text-center transition-all ${errLevel === ec.v ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-100 dark:border-gray-800'}`}
                                        >
                                            <div className="text-sm font-bold text-gray-800 dark:text-white">{ec.label}</div>
                                            <div className="text-xs text-gray-400">{ec.desc}</div>
                                        </button>
                                    ))}
                                </div>
                                {errLevel === 'H' && <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">High correction recommended when adding a logo.</p>}
                            </Field>

                            {/* Logo upload */}
                            <Field label="Logo (optional)">
                                <div className="flex items-center gap-3">
                                    {logoDataUrl ? (
                                        <>
                                            <img src={logoDataUrl} alt="logo" className="w-12 h-12 rounded-lg object-contain border border-gray-200 dark:border-gray-700" />
                                            <button onClick={removeLogo} className="text-sm text-red-500 hover:text-red-600">Remove</button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => logoInputRef.current?.click()}
                                            className="px-4 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-violet-400 transition-colors text-gray-600 dark:text-gray-400"
                                        >
                                            + Upload Logo
                                        </button>
                                    )}
                                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                    {logoFile && !logoDataUrl && <span className="text-xs text-gray-400">Loading…</span>}
                                </div>
                                {logoDataUrl && errLevel !== 'H' && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                                        ⚠ Set error correction to <strong>High</strong> when using a logo.
                                    </p>
                                )}
                            </Field>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-500/20">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={generate}
                            disabled={generating}
                            className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {generating ? 'Generating…' : 'Generate QR Code'}
                        </button>
                    </div>

                    {/* Right: preview */}
                    <div className="lg:sticky lg:top-24 space-y-4">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Preview</p>
                            <div className="flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 aspect-square">
                                {qrDataUrl ? (
                                    <img src={qrDataUrl} alt="Generated QR Code" className="w-full h-full object-contain p-2 rounded-xl" />
                                ) : (
                                    <div className="text-center text-gray-400 dark:text-gray-600 p-8">
                                        <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                                        </svg>
                                        <p className="text-sm">Fill in the fields and click<br />Generate QR Code</p>
                                    </div>
                                )}
                            </div>

                            {qrDataUrl && (
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={downloadPNG}
                                        className="flex items-center justify-center gap-1.5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        PNG
                                    </button>
                                    <button
                                        onClick={downloadSVG}
                                        className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:border-violet-400 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        SVG
                                    </button>
                                    <button
                                        onClick={copyImage}
                                        className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-xl hover:border-violet-400 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        Copy Image
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tips */}
                        <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl p-4 text-sm text-violet-700 dark:text-violet-300 space-y-1.5">
                            <p className="font-semibold">💡 Tips for best results</p>
                            <p>• Use <strong>High</strong> error correction when adding a logo.</p>
                            <p>• Keep good contrast between QR and background.</p>
                            <p>• Maintain a quiet zone (white border) around the QR.</p>
                            <p>• Minimum print size: <strong>2 × 2 cm</strong> for reliable scanning.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
