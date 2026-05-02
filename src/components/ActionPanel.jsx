import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import AILoader from './AILoader';
import { resolveIntent } from '../lib/IntentEngine';

// Lazy-load sub-panels
const FileConvertPanel = lazy(() => import('./panels/FileConvertPanel'));
const QRQuickPanel = lazy(() => import('./panels/QRQuickPanel'));
const ClipboardQuickPanel = lazy(() => import('./panels/ClipboardQuickPanel'));

const PANEL_MAP = {
  FileConvertPanel,
  QRQuickPanel,
  ClipboardQuickPanel,
};

/**
 * ActionPanel — Inline execution container with continuity loop.
 * 
 * The key upgrade: when a panel emits a suggestion, ActionPanel resolves it
 * and either re-renders a new panel or navigates — creating the
 * Command → Execute → Result → Suggest → Continue loop.
 */
export default function ActionPanel({ intent, onDismiss, onIntentChange }) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentIntent, setCurrentIntent] = useState(intent);
  const navigate = useNavigate();

  useEffect(() => {
    if (intent) {
      setCurrentIntent(intent);
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [intent]);

  // Animate updates when intent changes within the panel (suggestion flow)
  useEffect(() => {
    if (currentIntent && currentIntent !== intent) {
      setIsVisible(false);
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [currentIntent]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 250);
  }, [onDismiss]);

  const handleOpenFull = useCallback(() => {
    if (currentIntent?.navigateTo) {
      navigate(currentIntent.navigateTo);
      handleDismiss();
    }
  }, [currentIntent, navigate, handleDismiss]);

  /**
   * Suggestion handler — the core of the continuity loop.
   * When a panel suggestion is clicked, resolve it as a new intent
   * and either swap the panel content or navigate.
   */
  const handleSuggestionSelect = useCallback((suggestion) => {
    if (suggestion.action === 'reset') return; // Panels handle this internally
    
    if (suggestion.intent) {
      const result = resolveIntent(suggestion.intent);

      if (result.capability && result.handler && result.tier <= 2) {
        // Swap to new inline panel
        const newIntent = {
          capability: result.capability,
          params: result.params || {},
          label: result.label,
          description: result.description,
          tier: result.tier,
          handler: result.handler,
          navigateTo: result.navigateTo,
        };
        setCurrentIntent(newIntent);
        onIntentChange?.(newIntent);
      } else if (result.navigateTo) {
        navigate(result.navigateTo);
        handleDismiss();
      }
    }
  }, [navigate, handleDismiss, onIntentChange]);

  if (!currentIntent) return null;

  const PanelComponent = currentIntent.handler ? PANEL_MAP[currentIntent.handler] : null;
  const isTier3 = currentIntent.tier === 3;

  // Tier 3: navigate immediately
  if (isTier3 && currentIntent.navigateTo) {
    navigate(currentIntent.navigateTo);
    onDismiss?.();
    return null;
  }

  return (
    <div
      className={`w-full max-w-2xl mx-auto transition-all duration-300 ease-apple ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <div className="glass-panel glass-glow overflow-hidden">
        {/* ── Intent Feedback Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ borderColor: 'var(--border-glass)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg shrink-0">{currentIntent.capability?.icon || '✦'}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {currentIntent.label || 'Processing'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {typeof currentIntent.description === 'function'
                  ? currentIntent.description(currentIntent.params || {})
                  : currentIntent.description || 'Resolving intent...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tier badge */}
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              {currentIntent.tier === 1 ? 'Inline' : 'Focused'}
            </span>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Panel Content ── */}
        <div className="px-5 py-4">
          {PanelComponent ? (
            <Suspense fallback={<AILoader mode="shimmer" />}>
              <PanelComponent
                params={currentIntent.params || {}}
                onDismiss={handleDismiss}
                onOpenFull={handleOpenFull}
                onSuggestionSelect={handleSuggestionSelect}
              />
            </Suspense>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                This action requires the full workspace.
              </p>
              <button onClick={handleOpenFull} className="btn-accent flex items-center gap-2">
                Open {currentIntent.label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          {/* "Open full tool" link for Tier 2 */}
          {currentIntent.tier === 2 && currentIntent.navigateTo && PanelComponent && (
            <div className="mt-3 pt-3 text-center" style={{ borderTop: '1px solid var(--border-glass)' }}>
              <button onClick={handleOpenFull}
                className="text-xs font-medium hover:underline transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                Need more options? Open full tool →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
