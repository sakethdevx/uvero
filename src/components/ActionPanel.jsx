import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import AILoader from './AILoader';

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
 * ActionPanel — Inline execution container.
 * Appears below the command bar when an intent is resolved.
 * Dynamically loads the right sub-panel based on capability.
 */
export default function ActionPanel({ intent, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (intent) {
      // Small delay so the animation looks intentional
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [intent]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 250);
  }, [onDismiss]);

  const handleOpenFull = useCallback(() => {
    if (intent?.navigateTo) {
      navigate(intent.navigateTo);
      handleDismiss();
    }
  }, [intent, navigate, handleDismiss]);

  if (!intent) return null;

  const PanelComponent = intent.handler ? PANEL_MAP[intent.handler] : null;
  const isTier3 = intent.tier === 3;

  // Tier 3: navigate immediately
  if (isTier3 && intent.navigateTo) {
    navigate(intent.navigateTo);
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
            <span className="text-lg shrink-0">{intent.capability?.icon || '✦'}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {intent.label || 'Processing'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {intent.description || 'Resolving intent...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tier badge */}
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
              }}
            >
              {intent.tier === 1 ? 'Inline' : 'Focused'}
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
                params={intent.params || {}}
                onDismiss={handleDismiss}
                onOpenFull={handleOpenFull}
              />
            </Suspense>
          ) : (
            /* Tier 2 without inline handler — show redirect card */
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                This action requires the full workspace.
              </p>
              <button
                onClick={handleOpenFull}
                className="btn-accent flex items-center gap-2"
              >
                Open {intent.label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          {/* "Open full tool" link for Tier 2 panels that have a handler */}
          {intent.tier === 2 && intent.navigateTo && PanelComponent && (
            <div className="mt-3 pt-3 text-center" style={{ borderTop: '1px solid var(--border-glass)' }}>
              <button
                onClick={handleOpenFull}
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
