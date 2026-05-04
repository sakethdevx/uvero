import { useState, useCallback, useRef, useEffect } from 'react';
import { getSuggestions } from '../../lib/Suggestions';
import { useSession } from '../../lib/SessionContext';
import { buildPayload, generateQR, downloadPNG, downloadSVG, copyQRImage, detectQRFromCanvas } from '../../services/qr-tools/qr-core';
import QRResultCard from '../QRResultCard';
import AILoader from '../AILoader';

/**
 * QRQuickPanel — Tier 1 inline QR generator & scanner.
 * Now handles text/url, wifi, and scanner intents appropriately.
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

  // Generator result
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  
  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { text, type }
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { 
    if (qrType !== 'scanner') inputRef.current?.focus(); 
  }, [qrType]);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setScanning(true);
    setLoadingStep(0);

    const timer1 = setTimeout(() => setLoadingStep(1), 100);
    const timer2 = setTimeout(() => setLoadingStep(2), 200);

    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const decoded = await detectQRFromCanvas(canvas);
      if (decoded) {
        setScanResult({
          text: decoded,
          type: decoded.startsWith('http') ? 'url' : decoded.startsWith('WIFI:') ? 'wifi' : 'text'
        });
        
        recordAction({
          input: { type: 'file', name: file.name },
          action: {
            capability: 'qr-scan-quick',
            label: 'Quick Scan',
            description: `Decoded ${file.name}`,
            icon: '🔍',
          },
          result: {
            type: 'text',
            data: decoded,
            meta: { filename: file.name },
          },
        });
      } else {
        setError('No QR code detected in this image.');
      }
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to process image.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
    setScanResult(null);
    setError('');
    inputRef.current?.focus();
  }, []);

  const handleSuggestion = useCallback((suggestion) => {
    if (suggestion.action === 'reset') { handleReset(); return; }
    if (suggestion.action === 'downloadSVG') { downloadSVGFile(); return; }
    if (suggestion.intent) { onSuggestionSelect?.(suggestion); }
  }, [handleReset, downloadSVGFile, onSuggestionSelect]);

  const suggestions = getSuggestions(qrType === 'scanner' ? 'qr-scan' : 'qr-generate-quick');

  return (
    <div className="space-y-4">
      {/* ── Generator Modes ── */}
      {qrType === 'wifi' && !qrDataUrl && (
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
      )}

      {qrType === 'text' && !qrDataUrl && (
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

      {/* ── Scanner Mode ── */}
      {qrType === 'scanner' && !scanResult && (
        <div className="space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl py-10 flex flex-col items-center justify-center cursor-pointer hover:border-violet-400 dark:hover:border-violet-500/50 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Upload image to scan</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG or WebP supported</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>
          
          <button
            onClick={onOpenFull}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Use Live Camera Scanner
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg">{error}</p>}

      {/* Loading */}
      {(generating || scanning) && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex justify-center py-4">
            <AILoader mode="steps" steps={scanning ? ['Uploading', 'Decoding', 'Finalizing'] : ['Encoding', 'Generating', 'Finalizing']} currentStep={loadingStep} />
        </div>
      )}

      {/* Generator Result */}
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

      {/* Scanner Result */}
      {!scanning && scanResult && (
        <QRResultCard
          title="✓ QR decoded"
          trustBadge="🔍 Decoded locally"
          suggestions={[{ label: 'Scan another', action: 'reset', icon: '🔄' }]}
          onSuggestionSelect={handleSuggestion}
        >
          <QRResultCard.Decoded
            text={scanResult.text}
            type={scanResult.type}
            onCopy={() => {
              navigator.clipboard.writeText(scanResult.text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            copied={copied}
          />
        </QRResultCard>
      )}
    </div>
  );
}
