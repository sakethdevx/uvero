import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveIntent, PLACEHOLDER_INTENTS } from '../lib/IntentEngine';

// Example prompts shown in the "Try:" row when the bar is focused and empty
const QUICK_EXAMPLES = [
  'Convert a PDF to images',
  'Generate a QR code for WiFi',
  'Compress this image',
];

/**
 * CommandBar — The central UI element of Uvero.
 * Two modes:
 *   - embed: Always visible on homepage (large, prominent)
 *   - modal: Full-screen overlay via ⌘K or bottom nav
 *
 * @param {string}   mode           - 'embed' | 'modal'
 * @param {boolean}  isOpen         - For modal mode only
 * @param {function} onClose        - For modal mode only
 * @param {function} onIntentResolved - Callback when a Tier 1/2 intent is resolved (opens ActionPanel)
 */
export default function CommandBar({ mode = 'embed', isOpen = true, onClose, onIntentResolved, externalQuery, onExternalQueryConsumed }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  // Cycle placeholders with a smooth fade
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex(i => (i + 1) % PLACEHOLDER_INTENTS.length);
        // Fade in
        setPlaceholderVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (mode === 'modal' && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [mode, isOpen]);

  // Handle external query injection (from OnboardingHint chips)
  useEffect(() => {
    if (externalQuery) {
      handleQueryChange(externalQuery);
      inputRef.current?.focus();
      onExternalQueryConsumed?.();
    }
  // handleQueryChange is stable (useCallback) — safe to include
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQuery]);

  // ⌘K global listener (for embed mode only — modal handles its own)
  useEffect(() => {
    if (mode !== 'embed') return;
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mode]);

  // Debounced intent resolution
  const handleQueryChange = useCallback((value) => {
    setQuery(value);
    setSelectedIndex(0);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        const res = resolveIntent(value);
        setResult(res);
      } else {
        setResult(null);
      }
    }, 150);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    const items = allSuggestions;
    if (!items.length) {
      if (e.key === 'Escape') {
        if (mode === 'modal') onClose?.();
        else inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + items.length) % items.length);
        break;
      case 'Enter':
        e.preventDefault();
        selectItem(items[selectedIndex]);
        break;
      case 'Escape':
        if (mode === 'modal') onClose?.();
        else { setQuery(''); setResult(null); inputRef.current?.blur(); }
        break;
    }
  }, [result, selectedIndex, mode, onClose]);

  // Build suggestion list
  const allSuggestions = useMemo(() => {
    if (!result) return [];
    const items = [];

    // Best match (the resolved capability)
    if (result.capability && result.confidence >= 0.5) {
      items.push({
        type: 'capability',
        id: result.capability.id,
        icon: result.capability.icon,
        title: result.label,
        description: result.description,
        tier: result.tier,
        handler: result.handler,
        navigateTo: result.navigateTo,
        capability: result.capability,
        params: result.params,
        isBestMatch: true,
      });
    }

    // Other suggestions
    if (result.suggestions) {
      result.suggestions.forEach(s => {
        if (items.some(i => i.id === s.id)) return;
        items.push({
          type: 'suggestion',
          id: s.id,
          icon: s.icon,
          title: s.title,
          description: s.description,
          path: s.path,
          tier: 3,
        });
      });
    }

    return items.slice(0, 6);
  }, [result]);

  const selectItem = useCallback((item) => {
    if (!item) return;

    if (item.type === 'capability' && (item.tier === 1 || item.tier === 2) && item.handler) {
      // Inline execution — open ActionPanel
      onIntentResolved?.({
        capability: item.capability,
        params: item.params,
        label: item.title,
        description: item.description,
        tier: item.tier,
        handler: item.handler,
        navigateTo: item.navigateTo,
      });
      setQuery('');
      setResult(null);
      if (mode === 'modal') onClose?.();
    } else {
      // Navigate to page
      const path = item.navigateTo || item.path;
      if (path) {
        navigate(path);
        setQuery('');
        setResult(null);
        if (mode === 'modal') onClose?.();
      }
    }
  }, [navigate, onIntentResolved, onClose, mode]);

  // ── Render ──
  const isEmbed = mode === 'embed';

  // Modal wrapper
  if (mode === 'modal') {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in" />

        {/* Content */}
        <div className="relative w-full max-w-xl animate-scale-in">
          {renderBar()}
          {renderDropdown()}
        </div>
      </div>
    );
  }

  // Embed
  return (
    <div className="command-shell w-full max-w-xl mx-auto">
      {renderBar()}
      {renderDropdown()}
    </div>
  );

  function renderBar() {
    return (
      <>
        <div
          className={`command-bar relative flex items-center gap-3.5 transition-all duration-[350ms] ease-apple glass-panel px-5 py-4 sm:px-6 sm:py-[1.05rem] ${
            isFocused || query ? 'command-bar-active glass-glow' : ''}`}
        >
          {/* Search icon / AI indicator */}
          <div className="shrink-0">
            {query ? (
              <div className="command-orb w-5 h-5 rounded-full animate-orb-breathe"
                style={{
                  background: 'radial-gradient(circle, var(--accent), rgba(99,102,241,0.3))',
                  animationDuration: '1.5s',
                }}
              />
            ) : (
              <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={PLACEHOLDER_INTENTS[placeholderIndex]}
            className="command-input flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors sm:text-base"
            style={{
              color: 'var(--text-primary)',
              '--placeholder-opacity': placeholderVisible ? 1 : 0,
            }}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Keyboard shortcut hint */}
          {isEmbed && !query && !isFocused && (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              ⌘K
            </kbd>
          )}

          {/* Clear button */}
          {query && (
            <button
              onClick={() => { setQuery(''); setResult(null); inputRef.current?.focus(); }}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-white/[0.07] active:scale-95 transition-all duration-200"
              aria-label="Clear command"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ── "Try:" focused row — shown when focused and empty (embed only) ── */}
        {isEmbed && isFocused && !query && (
          <div className="flex items-center gap-1.5 pt-2 flex-wrap animate-state-in">
            <span className="text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'var(--text-secondary)' }}>
              Try:
            </span>
            {QUICK_EXAMPLES.map((ex) => (
              <button
                key={ex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleQueryChange(ex);
                  inputRef.current?.focus();
                }}
                className="micro-chip inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 hover:-translate-y-px"
                style={{
                  color: 'var(--text-secondary)',
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderDropdown() {
    if (!allSuggestions.length || !isFocused) return null;

    return (
      <div className="mt-2 glass-panel overflow-hidden animate-panel-in">
        <div className="py-1">
          {allSuggestions.map((item, i) => (
            <button
              key={item.id}
              onClick={() => selectItem(item)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 ${
                i === selectedIndex
                  ? 'bg-gray-100/80 dark:bg-white/[0.06]'
                  : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {item.title}
                  </p>
                  {item.isBestMatch && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                    >
                      Best match
                    </span>
                  )}
                  {item.tier === 1 && !item.isBestMatch && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      Quick
                    </span>
                  )}
                </div>
                <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {item.description}
                </p>
              </div>
              <svg className="w-3.5 h-3.5 shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  }
}
