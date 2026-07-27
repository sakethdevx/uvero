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
    description: 'Explore Uvero’s private digital tools: PDF editing, file conversion, QR code generator, encrypted live clipboard, and Monaco code compiler. 100% client-side.',
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
    <div className="relative min-h-screen px-4 py-8 md:py-12 max-w-6xl mx-auto flex flex-col gap-12">
      
      {/* ── HERO SECTION ── */}
      <section className="relative z-10 flex flex-col items-center text-center gap-6 pt-4 md:pt-8">
        
        {/* Preference Badge / Quick Switcher */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium glass-panel border border-[var(--border)] shadow-sm animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span style={{ color: 'var(--text-secondary)' }}>Default Homepage</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <button
            onClick={handleSwitchToCommand}
            className="hover:underline flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400 transition-colors"
            title="Switch to minimal search-focused homepage"
          >
            <span>⚡ Switch to Command Mode</span>
          </button>
        </div>

        {/* Headline & Tagline */}
        <div className="max-w-3xl flex flex-col gap-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight intelligence-text leading-tight sm:leading-tight">
            Your Private Digital Workspace for Files, QR, Clipboard & Code
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Process PDFs, convert files, generate QR codes, share encrypted text, and execute code online — completely private in your browser.
          </p>
        </div>

        {/* Quick Search Launcher / Command Trigger */}
        <div className="w-full max-w-xl mt-2">
          {!isCommandOpen ? (
            <button
              onClick={() => setIsCommandOpen(true)}
              className="w-full glass-panel px-5 py-4 rounded-2xl border border-[var(--border)] shadow-lg flex items-center justify-between gap-3 text-left hover:border-primary-500/40 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <svg className="w-5 h-5 group-hover:text-primary-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm sm:text-base font-medium">Type any action (e.g. &quot;Merge PDF&quot;, &quot;WiFi QR&quot;, &quot;Run Python&quot;)...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
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

      {/* Action Panel Modal (when user runs intent from embedded command) */}
      {activeIntent && (
        <section className="w-full max-w-3xl mx-auto z-20">
          <ActionPanel intent={activeIntent} onDismiss={handleDismissAction} />
        </section>
      )}

      {/* ── 4 SERVICE PILLARS (Category Showcase) ── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Core Service Pillars
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Explore Uvero&apos;s modular workspace tools built for privacy, speed, and efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Pillar 1: Toolbox */}
          <div className="glass-panel rounded-2xl p-6 border border-[var(--border)] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-5 group">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold">
                  🛠️
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  WASM Powered
                </span>
              </div>
              <h3 className="text-xl font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Toolbox & PDF Suite
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Unified file converter for documents, images, audio, and video. Comprehensive PDF suite to merge, split, compress, protect, watermark, and extract pages.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Merge PDF', 'Compress PDF', 'Image Convert', 'Audio Split', 'Metadata Clean'].map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to="/toolbox"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors"
            >
              <span>Open Toolbox</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          {/* Pillar 2: QR Tools */}
          <div className="glass-panel rounded-2xl p-6 border border-[var(--border)] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-5 group">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center text-2xl font-bold">
                  🔳
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  Full Studio
                </span>
              </div>
              <h3 className="text-xl font-bold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                QR Tools & Generator
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Create custom QR codes with logos, scan via camera/file, validate QR integrity, generate bulk codes, manage dynamic redirects, and track scan analytics.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['WiFi QR', 'Bulk Generator', 'Scanner', 'Dynamic Codes', 'Analytics'].map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to="/qr-tools"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors"
            >
              <span>Explore QR Tools</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          {/* Pillar 3: Clipboard */}
          <div className="glass-panel rounded-2xl p-6 border border-[var(--border)] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-5 group">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-2xl font-bold">
                  📋
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  End-to-End Encrypted
                </span>
              </div>
              <h3 className="text-xl font-bold group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Live Clipboard & Sharing
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Share code snippets, notes, and credentials across devices securely. Password protection, auto-expiry, burn-after-read, QR sharing, and terminal CLI integration.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Live Sync', 'Burn-on-read', 'Password Lock', 'CLI Sync', 'QR Share'].map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to="/clipboard"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition-colors"
            >
              <span>Open Clipboard</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          {/* Pillar 4: Compiler */}
          <div className="glass-panel rounded-2xl p-6 border border-[var(--border)] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-5 group">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold">
                  💻
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Monaco IDE
                </span>
              </div>
              <h3 className="text-xl font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Online Code Compiler
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Feature-rich Monaco code editor for running Python, JavaScript, C++, Go, Rust, Java, and HTML/CSS snippets instantly with stdin/stdout support.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Python', 'JavaScript', 'C++', 'Go', 'Rust', 'Monaco Editor'].map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to="/compiler"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors"
            >
              <span>Launch Compiler</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

        </div>
      </section>

      {/* ── POPULAR QUICK TOOLS ── */}
      <section className="flex flex-col gap-5 pt-4">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Popular Quick Actions
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Frequently used tools you can launch in 1 click.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Merge PDF', icon: '📄', path: '/toolbox', desc: 'Combine multiple PDFs' },
            { label: 'WiFi QR Code', icon: '📶', path: '/qr-tools/generator', desc: 'Instant WiFi join QR' },
            { label: 'Live Clipboard', icon: '📋', path: '/clipboard', desc: 'Share text across devices' },
            { label: 'Python Runner', icon: '🐍', path: '/compiler', desc: 'Run Python in Monaco' },
            { label: 'Bulk QR Maker', icon: '📊', path: '/qr-tools/bulk', desc: 'Generate 100+ QRs' },
            { label: 'QR Scanner', icon: '📷', path: '/qr-tools/scanner', desc: 'Scan via camera or file' },
          ].map((tool) => (
            <button
              key={tool.label}
              onClick={() => navigate(tool.path)}
              className="glass-panel p-4 rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md hover:border-primary-500/50 flex flex-col items-center text-center gap-2 transition-all duration-200 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{tool.icon}</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{tool.label}</span>
              <span className="text-[11px] leading-tight line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{tool.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── PRIVACY GUARANTEE BANNER ── */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border)] shadow-lg bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-sky-500/5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0">
              🛡️
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                100% In-Browser Privacy & Client-Side Execution
              </h3>
              <p className="text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                Your documents, files, and QR contents are processed locally on your device using WebAssembly and Web Workers. We never store or upload your sensitive files to external servers.
              </p>
            </div>
          </div>

          <Link
            to="/privacy"
            className="px-5 py-2.5 rounded-xl border border-[var(--border)] bg-surface-1 font-medium text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0 shadow-sm"
          >
            Learn Privacy Policy →
          </Link>
        </div>
      </section>

      {/* ── FOOTER PREFERENCE NOTE ── */}
      <footer className="text-center pt-2 pb-6 border-t border-[var(--border)] flex flex-col items-center gap-2">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Tip: Prefer the minimal search bar? Switch your default homepage in your{' '}
          <Link to="/profile" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
            Profile Preferences
          </Link>
          .
        </p>
      </footer>

    </div>
  );
}
