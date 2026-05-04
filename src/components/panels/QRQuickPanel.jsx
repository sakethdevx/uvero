import { useState, useCallback, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { getSuggestions } from '../../lib/Suggestions';
import { useSession } from '../../lib/SessionContext';
import QRResultCard from '../QRResultCard';
import AILoader from '../AILoader';

/**
 * QRQuickPanel — Tier 1 inline QR generator.
 * Now handles text/url and wifi intents appropriately.
 */
export default function QRQuickPanel({ params, onOpenFull, onSuggestionSelect }) {
  const { recordAction } = useSession();
  const qrType = params?.type || 'text';
  
  // Text state
  const [input, setInput] = useState(qrType === 'text' ? (params.url || params.text || '') : '');
  
  // WiFi state
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState('WPA');

  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const generate = useCallback(async () => {
    let payload = '';
    
    if (qrType === 'wifi') {
      if (!wifiSsid.trim()) {
        setError('Please enter a network name (SSID).');
        return;
      }
      payload = `WIFI:T:${wifiSecurity};S:${wifiSsid.trim()};P:${wifiPassword};;`;
    } else {
      if (!input.trim()) {
        setError('Please enter a URL or text.');
        return;
      }
      payload = input.trim();
    }

    setError('');
    setGenerating(true);
    setLoadingStep(0);
    const startTime = Date.now();

    const timer1 = setTimeout(() => setLoadingStep(1), 100);
    const timer2 = setTimeout(() => setLoadingStep(2), 200);

    try {
      const isDark = document.documentElement.classList.contains('dark');
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 512,
        errorCorrectionLevel: 'M',
        color: { dark: isDark ? '#e8eaed' : '#1a1a2e', light: isDark ? '#111118' : '#ffffff' },
        margin: 4,
      });
      
      const elapsed = Date.now() - startTime;
      if (elapsed < 300) {
        await new Promise(r => setTimeout(r, 300 - elapsed));
      }
      
      setQrDataUrl(dataUrl);

      // Record in session
      const shortDesc = qrType === 'wifi' ? `WiFi: ${wifiSsid.trim()}` : payload.slice(0, 30);
      recordAction({
        input: { type: qrType, data: payload, name: shortDesc.slice(0, 40) },
        action: {
          capability: 'qr-generate-quick',
          label: qrType === 'wifi' ? 'Generate WiFi QR' : 'Generate QR Code',
          description: `QR for "${shortDesc}"`,
          icon: qrType === 'wifi' ? '📶' : '🔳',
        },
        result: {
          type: 'qr',
          data: dataUrl,
          meta: { input: payload, summary: `QR for ${shortDesc}` },
        },
      });
    } catch {
      setError('Failed to generate QR code.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setGenerating(false);
    }
  }, [input, wifiSsid, wifiPassword, wifiSecurity, qrType, recordAction]);

  const handleKeyDown = useCallback((e) => { if (e.key === 'Enter') generate(); }, [generate]);

  const downloadPNG = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.download = `qr-${Date.now()}.png`;
    a.href = qrDataUrl;
    a.click();
  }, [qrDataUrl]);

  const downloadSVG = useCallback(async () => {
    const payload = qrType === 'wifi' ? `WIFI:T:${wifiSecurity};S:${wifiSsid.trim()};P:${wifiPassword};;` : input.trim();
    if (!payload) return;
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const svg = await QRCode.toString(payload, {
        type: 'svg', width: 512, errorCorrectionLevel: 'M',
        color: { dark: isDark ? '#e8eaed' : '#1a1a2e', light: isDark ? '#111118' : '#ffffff' },
        margin: 4,
      });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `qr-${Date.now()}.svg`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate SVG.');
    }
  }, [input, wifiSsid, wifiPassword, wifiSecurity, qrType]);

  const copyImage = useCallback(async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silently fail */ }
  }, [qrDataUrl]);

  const handleReset = useCallback(() => {
    setInput('');
    setWifiSsid('');
    setWifiPassword('');
    setQrDataUrl(null);
    setError('');
    inputRef.current?.focus();
  }, []);

  const handleSuggestion = useCallback((suggestion) => {
    if (suggestion.action === 'reset') { handleReset(); return; }
    if (suggestion.action === 'downloadSVG') { downloadSVG(); return; }
    if (suggestion.intent) { onSuggestionSelect?.(suggestion); }
  }, [handleReset, downloadSVG, onSuggestionSelect]);

  const suggestions = getSuggestions('qr-generate-quick');

  return (
    <div className="space-y-4">
      {/* Input */}
      {qrType === 'wifi' ? (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={wifiSsid}
            onChange={(e) => { setWifiSsid(e.target.value); setQrDataUrl(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Network Name (SSID)"
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none"
            style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
          <div className="flex gap-2">
            <input
              type="password"
              value={wifiPassword}
              onChange={(e) => { setWifiPassword(e.target.value); setQrDataUrl(null); }}
              onKeyDown={handleKeyDown}
              placeholder="Password (optional)"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none"
              style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
            <select
              value={wifiSecurity}
              onChange={(e) => { setWifiSecurity(e.target.value); setQrDataUrl(null); }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none"
              style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">None</option>
            </select>
          </div>
          <button
            onClick={generate}
            disabled={generating || !wifiSsid.trim()}
            className="btn-accent w-full flex items-center justify-center gap-1.5 py-2.5 text-sm shrink-0 disabled:opacity-40"
          >
            {generating ? 'Generating...' : 'Generate WiFi QR'}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setQrDataUrl(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Enter URL or text..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none"
            style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
          <button
            onClick={generate}
            disabled={generating || !input.trim()}
            className="btn-accent flex items-center gap-1.5 text-sm shrink-0 disabled:opacity-40"
          >
            {generating ? 'Generating' : 'Generate QR'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg">{error}</p>}

      {/* Loading */}
      {generating && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex justify-center py-4">
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
            footerAction={onOpenFull && (
                <button onClick={onOpenFull} className="text-xs font-medium hover:underline w-full text-center mt-2"
                  style={{ color: 'var(--accent)' }}>
                  Need logos, frames, or advanced options? Open advanced generator →
                </button>
            )}
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
  );
}
