import { useState, useCallback, useRef, useEffect } from 'react';
import SuggestionChips from '../SuggestionChips';
import { getSuggestions } from '../../lib/Suggestions';
import { useSession } from '../../lib/SessionContext';

const API_BASE = import.meta.env.VITE_CLIPBOARD_API || '';

/**
 * ClipboardQuickPanel — Tier 1 inline clipboard share.
 * Now with: session memory, result suggestions, session recording.
 */
export default function ClipboardQuickPanel({ params, onDismiss, onSuggestionSelect }) {
  const { recordAction } = useSession();
  const [mode, setMode] = useState('share');
  const [text, setText] = useState('');
  const [code, setCode] = useState('');
  const [retrievedText, setRetrievedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, [mode]);

  const handleShare = useCallback(async () => {
    if (!text.trim()) { setError('Please enter some text.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/clipboard/quick-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (!res.ok) throw new Error('Failed to share');
      const data = await res.json();
      const shareCode = data.code || data.id || '????';
      setCode(shareCode);

      // Record in session
      recordAction({
        input: { type: 'text', data: text.trim(), name: text.trim().slice(0, 40) },
        action: {
          capability: 'clipboard-share',
          label: 'Quick Share',
          description: `Shared → code ${shareCode}`,
          icon: '📋',
        },
        result: {
          type: 'code',
          data: shareCode,
          meta: { summary: `Shared text (code: ${shareCode})` },
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to share. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [text, recordAction]);

  const handleRetrieve = useCallback(async () => {
    if (!code.trim() || code.length < 4) { setError('Please enter a valid 4-digit code.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/clipboard/quick-share/${code.trim()}`);
      if (!res.ok) throw new Error('Code not found or expired.');
      const data = await res.json();
      setRetrievedText(data.content || '');

      recordAction({
        input: { type: 'text', data: code.trim(), name: `Code: ${code.trim()}` },
        action: {
          capability: 'clipboard-share',
          label: 'Retrieve Clipboard',
          description: `Retrieved code ${code.trim()}`,
          icon: '📋',
        },
        result: {
          type: 'text',
          data: data.content || '',
          meta: { summary: `Retrieved ${(data.content || '').length} chars` },
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to retrieve.');
    } finally {
      setLoading(false);
    }
  }, [code, recordAction]);

  const copyCode = useCallback(async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [code]);

  const copyRetrieved = useCallback(async () => {
    try { await navigator.clipboard.writeText(retrievedText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [retrievedText]);

  const handleReset = useCallback(() => {
    setCode(''); setText(''); setRetrievedText(''); setError('');
  }, []);

  const handleSuggestion = useCallback((suggestion) => {
    if (suggestion.action === 'reset') { handleReset(); return; }
    if (suggestion.intent) { onSuggestionSelect?.(suggestion); }
  }, [handleReset, onSuggestionSelect]);

  const suggestions = getSuggestions('clipboard-share');

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
        <button
          onClick={() => { setMode('share'); setError(''); setRetrievedText(''); }}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${mode === 'share' ? 'text-white shadow-sm' : ''}`}
          style={mode === 'share' ? { background: 'var(--accent)' } : { color: 'var(--text-secondary)' }}
        >Share Text</button>
        <button
          onClick={() => { setMode('retrieve'); setError(''); setCode(''); }}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${mode === 'retrieve' ? 'text-white shadow-sm' : ''}`}
          style={mode === 'retrieve' ? { background: 'var(--accent)' } : { color: 'var(--text-secondary)' }}
        >Retrieve</button>
      </div>

      {mode === 'share' ? (
        code ? (
          <div className="animate-panel-in text-center space-y-3">
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Share this code:</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black tracking-[0.3em] text-gray-900 dark:text-white">{code}</span>
              <button onClick={copyCode} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                {copied ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                )}
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Expires in 24 hours</p>
            <SuggestionChips suggestions={suggestions} onSelect={handleSuggestion} />
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text, code, or snippet here..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all"
              style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />
            {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg">{error}</p>}
            <button onClick={handleShare} disabled={loading || !text.trim()}
              className="btn-accent w-full flex items-center justify-center gap-2 text-sm disabled:opacity-40">
              {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
              )}
              Share
            </button>
          </div>
        )
      ) : (
        retrievedText ? (
          <div className="animate-panel-in space-y-3">
            <div className="p-4 rounded-xl text-sm" style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs">{retrievedText}</pre>
            </div>
            <div className="flex gap-2">
              <button onClick={copyRetrieved} className="btn-accent flex-1 text-sm">{copied ? '✓ Copied' : 'Copy Text'}</button>
              <button onClick={handleReset}
                className="px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>Retrieve Another</button>
            </div>
            <SuggestionChips suggestions={suggestions} onSelect={handleSuggestion} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && handleRetrieve()}
                placeholder="Enter code..." maxLength={6}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono text-center tracking-[0.3em] outline-none"
                style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              />
              <button onClick={handleRetrieve} disabled={loading || code.length < 4}
                className="btn-accent text-sm shrink-0 disabled:opacity-40">
                {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'Get'}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg">{error}</p>}
          </div>
        )
      )}
    </div>
  );
}
