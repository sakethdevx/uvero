import { useState, useCallback, useRef, useEffect } from 'react';
import { getSuggestions } from '../../lib/Suggestions';
import { useSession } from '../../lib/SessionContext';
import { buildPayload, generateQR, downloadPNG, downloadSVG, copyQRImage } from '../../services/qr-tools/qr-core';
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
      const dataUrl = await generateQR(payload);
      
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

  const downloadPNGFile = useCallback(() => {
    downloadPNG(qrDataUrl);
  }, [qrDataUrl]);

  const downloadSVGFile = useCallback(async () => {
    const payload = qrType === 'wifi' ? buildPayload('wifi', { ssid: wifiSsid, password: wifiPassword, security: wifiSecurity }) : buildPayload('text', { text: input });
    if (!payload) return;
    try {
      await downloadSVG(payload);
    } catch {
      setError('Failed to generate SVG.');
    }
  }, [input, wifiSsid, wifiPassword, wifiSecurity, qrType]);

  const handleCopyImage = useCallback(async () => {
    const success = await copyQRImage(qrDataUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
    if (suggestion.action === 'downloadSVG') { downloadSVGFile(); return; }
    if (suggestion.intent) { onSuggestionSelect?.(suggestion); }
  }, [handleReset, downloadSVGFile, onSuggestionSelect]);

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
                onDownloadPNG={downloadPNGFile}
                onDownloadSVG={downloadSVGFile}
                onCopyImage={handleCopyImage}
                copied={copied}
            />
        </QRResultCard>
      )}
    </div>
  );
}
