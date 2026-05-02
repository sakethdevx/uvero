import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import AmbientBackground from '../components/AmbientBackground';
import CommandBar from '../components/CommandBar';
import ActionPanel from '../components/ActionPanel';
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
  const navigate = useNavigate();

  useSEO({
    title: 'Uvero — Intelligent Digital Tools',
    description: 'Uvero resolves your digital tasks through a single command interface. Convert files, generate QR codes, share text, and more — all privately in your browser.',
    keywords: ['file converter', 'QR generator', 'clipboard', 'AI tools', 'intelligent assistant'],
  });

  const handleIntentResolved = useCallback((intent) => {
    setActiveIntent(intent);
  }, []);

  const handleDismissAction = useCallback(() => {
    setActiveIntent(null);
  }, []);

  const handleChipClick = useCallback((chip) => {
    // For chips with inline capabilities, trigger the intent engine
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

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 pb-24 md:pb-8">
      <AmbientBackground />

      {/* ── Main content — vertically centered ── */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        {/* Greeting */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            {getGreeting()}.
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            What would you like to do?
          </p>
        </div>

        {/* Command Bar */}
        <CommandBar
          mode="embed"
          onIntentResolved={handleIntentResolved}
        />

        {/* Action Panel (appears when intent is resolved) */}
        {activeIntent && (
          <ActionPanel
            intent={activeIntent}
            onDismiss={handleDismissAction}
          />
        )}

        {/* Action Chips */}
        {!activeIntent && (
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
        {!activeIntent && (
          <p className="text-xs font-medium tracking-wide animate-fade-in"
            style={{ color: 'var(--text-secondary)', animationDelay: '0.5s' }}
          >
            6 Capabilities · 200+ Actions · 100% Private
          </p>
        )}
      </div>
    </div>
  );
}
