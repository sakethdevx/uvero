import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import CommandBar from '../components/CommandBar';
import ActionPanel from '../components/ActionPanel';
import OnboardingHint from '../components/OnboardingHint';
import { resolveIntent } from '../lib/IntentEngine';
import { useInteraction } from '../lib/InteractionContext';

/**
 * ServicesHome — The Intelligence Interface.
 * Single-viewport homepage: greeting + command bar + inline action panel + action chips.
 * Zero scroll on desktop, minimal on mobile.
 */

const ACTION_CHIPS = [
  { label: 'Convert files', icon: '⚡', path: '/toolbox', capability: 'file-convert' },
  { label: 'Generate QR', icon: '🔳', path: '/qr-tools', capability: 'qr-generate-quick' },
  { label: 'Share text', icon: '📋', path: '/clipboard', capability: 'clipboard-share' },
  { label: 'Run code', icon: '💻', path: '/compiler' },
];

export default function ServicesHome() {
  const [activeIntent, setActiveIntent] = useState(null);
  const [externalQuery, setExternalQuery] = useState('');
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const { interactionState, setInteractionState } = useInteraction();
  const navigate = useNavigate();

  useSEO({
    title: 'Uvero — Intelligent Digital Tools',
    description: 'Uvero resolves your digital tasks through a single command interface. Convert files, generate QR codes, share text, and more — all privately in your browser.',
    keywords: ['file converter', 'QR generator', 'clipboard', 'AI tools', 'intelligent assistant'],
  });

  const handleIntentResolved = useCallback((intent) => {
    setActiveIntent(intent);
    setShowDoneConfirm(false);
  }, []);

  // Listen for external intent triggers (from History/Favorites)
  useEffect(() => {
    const handler = (e) => {
      if (e.detail) {
        handleIntentResolved(e.detail);
      }
    };
    window.addEventListener('uvero-trigger-intent', handler);
    return () => window.removeEventListener('uvero-trigger-intent', handler);
  }, [handleIntentResolved]);

  const handleDismissAction = useCallback(() => {
    setActiveIntent(null);
    setInteractionState('idle');
    // Brief "✓ Done" confirmation before chips reappear
    setShowDoneConfirm(true);
    setTimeout(() => setShowDoneConfirm(false), 1800);
  }, [setInteractionState]);

  const handleChipClick = useCallback((chip) => {
    if (chip.capability) {
      const result = resolveIntent(chip.label);
      if (result.capability && result.tier <= 2 && result.handler) {
        setActiveIntent({
          capability: result.capability,
          params: result.params || {},
          label: result.label,
          description: result.description,
          tier: result.tier,
          handler: result.handler,
          navigateTo: result.navigateTo,
        });
        return;
      }
    }
    navigate(chip.path);
  }, [navigate]);

  const handleOnboardingExample = useCallback((text) => {
    setExternalQuery(text);
  }, []);

  useEffect(() => {
    const nextState = activeIntent ? 'processing' : 'idle';
    if (interactionState !== nextState) {
      setInteractionState(nextState);
    }
  }, [activeIntent, setInteractionState, interactionState]);

  const isInteracting = Boolean(activeIntent) || interactionState !== 'idle';
  const isFaded = interactionState !== 'idle';
  const fadeClass = isFaded ? 'ui-faded' : '';

  return (
    <div className={`premium-home ${isInteracting ? 'premium-home-interacting' : ''} relative flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 pb-24 md:pb-8`}>

      {/* ── Main content — vertically centered ── */}
      <div className={`premium-home-content relative z-10 w-full ${isInteracting ? 'max-w-3xl gap-4' : 'max-w-xl gap-5'} mx-auto flex flex-col items-center`}>
        {/* Greeting */}
        <div className="hero-copy text-center max-w-sm mx-auto mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight intelligence-text">
            Tell me what to do or choose a suggestion.
          </h1>
        </div>

        {/* Command Bar — externalQuery lets onboarding inject example text */}
        <CommandBar
          mode="embed"
          onIntentResolved={handleIntentResolved}
          externalQuery={externalQuery}
          onExternalQueryConsumed={() => setExternalQuery('')}
        />

        {/* Onboarding Hint — inline, non-blocking, first-visit only */}
        <div className={`focus-fade-wrap transition-ui ${fadeClass}`}>
          <OnboardingHint onExampleSelect={handleOnboardingExample} />
        </div>

        {/* Post-action micro-confirmation */}
        {showDoneConfirm && !activeIntent && (
          <div className="success-highlight flex items-center gap-2 text-sm font-medium animate-state-in"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Done — what&apos;s next?
          </div>
        )}

        {/* Action Chips */}
        {!activeIntent && (
          <div className={`flex flex-wrap justify-center gap-2 animate-fade-in transition-ui ${fadeClass}`}>
            {ACTION_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chip)}
                className="action-chip text-gray-700 dark:text-gray-300"
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Stats line */}
        {!activeIntent && (
          <p className={`text-xs font-medium tracking-wide animate-fade-in transition-ui ${fadeClass}`}
            style={{ color: 'var(--text-secondary)' }}
          >
            6 capabilities · 200+ actions · 100% private
          </p>
        )}
      </div>

      {/* Action Panel (appears when intent is resolved) */}
      {activeIntent && (
        <ActionPanel
          intent={activeIntent}
          onDismiss={handleDismissAction}
        />
      )}
    </div>
  );
}
