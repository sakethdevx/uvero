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
    <div className="relative min-h-[calc(100dvh-8rem)] px-4 pt-10 sm:pt-14 pb-16 max-w-4xl mx-auto flex flex-col gap-9">
      
      {/* ── HERO SECTION ── */}
      <section className="relative z-10 flex flex-col items-center text-center gap-4">
        
        {/* Preference Badge / Mode Switcher */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium glass-panel border border-[var(--border)] shadow-sm animate-fade-in mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
        <div className="max-w-xl flex flex-col gap-2">
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
              className="w-full glass-panel px-4 py-3 rounded-xl border border-[var(--border)] shadow-sm flex items-center justify-between gap-3 text-left hover:border-primary-500/50 hover:shadow-md transition-all text-xs sm:text-sm group"
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
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Service Pillars
          </h2>
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            4 Pillars · 200+ Actions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Pillar 1: Toolbox */}
          <Link
            to="/toolbox"
            className="glass-panel p-5 sm:p-6 rounded-2xl border border-[var(--border)] hover:border-indigo-500/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                🛠️
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <span>Toolbox & PDF Suite</span>
                  <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                </h3>
                <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                  File converters for documents and media, plus full PDF suite to merge, split, compress & protect PDFs.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-glass)]">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                PDF & Conversion
              </span>
              <span className="text-[11px] text-gray-400">• Client-side WASM</span>
            </div>
          </Link>

          {/* Pillar 2: QR Tools */}
          <Link
            to="/qr-tools"
            className="glass-panel p-5 sm:p-6 rounded-2xl border border-[var(--border)] hover:border-violet-500/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                🔳
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex items-center gap-1.5">
                  <span>QR Tools & Studio</span>
                  <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                </h3>
                <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Generate custom QRs with logos, camera scanner, bulk generation, dynamic redirects & scan analytics.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-glass)]">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
                Generator & Scanner
              </span>
              <span className="text-[11px] text-gray-400">• Analytics & Bulk</span>
            </div>
          </Link>

          {/* Pillar 3: Clipboard */}
          <Link
            to="/clipboard"
            className="glass-panel p-5 sm:p-6 rounded-2xl border border-[var(--border)] hover:border-sky-500/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                📋
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span>Live Clipboard</span>
                  <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                </h3>
                <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Share text across devices privately with password lock, burn-after-read, auto expiry & CLI access.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-glass)]">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                Encrypted Sharing
              </span>
              <span className="text-[11px] text-gray-400">• Terminal CLI</span>
            </div>
          </Link>

          {/* Pillar 4: Compiler */}
          <Link
            to="/compiler"
            className="glass-panel p-5 sm:p-6 rounded-2xl border border-[var(--border)] hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                💻
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>Code Compiler</span>
                  <span className="text-xs text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                </h3>
                <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Monaco editor for running Python, JavaScript, C++, Go, Rust, and HTML online with stdin/stdout.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-glass)]">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Monaco IDE
              </span>
              <span className="text-[11px] text-gray-400">• 10+ Languages</span>
            </div>
          </Link>

        </div>
      </section>

      {/* ── POPULAR QUICK ACTIONS ── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm sm:text-base font-semibold tracking-tight px-1" style={{ color: 'var(--text-primary)' }}>
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
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
              className="glass-panel px-3.5 py-2.5 rounded-xl border border-[var(--border)] hover:border-primary-500/40 hover:shadow-sm flex items-center gap-2.5 text-left transition-all group"
            >
              <span className="text-sm shrink-0 group-hover:scale-110 transition-transform">{tool.icon}</span>
              <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── PRIVACY BANNER ── */}
      <section className="glass-panel p-4.5 sm:p-5 rounded-2xl border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base shrink-0">
            🛡️
          </div>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold text-gray-900 dark:text-white">100% In-Browser Privacy:</span> Files & code process locally on your device via WASM.
          </p>
        </div>
        <Link
          to="/privacy"
          className="text-primary-600 dark:text-primary-400 font-semibold hover:underline shrink-0 text-xs flex items-center gap-1 self-end sm:self-auto"
        >
          <span>Privacy Policy</span>
          <span>→</span>
        </Link>
      </section>

    </div>
  );
}
