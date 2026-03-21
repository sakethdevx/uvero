import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ModeProvider } from './features/file-processing/context/ModeContext';
import ModeToggle from './features/file-processing/components/ModeToggle';
import ThemeToggle from './components/ThemeToggle';
import ServicesHome from './pages/ServicesHome';
import CompilerHome from './features/compiler/pages/CompilerHome';
import Home from './features/file-processing/pages/Home';
import ToolPage from './features/file-processing/pages/ToolPage';
import Privacy from './pages/Privacy';
import EventsPage from './features/photodrop/pages/Events';
import EventDetail from './features/photodrop/pages/EventDetail';
import InvitePage from './features/photodrop/pages/Invite';
import Clipboard from './features/clipboard/pages/Clipboard';
import ClipboardBoard from './features/clipboard/pages/ClipboardBoard';
import PublicClipboard from './features/clipboard/pages/PublicClipboard';
import ClipboardCli from './features/clipboard/pages/ClipboardCli';
import SplitExpenseHome from './features/split-expense/pages/SplitExpenseHome';
import SplitExpenseGroup from './features/split-expense/pages/SplitExpenseGroup';
import QRToolsHome from './features/qr-tools/pages/QRToolsHome';
import QRGenerator from './features/qr-tools/pages/QRGenerator';
import QRScanner from './features/qr-tools/pages/QRScanner';
import QRValidator from './features/qr-tools/pages/QRValidator';
import BulkQRGenerator from './features/qr-tools/pages/BulkQRGenerator';
import DynamicQRManager from './features/qr-tools/pages/DynamicQRManager';
import QRRedirectPage from './features/qr-tools/pages/QRRedirectPage';
import QRAnalytics from './features/qr-tools/pages/QRAnalytics';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Maintenance from './pages/Maintenance';
import { useAuth } from './auth/AuthContext';
import { signOut } from './auth/authService';
import { getToolById } from './features/file-processing/tools';
import { getMaintenanceConfig } from './config/maintenance';

/**
 * Main App Component
 * Handles routing and global layout
 */
