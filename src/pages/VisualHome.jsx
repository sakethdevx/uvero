import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import CommandBar from '../components/CommandBar';
import ActionPanel from '../components/ActionPanel';
import { useHomepagePreference, HOMEPAGE_PREFS } from '../lib/useHomepagePreference';

export default function VisualHome() {
  const navigate = useNavigate();
  const { setPreference } = useHomepagePreference();
  const [activeIntent, setActiveIntent] = useState(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useSEO({
    title: 'Uvero — Intelligent Digital Workspace',
    description: 'Explore Uvero’s private digital tools: PDF editing, file conversion, QR generator, live clipboard, and Monaco compiler. 100% client-side.',
    keywords: ['digital tools', 'PDF tools', 'file converter', 'QR generator', 'live clipboard', 'code compiler', 'browser WASM'],
  });

  const handleIntentResolved = useCallback((intent) => {
    setActiveIntent(intent);
  }, []);

  const handleSwitchToCommand = () => {
    setPreference(HOMEPAGE_PREFS.COMMAND);
  };

  const handleDismissAction = useCallback(() => {
    setActiveIntent(null);
  }, []);

  return (
    <div className="relative min-h-[calc(100dvh-8rem)] px-4 py-6 max-w-4xl mx-auto flex flex-col gap-8">
      
      {/* ── HERO SECTION ── */}
      <section className="relative z-10 flex flex-col items-center text-center gap-3">
        
        {/* Preference Badge / Mode Switcher */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium glass-panel border border-[var(--border)] shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span style={{ color: 'var(--text-secondary)' }}>Visual Catalog Mode</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <button
            onClick={handleSwitchToCommand}
            className="hover:underline flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400 transition-colors"
            title="Switch to minimal search-focused homepage"
          >
            <span>⚡ Command Mode</span>
          </button>
        </div>

        {/* Headline & Subtitle */}
        <div className="max-w-xl flex flex-col gap-1.5">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight intelligence-text">
            Explore Uvero&apos;s Private Digital Workspace
          </h1>
          <p className="text-xs sm:text-sm leading-normal max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Convert files, generate QR codes, share encrypted text, and run code — 100% in your browser.
          </p>
        </div>

        {/* Command Launcher / Trigger */}
        <div className="w-full max-w-md mt-1">
          {!isCommandOpen ? (
            <button
              onClick={() => setIsCommandOpen(true)}
              className="w-full glass-panel px-4 py-2.5 rounded-xl border border-[var(--border)] shadow-sm flex items-center justify-between gap-3 text-left hover:border-primary-500/40 transition-all text-xs sm:text-sm group"
            >
              <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 group-hover:text-primary-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Type any action or search tools...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                ⌘K
              </kbd>
            </button>
          ) : (
            <div className="animate-state-in">
              <CommandBar
                mode="embed"
                onIntentResolved={handleIntentResolved}
              />
            </div>
          )}
        </div>
      </section>

      {/* Action Panel Modal */}
      {activeIntent && (
        <section className="w-full max-w-2xl mx-auto z-20">
          <ActionPanel intent={activeIntent} onDismiss={handleDismissAction} />
        </section>
      )}

      {/* ── CORE SERVICES (2x2 Grid) ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Services
          </h2>
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            4 Pillars · 200+ Actions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Pillar 1: Toolbox */}
          <Link
            to="/toolbox"
            className="glass-panel p-4 rounded-xl border border-[var(--border)] hover:border-indigo-500/40 hover:shadow-md transition-all group flex flex-col justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg shrink-0">
                🛠️
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Toolbox & PDF Suite
                  </h3>
                  <span className="text-[10px] text-gray-400">→</span>
                </div>
                <p className="text-[11px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  File converters for documents, media, plus merge, split, compress & protect PDFs.
                </p>
              </div>
            </div>
          </Link>

          {/* Pillar 2: QR Tools */}
          <Link
            to="/qr-tools"
            className="glass-panel p-4 rounded-xl border border-[var(--border)] hover:border-violet-500/40 hover:shadow-md transition-all group flex flex-col justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center text-lg shrink-0">
                🔳
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    QR Tools & Studio
                  </h3>
                  <span className="text-[10px] text-gray-400">→</span>
                </div>
                <p className="text-[11px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  Generate custom QRs with logos, scanner, bulk codes, dynamic redirects & analytics.
                </p>
              </div>
            </div>
          </Link>

          {/* Pillar 3: Clipboard */}
          <Link
            to="/clipboard"
            className="glass-panel p-4 rounded-xl border border-[var(--border)] hover:border-sky-500/40 hover:shadow-md transition-all group flex flex-col justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-lg shrink-0">
                📋
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-semibold group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    Live Clipboard
                  </h3>
                  <span className="text-[10px] text-gray-400">→</span>
                </div>
                <p className="text-[11px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  Share text across devices privately with password lock, expiry & CLI access.
                </p>
              </div>
            </div>
          </Link>

          {/* Pillar 4: Compiler */}
          <Link
            to="/compiler"
            className="glass-panel p-4 rounded-xl border border-[var(--border)] hover:border-emerald-500/40 hover:shadow-md transition-all group flex flex-col justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
                💻
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Code Compiler
                  </h3>
                  <span className="text-[10px] text-gray-400">→</span>
                </div>
                <p className="text-[11px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  Monaco IDE for running Python, JavaScript, C++, Go & Rust code online.
                </p>
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* ── POPULAR QUICK ACTIONS ── */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: 'Merge PDF', icon: '📄', path: '/toolbox' },
            { label: 'WiFi QR', icon: '📶', path: '/qr-tools/generator' },
            { label: 'Clipboard', icon: '📋', path: '/clipboard' },
            { label: 'Run Python', icon: '🐍', path: '/compiler' },
            { label: 'Bulk QR', icon: '📊', path: '/qr-tools/bulk' },
            { label: 'QR Scanner', icon: '📷', path: '/qr-tools/scanner' },
          ].map((tool) => (
            <button
              key={tool.label}
              onClick={() => navigate(tool.path)}
              className="glass-panel px-3 py-2 rounded-lg border border-[var(--border)] hover:border-accent/40 flex items-center gap-2 text-left transition-all group"
            >
              <span className="text-sm shrink-0">{tool.icon}</span>
              <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── PRIVACY BANNER ── */}
      <section className="glass-panel p-3.5 sm:p-4 rounded-xl border border-[var(--border)] flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-sm shrink-0">🛡️</span>
          <p className="truncate" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold text-gray-900 dark:text-white">100% In-Browser Privacy:</span> Files & code process locally on your device via WASM.
          </p>
        </div>
        <Link
          to="/privacy"
          className="text-primary-600 dark:text-primary-400 font-semibold hover:underline shrink-0 text-[11px]"
        >
          Privacy Policy →
        </Link>
      </section>

    </div>
  );
}
