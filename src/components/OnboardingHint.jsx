import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'uvero_onboarded';

const EXAMPLE_PROMPTS = [
  { label: 'Convert a PDF to images', icon: '📄' },
  { label: 'Generate a QR for WiFi', icon: '🔳' },
  { label: 'Compress this image', icon: '🖼️' },
];

/**
 * OnboardingHint — Inline, non-blocking first-time guidance.
 *
 * Renders below the CommandBar only on a user's very first visit.
 * Provides 2 lines of copy and 3 clickable example prompts.
 * Dismisses gracefully and sets a localStorage flag.
 *
 * @param {function} onExampleSelect - Called with prompt string when a chip is clicked
 */
export default function OnboardingHint({ onExampleSelect }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(ONBOARDING_KEY);
      if (!seen) setVisible(true);
    } catch {
      // localStorage unavailable — don't show
    }
  }, []);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* ignore */ }
    }, 350);
  }, []);

  const handleChipClick = useCallback((prompt) => {
    onExampleSelect?.(prompt.label);
    dismiss();
  }, [onExampleSelect, dismiss]);

  if (!visible) return null;

  return (
    <div
      className={`w-full max-w-xl mx-auto transition-all duration-[350ms] ease-apple ${
        exiting
          ? 'opacity-0 -translate-y-1 pointer-events-none'
          : 'opacity-100 translate-y-0'
      }`}
      aria-label="Getting started guide"
    >
      <div
        className="relative px-4 py-3.5 rounded-2xl"
        style={{
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid var(--border-glass)',
        }}
      >
        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Dismiss onboarding"
          className="absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Copy */}
        <div className="pr-6 mb-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
            Type what you want. Uvero will do it.
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Convert files, generate QR codes, share text — right here.
          </p>
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider self-center mr-0.5" style={{ color: 'var(--text-secondary)' }}>
            Try:
          </span>
          {EXAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={prompt.label}
              onClick={() => handleChipClick(prompt)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:-translate-y-px"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-glass)',
                animationDelay: `${i * 60}ms`,
              }}
            >
              <span>{prompt.icon}</span>
              <span>{prompt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
