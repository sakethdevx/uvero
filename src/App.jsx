import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { ModeProvider } from './services/toolbox/context/ModeContext';
import { SessionProvider } from './lib/SessionContext';
import ThemeToggle from './components/ThemeToggle';
import BrandLogo from './components/BrandLogo';
import ServicesHome from './pages/ServicesHome';
import Maintenance from './pages/Maintenance';
import CommandBar from './components/CommandBar';
import BottomNav from './components/BottomNav';
import HistorySheet from './components/HistorySheet';
import FavoritesSheet from './components/FavoritesSheet';
import AmbientBackground from './components/AmbientBackground';
import AILoader from './components/AILoader';
import { useAuth } from './auth/AuthContext';
import { signOut } from './auth/authService';
import { getMaintenanceConfig } from './config/maintenance';
import { resolveIntent } from './lib/IntentEngine';
import { InteractionProvider, useInteraction } from './lib/InteractionContext';

const CompilerHome = lazy(() => import('./services/compiler/pages/CompilerHome'));
const ToolboxHome = lazy(() => import('./services/toolbox/pages/ToolboxHome'));
const ToolPage = lazy(() => import('./services/toolbox/pages/ToolPage'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Contact = lazy(() => import('./pages/Contact'));
const EventsPage = lazy(() => import('./services/photodrop/pages/Events'));
const EventDetail = lazy(() => import('./services/photodrop/pages/EventDetail'));
const InvitePage = lazy(() => import('./services/photodrop/pages/Invite'));
const Clipboard = lazy(() => import('./services/clipboard/pages/Clipboard'));
const ClipboardBoard = lazy(() => import('./services/clipboard/pages/ClipboardBoard'));
const PublicClipboard = lazy(() => import('./services/clipboard/pages/PublicClipboard'));
const ClipboardCli = lazy(() => import('./services/clipboard/pages/ClipboardCli'));
const SplitExpenseHome = lazy(() => import('./services/split-expense/pages/SplitExpenseHome'));
const SplitExpenseGroup = lazy(() => import('./services/split-expense/pages/SplitExpenseGroup'));
const QRToolsHome = lazy(() => import('./services/qr-tools/pages/QRToolsHome'));
const QRGenerator = lazy(() => import('./services/qr-tools/pages/QRGenerator'));
const QRScanner = lazy(() => import('./services/qr-tools/pages/QRScanner'));
const QRValidator = lazy(() => import('./services/qr-tools/pages/QRValidator'));
const BulkQRGenerator = lazy(() => import('./services/qr-tools/pages/BulkQRGenerator'));
const DynamicQRManager = lazy(() => import('./services/qr-tools/pages/DynamicQRManager'));
const QRRedirectPage = lazy(() => import('./services/qr-tools/pages/QRRedirectPage'));
const QRAnalytics = lazy(() => import('./services/qr-tools/pages/QRAnalytics'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));

/**
 * Main App Content — Glass header + routes + minimal footer + bottom nav (mobile)
 */
function AppContent() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { interactionState } = useInteraction();

  const isFaded = interactionState !== 'idle';
  const fadeClass = isFaded ? 'ui-faded' : '';

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isHomepage = location.pathname === '/';

  // Central Intent Trigger Pipeline
  const triggerIntent = useCallback((item) => {
    if (!item.capability) return;

    // Resolve the full capability object if we only have the ID
    const result = resolveIntent(item.action || item.label || '');
    
    // If it's a Tier 1 or 2 (inline), trigger the ActionPanel on homepage
    if (result.capability && result.tier <= 2) {
      if (!isHomepage) navigate('/');
      
      // Dispatch custom event that ServicesHome listens to
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('uvero-trigger-intent', { 
          detail: {
            capability: result.capability,
            params: item.params || result.params || {},
            label: item.action || item.label,
            description: item.description,
            tier: result.tier,
            handler: result.handler,
            navigateTo: result.navigateTo,
          } 
        }));
      }, 50);
    } else if (result.navigateTo || item.navigateTo) {
      // Tier 3 or direct navigation
      navigate(result.navigateTo || item.navigateTo);
    }
  }, [isHomepage, navigate]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <AmbientBackground state={interactionState} />
      {/* ══════ Glass Header ══════ */}
      <header className={`sticky top-0 z-50 glass-panel rounded-none transition-ui ${fadeClass}`}
        style={{
          borderRadius: 0,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <BrandLogo iconClassName="w-10 h-10 sm:w-11 sm:h-11" textClassName="text-2xl sm:text-[26px]" />
            </Link>

            {/* Right side — Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {/* Search trigger */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 text-sm font-medium py-1.5 px-3 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-white/5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded-md"
                  style={{
                    background: 'var(--surface-2)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >⌘K</kbd>
              </button>

              <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />
              <ThemeToggle />
              <AuthStatus />
            </div>

            {/* Right side — Mobile */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <ThemeToggle />
              <MobileAuthAvatar />
            </div>
          </div>
        </div>
      </header>

      {/* ══════ Main Content ══════ */}
      <main id="main" className="flex-1 pb-20 md:pb-0">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<ServicesHome />} />
            <Route path="/compiler" element={<CompilerHome />} />
            <Route path="/toolbox" element={<ToolboxHome />} />
            <Route path="/photodrop" element={<EventsPage />} />
            <Route path="/photodrop/:id" element={<EventDetail />} />
            <Route path="/clipboard" element={<Clipboard />} />
            <Route path="/clipboard/:boardId" element={<ClipboardBoard />} />
            <Route path="/c/:code" element={<PublicClipboard />} />
            <Route path="/cli" element={<ClipboardCli />} />
            <Route path="/split-expense" element={<SplitExpenseHome />} />
            <Route path="/split-expense/:groupId" element={<SplitExpenseGroup />} />
            <Route path="/qr-tools" element={<QRToolsHome />} />
            <Route path="/qr-tools/generator" element={<QRGenerator />} />
            <Route path="/qr-tools/scanner" element={<QRScanner />} />
            <Route path="/qr-tools/validator" element={<QRValidator />} />
            <Route path="/qr-tools/bulk" element={<BulkQRGenerator />} />
            <Route path="/qr-tools/dynamic" element={<DynamicQRManager />} />
            <Route path="/qr-tools/analytics" element={<QRAnalytics />} />
            <Route path="/qr/r/:code" element={<QRRedirectPage />} />
            <Route path="/invite/:token" element={<InvitePage />} />
            <Route path="/:toolId" element={<ToolPage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Suspense>
      </main>

      {/* ══════ Command Bar Modal ══════ */}
      <CommandBar
        mode="modal"
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* ══════ History Sheet ══════ */}
      <HistorySheet
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRerun={triggerIntent}
      />

      {/* ══════ Favorites Sheet ══════ */}
      <FavoritesSheet
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        onRerun={triggerIntent}
      />

      {/* ══════ Minimal Footer (hidden on mobile homepage) ══════ */}
      <footer className={`mt-auto transition-ui ${fadeClass} ${isHomepage ? 'hidden md:block' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            <p>© 2026 Uvero. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:underline">Privacy</Link>
              <Link to="/contact" className="hover:underline">Contact</Link>
              <Link to="/cli" className="hover:underline">CLI</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ══════ Bottom Nav (Mobile) ══════ */}
      <div className={`transition-ui ${fadeClass}`}>
        <BottomNav
          onCommandPress={() => setIsSearchOpen(true)}
          onHistoryPress={() => setIsHistoryOpen(true)}
          onFavoritesPress={() => setIsFavoritesOpen(true)}
        />
      </div>
    </div>
  );
}

function App() {
  const maintenance = getMaintenanceConfig();

  if (maintenance.enabled) {
    return <Maintenance config={maintenance} />;
  }

  return (
    <Router>
      <SessionProvider>
        <ModeProvider>
          <InteractionProvider>
            <AppContent />
          </InteractionProvider>
        </ModeProvider>
      </SessionProvider>
    </Router>
  );
}

export default App;

/* ── Route Fallback with AI Loader ── */
function RouteFallback() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <AILoader mode="orb" label="Loading..." />
    </div>
  );
}

/* ── Auth Components ── */
function AuthStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [needsUsernameSetup, setNeedsUsernameSetup] = useState(false);

  useEffect(() => {
    function syncUsernameSetupFlag() {
      try {
        setNeedsUsernameSetup(window.localStorage.getItem('uvero_username_setup_required') === '1');
      } catch {
        setNeedsUsernameSetup(false);
      }
    }
    syncUsernameSetupFlag();
    window.addEventListener('storage', syncUsernameSetupFlag);
    window.addEventListener('uvero-username-setup-changed', syncUsernameSetupFlag);
    return () => {
      window.removeEventListener('storage', syncUsernameSetupFlag);
      window.removeEventListener('uvero-username-setup-changed', syncUsernameSetupFlag);
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const res = await signOut();
      if (res?.error) throw res.error;
      try {
        window.localStorage.removeItem('uvero_username_setup_required');
        window.dispatchEvent(new Event('uvero-username-setup-changed'));
      } catch { /* ignore */ }
      navigate('/', { replace: true });
    } catch (err) {
      window.alert('Sign out failed: ' + (err?.message || err));
    } finally {
      setSigningOut(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="text-sm font-medium transition-colors hover:underline"
          style={{ color: 'var(--text-secondary)' }}
        >
          Sign in
        </Link>
        <Link to="/signup" className="btn-accent text-sm py-1.5 px-3.5">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {needsUsernameSetup && (
        <Link to="/profile"
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
        >
          Set username
        </Link>
      )}
      <Link to="/profile"
        className="flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold transition-all hover:scale-105"
        style={{
          background: 'var(--accent-subtle)',
          color: 'var(--accent)',
        }}
      >
        {(user?.user_metadata?.username || user.email || 'U').charAt(0).toUpperCase()}
      </Link>
      <button onClick={handleSignOut} disabled={signingOut}
        className="text-xs font-medium transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        {signingOut ? '...' : 'Sign out'}
      </button>
    </div>
  );
}

function MobileAuthAvatar() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Link to="/login"
        className="text-xs font-bold px-3 py-1.5 rounded-xl text-white"
        style={{ background: 'var(--accent)' }}
      >
        Sign in
      </Link>
    );
  }

  const displayName = user?.user_metadata?.username || user.email || 'U';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Link to="/profile"
      className="flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold"
      style={{
        background: 'var(--accent-subtle)',
        color: 'var(--accent)',
      }}
    >
      {initial}
    </Link>
  );
}