function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownTimerRef = useRef(null);
  const location = useLocation();

  // Determine if we're on a file processing route (for scoping ModeToggle)
  const isFileProcessingRoute = location.pathname === '/tools' || !!getToolById(location.pathname.slice(1));

  // Close mobile menu and scroll to top on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsToolsDropdownOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleDropdownEnter = () => {
    clearTimeout(dropdownTimerRef.current);
    setIsToolsDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    dropdownTimerRef.current = setTimeout(() => setIsToolsDropdownOpen(false), 200);
  };

  const toolCategories = [
    {
      name: 'Image Tools',
      icon: '🖼️',
      tools: [
        { name: 'Image Compressor', path: '/compress-image' },
        { name: 'Image Converter', path: '/convert-image' },
        { name: 'Image to PDF', path: '/image-to-pdf' },
        { name: 'Image Resizer', path: '/resize-image' },
        { name: 'GIF Maker', path: '/gif-maker' },
        { name: 'Add Watermark', path: '/watermark' },
        { name: 'Image Cropper', path: '/crop-image' },
        { name: 'Background Remover', path: '/remove-background' },
        { name: 'JPG to PDF', path: '/jpg-to-pdf' },
        { name: 'PDF to JPG', path: '/pdf-to-jpg' },
        { name: 'HEIC to JPG', path: '/heic-to-jpg' }
      ]
    },
    {
      name: 'PDF Tools',
      icon: '📄',
      tools: [
        { name: 'PDF Compressor', path: '/compress-pdf' },
        { name: 'PDF Merger', path: '/merge-pdf' },
        { name: 'PDF Splitter', path: '/split-pdf' },
        { name: 'PDF to Image', path: '/convert-pdf' },
        { name: 'PDF to Word', path: '/pdf-to-word' },
        { name: 'PDF to PowerPoint', path: '/pdf-to-powerpoint' },
        { name: 'PDF to Excel', path: '/pdf-to-excel' },
        { name: 'Word to PDF', path: '/word-to-pdf' },
        { name: 'PowerPoint to PDF', path: '/powerpoint-to-pdf' },
        { name: 'Excel to PDF', path: '/excel-to-pdf' },
        { name: 'HTML to PDF', path: '/html-to-pdf' },
        { name: 'PDF to PDF/A', path: '/pdf-to-pdfa' },
        { name: 'Edit PDF', path: '/edit-pdf' },
        { name: 'Sign PDF', path: '/sign-pdf' },
        { name: 'Rotate PDF', path: '/rotate-pdf' },
        { name: 'Watermark PDF', path: '/watermark-pdf' },
        { name: 'Protect PDF', path: '/protect-pdf' },
        { name: 'Unlock PDF', path: '/unlock-pdf' },
        { name: 'Organize PDF', path: '/organize-pdf' },
        { name: 'Page Numbers', path: '/page-numbers' },
        { name: 'Repair PDF', path: '/repair-pdf' },
        { name: 'Crop PDF', path: '/crop-pdf' },
        { name: 'Redact PDF', path: '/redact-pdf' },
        { name: 'OCR PDF', path: '/ocr-pdf' },
        { name: 'Compare PDF', path: '/compare-pdf' },
        { name: 'Scan to PDF', path: '/scan-to-pdf' },
        { name: 'Translate PDF', path: '/translate-pdf' }
      ]
    },
    {
      name: 'Audio Tools',
      icon: '🎵',
      tools: [
        { name: 'Audio Compressor', path: '/compress-audio' },
        { name: 'Audio Converter', path: '/convert-audio' },
        { name: 'Video to MP3', path: '/video-to-mp3' },
        { name: 'MP3 Converter', path: '/mp3-converter' },
        { name: 'MP4 to MP3', path: '/mp4-to-mp3' }
      ]
    },
    {
      name: 'Video Tools',
      icon: '🎬',
      tools: [
        { name: 'Video Compressor', path: '/compress-video' },
        { name: 'Video Converter', path: '/convert-video' },
        { name: 'MP4 Converter', path: '/mp4-converter' },
        { name: 'Video to GIF', path: '/video-to-gif' },
        { name: 'MOV to MP4', path: '/mov-to-mp4' }
      ]
    },
    {
      name: 'Document & Ebook',
      icon: '📚',
      tools: [
        { name: 'EPUB to PDF', path: '/epub-to-pdf' },
        { name: 'EPUB to MOBI', path: '/epub-to-mobi' },
        { name: 'Document Converter', path: '/document-converter' }
      ]
    },
    {
      name: 'Archive Tools',
      icon: '🗜️',
      tools: [
        { name: 'RAR to Zip', path: '/rar-to-zip' },
        { name: 'Archive Converter', path: '/archive-converter' }
      ]
    },
    {
      name: 'Time Zone',
      icon: '🌍',
      tools: [
        { name: 'PST to EST', path: '/pst-to-est' },
        { name: 'CST to EST', path: '/cst-to-est' },
        { name: 'Time Zone Converter', path: '/timezone-converter' }
      ]
    },
    {
      name: 'Unit Converter',
      icon: '📏',
      tools: [
        { name: 'Lbs to Kg', path: '/lbs-to-kg' },
        { name: 'Kg to Lbs', path: '/kg-to-lbs' },
        { name: 'Feet to Meters', path: '/feet-to-meters' },
        { name: 'Unit Converter', path: '/unit-converter' }
      ]
    },
    {
      name: 'Utility Tools',
      icon: '🛠️',
      tools: [
        { name: 'QR Code Generator', path: '/qr-generator' },
        { name: 'Password Generator', path: '/password-generator' }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 py-2 px-4 sm:px-6 lg:px-8">
        <nav className={`max-w-7xl mx-auto transition-all duration-500 ${isScrolled ? 'floating-nav-scrolled' : 'floating-nav'}`}>
          <div className="flex justify-between items-center h-16 px-4 sm:px-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group relative z-10">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 logo-shine relative overflow-hidden">
                <span className="text-white font-bold text-xl relative z-10">U</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                U<span className="gradient-text animate-gradient-x">ver</span>o
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              {/* Tools Dropdown */}
              {isFileProcessingRoute && (
                <div className="static" ref={dropdownRef} onMouseEnter={handleDropdownEnter} onMouseLeave={handleDropdownLeave}>
                  <button
                    onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                    className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-300 py-2 px-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/5"
                  >
                    Tools
                    <svg className={`w-4 h-4 transition-transform duration-300 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Mega Menu Dropdown */}
                  {isToolsDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 max-h-[calc(100vh-120px)] overflow-y-auto mega-menu-glass rounded-3xl shadow-2xl shadow-gray-300/40 border border-white/40 p-6 z-50 animate-fade-in-down">
                      <div className="grid grid-cols-3 lg:grid-cols-4 gap-5">
                        {toolCategories.map((category, idx) => (
                          <div key={idx}>
                            <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-gray-100">
                              <span className="text-base">{category.icon}</span>
                              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{category.name}</h3>
                            </div>
                            <ul className="space-y-0.5">
                              {category.tools.map((tool, toolIdx) => (
                                <li key={toolIdx}>
                                  <Link
                                    to={tool.path}
                                    className="block text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gradient-to-r hover:from-primary-50/80 hover:to-blue-50/80 dark:hover:from-primary-900/20 dark:hover:to-blue-900/20 px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:translate-x-1"
                                    onClick={() => setIsToolsDropdownOpen(false)}
                                  >
                                    {tool.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                <Link
                  to="/privacy"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-300 py-2 px-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/5"
                >
                  Privacy
                </Link>

                <ThemeToggle />

                {isFileProcessingRoute && <ModeToggle />}

                {/* Auth state */}
                <AuthStatus />
              </div>
            </div>

            {/* Mobile Auth & Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <MobileNavAuth onNav={() => setIsMenuOpen(false)} />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2.5 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl hover:bg-white/60 dark:hover:bg-white/5 backdrop-blur-sm hover:shadow-lg transition-all duration-300 nav-button-glass"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/20 max-h-[calc(100vh-64px)] overflow-y-auto animate-fade-in-down mobile-menu-glass">
              <div className="space-y-4 pb-4">
                {/* Theme & Mode Toggles for Mobile */}
                <div className="px-4 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Appearance</span>
                  <ThemeToggle />
                </div>

                {isFileProcessingRoute && (
                  <div className="px-4 py-4 border-b border-gray-100 dark:border-white/5">
                    <ModeToggle />
                  </div>
                )}

                {/* Account Settings - Moved Top */}
                <div className="px-4 pb-4 border-b border-gray-100 dark:border-white/5">
                  <AuthStatus isMobile={true} onNav={() => setIsMenuOpen(false)} />
                </div>

                {isFileProcessingRoute && toolCategories.map((category, idx) => (
                  <div key={idx} className="px-4">
                    <div className="flex items-center gap-2 mb-2 font-semibold text-gray-900">
                      <span>{category.icon}</span>
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {category.tools.map((tool, toolIdx) => (
                        <li key={toolIdx}>
                          <Link
                            to={tool.path}
                            className="block text-sm text-gray-600 hover:text-primary-600 py-1.5 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {tool.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-100 px-4 space-y-2">
                  <Link
                    to="/privacy"
                    className="block text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Privacy
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<ServicesHome />} />
          <Route path="/compiler" element={<CompilerHome />} />
          <Route path="/tools" element={<Home />} />
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300 mt-auto relative overflow-hidden">
        {/* Subtle gradient decoration */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <span className="text-white font-bold text-xl">U</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  U<span className="text-primary-400">ver</span>o
                </span>
              </div>
              <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
                Professional digital tools designed for simplicity, speed, and privacy.
                Privacy-first file processing that works offline, plus secure cloud-powered services like PhotoDrop.
              </p>
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl w-fit">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-400 font-semibold text-sm">100% Private & Secure</span>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Services</h3>
              <ul className="space-y-2.5">
                {[
                  { name: 'File Processing', path: '/tools' },
                  { name: 'Online Compiler', path: '/compiler' },
                  { name: 'PhotoDrop', path: '/photodrop' },
                  { name: 'Online Clipboard', path: '/clipboard' },
                  { name: 'PaySplit – Split Expenses', path: '/split-expense' },
                  { name: 'Uvero CLI', path: '/cli' },
                  { name: 'Privacy Focus', path: '/privacy' },
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link to={link.path} className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800/60 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 Uvero. All rights reserved. Built with ❤️ for privacy.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-gray-500 hover:text-primary-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-primary-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
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
      <ModeProvider>
        <AppContent />
      </ModeProvider>
    </Router>
  );
}

export default App;

function AuthStatus({ isMobile = false, onNav = () => { } }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const res = await signOut()
      if (res?.error) throw res.error
      // navigate home and show a brief message
      navigate('/', { replace: true })
      onNav()
      window.alert('Signed out successfully')
    } catch (err) {
      window.alert('Sign out failed: ' + (err?.message || err))
    } finally {
      setSigningOut(false)
    }
  }

  if (!user) {
    if (isMobile) {
      return (
        <div className="flex flex-col gap-3 w-full">
          <Link to="/login" onClick={onNav} className="block w-full text-center text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 py-2.5 rounded-xl font-medium">Sign in</Link>
          <Link to="/signup" onClick={onNav} className="block w-full text-center btn-primary py-2.5 rounded-xl">Sign up</Link>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-3">
        <Link to="/login" className="text-sm text-gray-700 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">Sign in</Link>
        <Link to="/signup" className="btn-primary text-sm py-2 px-4">Sign up</Link>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 w-full bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
        <Link to="/profile" onClick={onNav} className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          {user.email}
        </Link>
        <button onClick={handleSignOut} disabled={signingOut} className="block w-full text-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white py-2 font-medium">
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link to="/profile" className="text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium">{user.email}</Link>
      <button onClick={handleSignOut} disabled={signingOut} className="text-sm text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
        {signingOut ? 'Signing out...' : 'Sign out'}
      </button>
    </div>
  )
}

function MobileNavAuth({ onNav }) {
  const { user } = useAuth()

  if (!user) {
    return (
      <Link
        to="/login"
        onClick={onNav}
        className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-xl transition-colors shadow-sm"
      >
        Sign in
      </Link>
    )
  }

  const initial = user.email ? user.email.charAt(0).toUpperCase() : 'U'

  return (
    <Link
      to="/profile"
      onClick={onNav}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold border border-primary-200 dark:border-primary-800/50 shadow-sm"
    >
      {initial}
    </Link>
  )
}
