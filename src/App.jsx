import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ModeProvider } from './features/file-processing/context/ModeContext';
import ModeToggle from './features/file-processing/components/ModeToggle';
import ThemeToggle from './components/ThemeToggle';
import BrandLogo from './components/BrandLogo';
import ServicesHome from './pages/ServicesHome';
import CompilerHome from './features/compiler/pages/CompilerHome';
import Home from './features/file-processing/pages/Home';
import ToolPage from './features/file-processing/pages/ToolPage';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
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

  // Helper to get feature name based on path
  const getFeatureName = () => {
    const path = location.pathname;
    if (path === '/') return null;
    if (path.startsWith('/compiler')) return 'Online Compiler';
    if (path.startsWith('/tools')) return 'File Processing';
    if (path.startsWith('/photodrop')) return 'PhotoDrop';
    if (path.startsWith('/clipboard') || path.startsWith('/c/')) return 'Online Clipboard';
    if (path.startsWith('/split-expense')) return 'PaySplit';
    if (path.startsWith('/qr-tools') || path.startsWith('/qr/')) return 'QR Tools';
    if (path.startsWith('/privacy')) return 'Privacy';
    if (path.startsWith('/cli')) return 'CLI';
    if (path.startsWith('/login')) return 'Sign In';
    if (path.startsWith('/signup')) return 'Sign Up';
    if (path.startsWith('/profile')) return 'Profile';

    // Check if it's a specific tool
    const tool = getToolById(path.slice(1));
    if (tool) return tool.name;

    return null;
  };

  const currentFeature = getFeatureName();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <BrandLogo iconClassName="w-10 h-10 sm:w-11 sm:h-11" textClassName="text-2xl sm:text-[26px]" />
              {currentFeature && (
                <div className="flex items-center">
                  <span className="mx-2 text-gray-300 dark:text-gray-700 hidden sm:block">/</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
                    {currentFeature}
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {/* Tools Dropdown */}
              {isFileProcessingRoute && (
                <div className="relative" ref={dropdownRef} onMouseEnter={handleDropdownEnter} onMouseLeave={handleDropdownLeave}>
                  <button
                    onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                    className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Tools
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isToolsDropdownOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[720px] max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-5 z-50">
                      <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
                        {toolCategories.map((category, idx) => (
                          <div key={idx}>
                            <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-800">
                              <span className="text-sm">{category.icon}</span>
                              <h3 className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wide">{category.name}</h3>
                            </div>
                            <ul className="space-y-0.5">
                              {category.tools.map((tool, toolIdx) => (
                                <li key={toolIdx}>
                                  <Link
                                    to={tool.path}
                                    className="block text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1.5 rounded-md transition-colors"
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

              <Link
                to="/privacy"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Privacy
              </Link>

              <Link
                to="/contact"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Contact
              </Link>

              <div className="ml-2 flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                <ThemeToggle />
                {isFileProcessingRoute && <ModeToggle />}
                <AuthStatus />
              </div>
            </div>

            {/* Mobile Auth & Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <MobileNavAuth onNav={() => setIsMenuOpen(false)} />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 max-h-[calc(100vh-56px)] overflow-y-auto">
            <div className="px-4 py-4 space-y-4">
              {/* Theme & Mode Toggles for Mobile */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Appearance</span>
                <ThemeToggle />
              </div>

              {isFileProcessingRoute && (
                <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
                  <ModeToggle />
                </div>
              )}

              <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <AuthStatus isMobile={true} onNav={() => setIsMenuOpen(false)} />
              </div>

              {isFileProcessingRoute && toolCategories.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-1.5 font-semibold text-gray-900 dark:text-gray-100">
                    <span>{category.icon}</span>
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <ul className="space-y-0.5 ml-6">
                    {category.tools.map((tool, toolIdx) => (
                      <li key={toolIdx}>
                        <Link
                          to={tool.path}
                          className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 py-1.5 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {tool.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <Link
                  to="/privacy"
                  className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Privacy
                </Link>
                <Link
                  to="/contact"
                  className="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        )}
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
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 mt-auto border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BrandLogo showText colorClassName="text-white" textClassName="text-2xl sm:text-[26px]" iconClassName="w-10 h-10 sm:w-11 sm:h-11" />
              </div>
              <p className="text-gray-400 max-w-sm mb-4 text-sm leading-relaxed">
                Professional digital tools for simplicity, speed, and privacy.
                Privacy-first file processing that works offline.
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 border border-green-800/50 rounded-md text-green-400 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                100% Private &amp; Secure
              </span>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm">Services</h3>
              <ul className="space-y-2">
                {[
                  { name: 'File Processing', path: '/tools' },
                  { name: 'Online Compiler', path: '/compiler' },
                  { name: 'PhotoDrop', path: '/photodrop' },
                  { name: 'Online Clipboard', path: '/clipboard' },
                  { name: 'PaySplit – Split Expenses', path: '/split-expense' },
                  { name: 'Uvero CLI', path: '/cli' },
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link to={link.path} className="text-gray-400 hover:text-gray-200 transition-colors text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-gray-200 transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-gray-200 transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-gray-200 transition-colors text-sm">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-500 text-sm">
              © 2026 Uvero. All rights reserved.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors" aria-label="GitHub">
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
  const [needsUsernameSetup, setNeedsUsernameSetup] = useState(false)

  useEffect(() => {
    function syncUsernameSetupFlag() {
      try {
        setNeedsUsernameSetup(window.localStorage.getItem('uvero_username_setup_required') === '1')
      } catch {
        setNeedsUsernameSetup(false)
      }
    }

    syncUsernameSetupFlag()
    window.addEventListener('storage', syncUsernameSetupFlag)
    window.addEventListener('uvero-username-setup-changed', syncUsernameSetupFlag)

    return () => {
      window.removeEventListener('storage', syncUsernameSetupFlag)
      window.removeEventListener('uvero-username-setup-changed', syncUsernameSetupFlag)
    }
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const res = await signOut()
      if (res?.error) throw res.error
      try {
        window.localStorage.removeItem('uvero_username_setup_required')
        window.dispatchEvent(new Event('uvero-username-setup-changed'))
      } catch {
        // ignore
      }
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
        {needsUsernameSetup && (
          <Link
            to="/profile"
            onClick={onNav}
            className="inline-flex items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
          >
            Finish username setup
          </Link>
        )}
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
      {needsUsernameSetup && (
        <Link
          to="/profile"
          className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
        >
          Set username
        </Link>
      )}
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
