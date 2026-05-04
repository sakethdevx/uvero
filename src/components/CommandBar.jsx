import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveIntent, PLACEHOLDER_INTENTS, getAllCapabilities } from '../lib/IntentEngine';
import { useInteraction } from '../lib/InteractionContext';

const allCapabilities = getAllCapabilities();

// Example prompts shown in the "Try:" row when the bar is focused and empty
const QUICK_EXAMPLES = [
  'Convert a PDF to images',
  'Generate a QR code for WiFi',
  'kg to lbs',
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
  const { setInteractionState } = useInteraction();

  useEffect(() => {
    if (!isFocused && !query.trim()) {
      setInteractionState('idle');
      return;
    }
    if (isFocused && !query.trim()) {
      setInteractionState('focused');
      return;
    }
    setInteractionState(result ? 'result' : 'processing');
  }, [query, result, isFocused, setInteractionState]);

  // Cycle placeholders with a smooth fade
  useEffect(() => {
    if (isFocused || query) {
      setPlaceholderVisible(true);
      return;
    }
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
  }, [isFocused, query]);

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
        
        // Try to find a matching capability to get the correct tier
        const matchedCap = allCapabilities.find(c => 
          (c.navigateTo && s.path === c.navigateTo) || 
          (c.id === s.id)
        );

        // Category-based fallback for tiering
        let tier = matchedCap ? matchedCap.tier : 3;
        if (!matchedCap) {
          const toolCategories = ['Converters', 'Utilities', 'QR Tools'];
          if (toolCategories.includes(s.category)) {
            tier = 2;
          }
        }

        // If it's a suggestion matching a Tier 1 capability, 
        // "downgrade" it to a Tool (Tier 2) so it navigates instead of opening panel
        let handler = matchedCap ? matchedCap.handler : null;
        if (tier === 1) {
          tier = 2;
          handler = null;
        }

        const params = matchedCap?.extractParams ? matchedCap.extractParams(query) : {};
        const description = (matchedCap && typeof matchedCap.description === 'function') 
          ? matchedCap.description(params) 
          : (s.description || (matchedCap?.description && typeof matchedCap.description === 'string' ? matchedCap.description : ''));

        items.push({
          type: 'suggestion',
          id: s.id,
          icon: s.icon,
          title: s.title,
          description,
          path: s.path,
          tier,
          handler,
          capability: matchedCap ? matchedCap : null,
          params,
        });
      });
    }

    return items.slice(0, 6);
  }, [result, query]);

  const selectItem = useCallback((item) => {
    if (!item) return;

    if ((item.tier === 1 || item.tier === 2) && item.handler) {
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
      let path = item.navigateTo || item.path;
      
      // Append params as query string if present
      if (item.params && Object.keys(item.params).length > 0) {
        const urlParams = new URLSearchParams();
        Object.entries(item.params).forEach(([key, val]) => {
          if (val) urlParams.append(key, val);
        });
        const qs = urlParams.toString();
        if (qs) {
          path += (path.includes('?') ? '&' : '?') + qs;
        }
      }

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
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in" 
          onClick={onClose}
        />

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
            isFocused || query ? 'command-bar-active glass-glow' : ''} ${
              query ? 'command-bar-processing is-typing' : ''
            }`}
        >
          {/* Search icon / AI indicator */}
          <div className="shrink-0">
            {query ? (
              <div className="command-orb w-5 h-5 rounded-full"
                style={{
                  animationDuration: '1.5s',
                }}
              />
            ) : (
              <svg className="w-5 h-5 intelligence-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L13.8 9.6L20.4 11.4L13.8 13.2L12 19.8L10.2 13.2L3.6 11.4L10.2 9.6L12 3Z" stroke="url(#intel-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.4 6.6L18.6 9L21 10.2L18.6 11.4L17.4 13.8L16.2 11.4L13.8 10.2L16.2 9L17.4 6.6Z" stroke="url(#intel-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="intel-grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
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
            className="command-input flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-gray-400 dark:placeholder:text-[#a27798] sm:text-base caret-yellow-400"
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.tier === 1 && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20">
                        Quick
                      </span>
                    )}
                    {item.tier === 2 && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20">
                        Tool
                      </span>
                    )}
                    {item.isBestMatch && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-subtle)' }}
                      >
                        Best match
                      </span>
                    )}
                  </div>
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
