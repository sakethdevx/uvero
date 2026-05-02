import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import AmbientBackground from '../components/AmbientBackground';
import CommandBar from '../components/CommandBar';
import ActionPanel from '../components/ActionPanel';
import OnboardingHint from '../components/OnboardingHint';
import { resolveIntent } from '../lib/IntentEngine';

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
  { label: 'Split bills', icon: '💸', path: '/split-expense' },
  { label: 'PhotoDrop', icon: '📸', path: '/photodrop' },
];

export default function ServicesHome() {
  const [activeIntent, setActiveIntent] = useState(null);
  const [externalQuery, setExternalQuery] = useState('');
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
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

  const handleDismissAction = useCallback(() => {
    setActiveIntent(null);
    // Brief "✓ Done" confirmation before chips reappear
    setShowDoneConfirm(true);
    setTimeout(() => setShowDoneConfirm(false), 1800);
  }, []);

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

  // Called by OnboardingHint when a user clicks an example chip
  const handleOnboardingExample = useCallback((text) => {
    setExternalQuery(text);
  }, []);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const isInteracting = Boolean(activeIntent);

  return (
    <div className={`premium-home ${isInteracting ? 'premium-home-interacting' : ''} relative isolate flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 pb-24 md:pb-8`}>
      <AmbientBackground />

      {/* ── Main content — vertically centered ── */}
      <div className={`premium-home-content relative z-10 w-full ${isInteracting ? 'max-w-3xl gap-4' : 'max-w-xl gap-5'} mx-auto flex flex-col items-center`}
        style={{ animationDelay: '0.1s' }}
      >
        {/* Greeting */}
        <div className="hero-copy text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            {getGreeting()}.
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            What would you like to do?
          </p>
        </div>

        {/* Command Bar — externalQuery lets onboarding inject example text */}
        <CommandBar
          mode="embed"
          onIntentResolved={handleIntentResolved}
          externalQuery={externalQuery}
          onExternalQueryConsumed={() => setExternalQuery('')}
        />

        {/* Onboarding Hint — inline, non-blocking, first-visit only */}
        <div className="focus-fade-wrap">
          <OnboardingHint onExampleSelect={handleOnboardingExample} />
        </div>

        {/* Action Panel (appears when intent is resolved) */}
        {activeIntent && (
          <div className="action-panel-stage w-full">
            <ActionPanel
              intent={activeIntent}
              onDismiss={handleDismissAction}
            />
          </div>
        )}

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
        {!activeIntent && !showDoneConfirm && (
          <div className="flex flex-wrap justify-center gap-2 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
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
        {!activeIntent && !showDoneConfirm && (
          <p className="text-xs font-medium tracking-wide animate-fade-in"
            style={{ color: 'var(--text-secondary)', animationDelay: '0.5s' }}
          >
            6 capabilities · 200+ actions · 100% private
          </p>
        )}
      </div>
    </div>
  );
}
