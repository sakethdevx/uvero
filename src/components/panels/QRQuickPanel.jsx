import { useState, useCallback, useRef, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * QRQuickPanel — Tier 1 inline QR generator.
 * Simple: input URL/text → generate → download. No advanced options.
 */
export default function QRQuickPanel({ params, onOpenFull }) {
  const [input, setInput] = useState(params.url || params.text || '');
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const generate = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter a URL or text.');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const dataUrl = await QRCode.toDataURL(input.trim(), {
        width: 512,
        errorCorrectionLevel: 'M',
        color: {
          dark: isDark ? '#e8eaed' : '#1a1a2e',
          light: isDark ? '#111118' : '#ffffff',
        },
        margin: 4,
      });
      setQrDataUrl(dataUrl);
    } catch {
      setError('Failed to generate QR code.');
    } finally {
      setGenerating(false);
    }
  }, [input]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') generate();
  }, [generate]);

  const downloadPNG = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.download = `qr-${Date.now()}.png`;
    a.href = qrDataUrl;
    a.click();
  }, [qrDataUrl]);

  const downloadSVG = useCallback(async () => {
    if (!input.trim()) return;
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const svg = await QRCode.toString(input.trim(), {
        type: 'svg',
        width: 512,
        errorCorrectionLevel: 'M',
        color: {
          dark: isDark ? '#e8eaed' : '#1a1a2e',
          light: isDark ? '#111118' : '#ffffff',
        },
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
  }, [input]);

  const copyImage = useCallback(async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch {
      // Silently fail
    }
  }, [qrDataUrl]);

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setQrDataUrl(null); }}
          onKeyDown={handleKeyDown}
          placeholder="Enter URL or text..."
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all outline-none"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        />
        <button
          onClick={generate}
          disabled={generating || !input.trim()}
          className="btn-accent flex items-center gap-1.5 text-sm shrink-0 disabled:opacity-40"
        >
          {generating ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          Generate
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Preview + download */}
      {qrDataUrl && (
        <div className="animate-panel-in">
          <div className="flex gap-4 items-start">
            {/* QR preview */}
            <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain p-1" />
            </div>

            {/* Actions */}
            <div className="flex-1 flex flex-col gap-2">
              <button onClick={downloadPNG} className="btn-accent text-sm flex items-center justify-center gap-1.5 w-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </button>
              <div className="flex gap-2">
                <button onClick={downloadSVG} className="flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                >
                  SVG
                </button>
                <button onClick={copyImage} className="flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Escape hatch */}
          {onOpenFull && (
            <button
              onClick={onOpenFull}
              className="mt-3 text-xs font-medium hover:underline w-full text-center"
              style={{ color: 'var(--accent)' }}
            >
              Need logos, frames, or WiFi QR? Open advanced generator →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
