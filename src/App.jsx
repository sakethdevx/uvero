import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ModeProvider } from './context/ModeContext';
import ModeToggle from './components/ModeToggle';
import Home from './pages/Home';
import ToolPage from './pages/ToolPage';
import Privacy from './pages/Privacy';

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsToolsDropdownOpen(false);
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
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'glass shadow-lg shadow-gray-200/50' : 'bg-white/95 backdrop-blur-sm border-b border-gray-100'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Uve<span className="gradient-text">ro</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-5">
              {/* Tools Dropdown */}
              <div className="static" ref={dropdownRef} onMouseEnter={handleDropdownEnter} onMouseLeave={handleDropdownLeave}>
                <button
                  onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-primary-600 font-medium transition-colors py-2 px-3 rounded-lg hover:bg-primary-50/50"
                >
                  Tools
                  <svg className={`w-4 h-4 transition-transform duration-200 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mega Menu Dropdown */}
                {isToolsDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-[calc(100vh-120px)] overflow-y-auto bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-5 z-50 animate-fade-in-down">
                    <div className="grid grid-cols-3 lg:grid-cols-4 gap-5">
                      {toolCategories.map((category, idx) => (
                        <div key={idx}>
                          <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-gray-100">
                            <span className="text-base">{category.icon}</span>
                            <h3 className="font-semibold text-sm text-gray-900">{category.name}</h3>
                          </div>
                          <ul className="space-y-0.5">
                            {category.tools.map((tool, toolIdx) => (
                              <li key={toolIdx}>
                                <Link
                                  to={tool.path}
                                  className="block text-xs text-gray-600 hover:text-primary-600 hover:bg-primary-50 px-2.5 py-1.5 rounded-lg transition-all duration-150"
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

              {/* Mode Toggle */}
              <ModeToggle />

              <Link
                to="/privacy"
                className="text-gray-600 hover:text-primary-600 font-medium transition-colors py-2 px-3 rounded-lg hover:bg-primary-50/50"
              >
                Privacy
              </Link>
              <a
                href="/#tools"
                className="btn-primary text-sm !py-2.5 !px-5"
              >
                Get Started
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
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

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 max-h-[calc(100vh-64px)] overflow-y-auto animate-fade-in-down">
              <div className="space-y-4 pb-4">
                {/* Mode Toggle for Mobile */}
                <div className="px-4 pb-4 border-b border-gray-100">
                  <ModeToggle />
                </div>

                {toolCategories.map((category, idx) => (
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
                    className="block text-gray-600 hover:text-primary-600 font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Privacy
                  </Link>
                  <a
                    href="/#tools"
                    className="btn-primary text-sm w-full text-center block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </a>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:toolId" element={<ToolPage />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300 mt-auto relative overflow-hidden">
        {/* Subtle gradient decoration */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <span className="text-white font-bold text-xl">U</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  Uve<span className="text-primary-400">ro</span>
                </span>
              </div>
              <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
                Professional file processing tools that run entirely in your browser.
                No uploads, no data collection, completely free.
              </p>
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl w-fit">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-400 font-semibold text-sm">100% Private & Secure</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Popular Tools</h3>
              <ul className="space-y-2.5">
                {[
                  { name: 'Image Compressor', path: '/compress-image' },
                  { name: 'PDF Compressor', path: '/compress-pdf' },
                  { name: 'Image Converter', path: '/convert-image' },
                  { name: 'QR Generator', path: '/qr-generator' },
                  { name: 'PDF Merger', path: '/merge-pdf' },
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
  return (
    <Router>
      <ModeProvider>
        <AppContent />
      </ModeProvider>
    </Router>
  );
}

export default App;
