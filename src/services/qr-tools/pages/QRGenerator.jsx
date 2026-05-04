import { useState, useRef, useCallback } from 'react';
import useSEO from '../../../hooks/useSEO';
import { AIBackLink, AIInlinePanel, AIServiceShell, CompactServiceHeader } from '../../../components/AIServiceLayout';
import QRResultCard from '../../../components/QRResultCard';
import AILoader from '../../../components/AILoader';
import { 
    INPUT_TYPES, 
    FRAME_TYPES, 
    FRAME_TEXT_DEFAULTS, 
    TEMPLATES, 
    buildPayload, 
    generateQR, 
    downloadPNG as downloadPNGHelper, 
    downloadSVG as downloadSVGHelper, 
    copyQRImage,
    applyFrame
} from '../qr-core';



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
    useSEO({
        title: 'Advanced QR Code Generator - Custom Designs & Logos',
        description: 'Create beautiful, custom QR codes for URLs, WiFi, UPI, and more. Add your own logo, choose from professional templates, and customize frames and colors.',
        keywords: ['qr code generator', 'custom qr code', 'qr with logo', 'free qr maker', 'upi qr generator', 'wifi qr code']
    });

    const [type, setType] = useState('url');
    const [fields, setFields] = useState({ url: '' });
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [size, setSize] = useState(512);
    const [errLevel, setErrLevel] = useState('M');
    const [logoFile, setLogoFile] = useState(null);
    const [logoDataUrl, setLogoDataUrl] = useState(null);
    const [frame, setFrame] = useState('none');
    const [customFrameText, setCustomFrameText] = useState('');
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const logoInputRef = useRef(null);

    const applyTemplate = useCallback((tpl) => {
        setFgColor(tpl.fgColor);
        setBgColor(tpl.bgColor);
        setErrLevel(tpl.errLevel);
        setFrame(tpl.frame);
        setCustomFrameText('');
        setQrDataUrl(null);
    }, []);

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
        setLoadingStep(0);
        const startTime = Date.now();
        const timer1 = setTimeout(() => setLoadingStep(1), 100);
        const timer2 = setTimeout(() => setLoadingStep(2), 200);

        try {
            const base = await generateQR(payload, {
                width: size,
                errorCorrectionLevel: errLevel,
                darkColor: fgColor,
                lightColor: bgColor,
                margin: 4,
            });

            let dataUrl = base;
            if (logoDataUrl) {
                const canvas = document.createElement('canvas');
                canvas.width = opts.width;
                canvas.height = opts.width;
                const ctx = canvas.getContext('2d');

                const qrImg = new Image();
                await new Promise((res, rej) => { qrImg.onload = res; qrImg.onerror = rej; qrImg.src = base; });
                ctx.drawImage(qrImg, 0, 0, size, size);

                const logoImg = new Image();
                await new Promise((res, rej) => { logoImg.onload = res; logoImg.onerror = rej; logoImg.src = logoDataUrl; });
                const logoSize = Math.round(size * 0.22);
                const logoX = Math.round((size - logoSize) / 2);
                const logoY = Math.round((size - logoSize) / 2);

                // white background badge for logo
                ctx.fillStyle = '#ffffff';
                const pad = 6;
                ctx.beginPath();
                ctx.roundRect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2, 8);
                ctx.fill();
                ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

                dataUrl = canvas.toDataURL('image/png');
            }

            // Apply decorative frame
            if (frame !== 'none') {
                dataUrl = await applyFrame(dataUrl, size, frame, customFrameText, fgColor, bgColor);
            }

            const elapsed = Date.now() - startTime;
            if (elapsed < 300) {
                await new Promise(r => setTimeout(r, 300 - elapsed));
            }
            setQrDataUrl(dataUrl);
        } catch (err) {
            setError('Failed to generate QR code. Please check your input.');
            console.error(err);
        } finally {
            clearTimeout(timer1);
            clearTimeout(timer2);
            setGenerating(false);
        }
    }, [type, fields, size, errLevel, fgColor, bgColor, logoDataUrl, frame, customFrameText]);

    const downloadPNG = () => {
        downloadPNGHelper(qrDataUrl, `qr-${type}-${Date.now()}.png`);
    };

    const downloadSVG = async () => {
        const payload = buildPayload(type, fields);
        if (!payload.trim()) return;
        try {
            await downloadSVGHelper(payload, {
                width: size,
                errorCorrectionLevel: errLevel,
                darkColor: fgColor,
                lightColor: bgColor,
            }, `qr-${type}-${Date.now()}.svg`);
        } catch {
            setError('Failed to generate SVG.');
        }
    };

    const copyImage = async () => {
        const success = await copyQRImage(qrDataUrl);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSuggestion = (s) => {
        if (s.action === 'reset') {
            setQrDataUrl(null);
            setFields({});
        } else if (s.action === 'share') {
            if (navigator.share) {
                navigator.share({ title: 'QR Code', url: qrDataUrl }).catch(() => {});
            }
        }
    };

    const suggestions = [
        { label: 'Generate another', action: 'reset', icon: '🔄' },
        ...(navigator.share ? [{ label: 'Share QR', action: 'share', icon: '📤' }] : [])
    ];

    return (
        <AIServiceShell>
            <AIBackLink to="/qr-tools">QR tools</AIBackLink>
            <CompactServiceHeader
                eyebrow="QR Generator"
                title="Create a QR code"
                description="Choose content, tune scan reliability, then export PNG or SVG."
            />
            <AIInlinePanel>
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Config */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm space-y-6">
                        {/* Templates */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Templates</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {TEMPLATES.map((tpl) => (
                                    <button
                                        key={tpl.id}
                                        onClick={() => applyTemplate(tpl)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-violet-400 dark:hover:border-violet-600 bg-gray-50 dark:bg-gray-800 text-left transition-all group"
                                        title="Click to apply this style"
                                    >
                                        <span
                                            className="w-4 h-4 rounded-sm flex-shrink-0 border border-gray-200 dark:border-gray-600"
                                            style={{ background: tpl.fgColor }}
                                        />
                                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight truncate group-hover:text-violet-700 dark:group-hover:text-violet-300">{tpl.label}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Templates apply colors, error correction, and frame style. Your content is unchanged.</p>
                        </div>

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

                            {/* Frame */}
                                <Field label="Frame Style">
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                        {FRAME_TYPES.map((f) => (
                                            <button
                                                key={f.value}
                                                onClick={() => { setFrame(f.value); setQrDataUrl(null); }}
                                                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-center transition-all ${frame === f.value ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-100 dark:border-gray-800 hover:border-violet-300'}`}
                                            >
                                                <span className="text-base leading-none">{f.icon}</span>
                                                <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">{f.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {frame === 'custom' && (
                                        <input
                                            className={inputCls + ' mt-2'}
                                            placeholder="Enter your custom frame text…"
                                            value={customFrameText}
                                            onChange={(e) => setCustomFrameText(e.target.value)}
                                        />
                                    )}
                                    {frame !== 'none' && frame !== 'border' && frame !== 'rounded' && frame !== 'custom' && (
                                        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                                            Frame label: <strong>{FRAME_TEXT_DEFAULTS[frame]}</strong>
                                        </p>
                                    )}
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
                            className="w-full py-3.5 bg-violet-600 text-white font-bold rounded-xl shadow-sm hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {generating ? 'Generating...' : 'Generate QR Code'}
                        </button>
                    </div>

                    {/* Loader */}
                    {generating && (
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex justify-center py-6">
                            <AILoader mode="steps" steps={['Encoding', 'Generating', 'Finalizing']} currentStep={loadingStep} />
                        </div>
                    )}

                    {/* Result */}
                    {!generating && qrDataUrl && (
                        <QRResultCard
                            title="✓ QR generated"
                            trustBadge="🔒 Generated locally"
                            suggestions={suggestions}
                            onSuggestionSelect={handleSuggestion}
                        >
                            <QRResultCard.Generated
                                dataUrl={qrDataUrl}
                                onDownloadPNG={downloadPNG}
                                onDownloadSVG={downloadSVG}
                                onCopyImage={copyImage}
                                copied={copied}
                            />
                        </QRResultCard>
                    )}
                </div>
            </AIInlinePanel>
        </AIServiceShell>
    );
}
