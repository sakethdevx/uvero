import { useState, useCallback, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { getSuggestions } from '../../lib/Suggestions';
import { useSession } from '../../lib/SessionContext';
import QRResultCard from '../QRResultCard';
import AILoader from '../AILoader';

/**
 * QRQuickPanel — Tier 1 inline QR generator.
 * Now with: session memory, result suggestions, session recording, and unified UI.
 */
export default function QRQuickPanel({ params, onOpenFull, onSuggestionSelect }) {
  const { recordAction } = useSession();
  const [input, setInput] = useState(params.url || params.text || '');
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const generate = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter a URL or text.');
      return;
    }
    setError('');
    setGenerating(true);
    setLoadingStep(0);
    const startTime = Date.now();

    const timer1 = setTimeout(() => setLoadingStep(1), 100);
    const timer2 = setTimeout(() => setLoadingStep(2), 200);

    try {
      const isDark = document.documentElement.classList.contains('dark');
      const dataUrl = await QRCode.toDataURL(input.trim(), {
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
      recordAction({
        input: { type: 'text', data: input.trim(), name: input.trim().slice(0, 40) },
        action: {
          capability: 'qr-generate-quick',
          label: 'Generate QR Code',
          description: `QR for "${input.trim().slice(0, 30)}"`,
          icon: '🔳',
        },
        result: {
          type: 'qr',
          data: dataUrl,
          meta: { input: input.trim(), summary: `QR for ${input.trim().slice(0, 30)}` },
        },
      });
    } catch {
      setError('Failed to generate QR code.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setGenerating(false);
    }
  }, [input, recordAction]);

  const handleKeyDown = useCallback((e) => { if (e.key === 'Enter') generate(); }, [generate]);

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
  }, [input]);

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
                  Need logos, frames, or WiFi QR? Open advanced generator →
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
