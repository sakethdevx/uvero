import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import { ModeProvider, useMode } from './context/ModeContext';
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
        { name: 'JPG to PDF', path: '/jpg-to-pdf', upcoming: true },
        { name: 'PDF to JPG', path: '/pdf-to-jpg', upcoming: true },
        { name: 'HEIC to JPG', path: '/heic-to-jpg', upcoming: true }
      ]
    },
    {
      name: 'PDF Tools',
      icon: '📄',
      tools: [
        { name: 'PDF Compressor', path: '/compress-pdf' },
        { name: 'PDF to Image', path: '/convert-pdf' },
        { name: 'PDF Merger', path: '/merge-pdf' },
        { name: 'PDF Splitter', path: '/split-pdf' },
        { name: 'Word to PDF', path: '/word-to-pdf' },
        { name: 'PowerPoint to PDF', path: '/powerpoint-to-pdf', upcoming: true },
        { name: 'Excel to PDF', path: '/excel-to-pdf', upcoming: true },
        { name: 'HTML to PDF', path: '/html-to-pdf', upcoming: true },
        { name: 'PDF to Word', path: '/pdf-to-word', upcoming: true },
        { name: 'PDF to PowerPoint', path: '/pdf-to-powerpoint', upcoming: true },
        { name: 'PDF to Excel', path: '/pdf-to-excel', upcoming: true },
        { name: 'PDF to PDF/A', path: '/pdf-to-pdfa', upcoming: true }
      ]
    },
    {
      name: 'Audio Tools',
      icon: '🎵',
      tools: [
        { name: 'Audio Compressor', path: '/compress-audio' },
        { name: 'Audio Converter', path: '/convert-audio' },
        { name: 'MP3 Converter', path: '/mp3-converter', upcoming: true },
        { name: 'MP4 to MP3', path: '/mp4-to-mp3', upcoming: true },
        { name: 'Video to MP3', path: '/video-to-mp3', upcoming: true }
      ]
    },
    {
      name: 'Video Tools',
      icon: '🎬',
      tools: [
        { name: 'Video Compressor', path: '/compress-video' },
        { name: 'Video Converter', path: '/convert-video' },
        { name: 'MP4 Converter', path: '/mp4-converter', upcoming: true },
        { name: 'Video to GIF', path: '/video-to-gif', upcoming: true },
        { name: 'MOV to MP4', path: '/mov-to-mp4', upcoming: true }
      ]
    },
    {
      name: 'Document & Ebook',
      icon: '📚',
      tools: [
        { name: 'EPUB to PDF', path: '/epub-to-pdf', upcoming: true },
        { name: 'EPUB to MOBI', path: '/epub-to-mobi', upcoming: true },
        { name: 'Document Converter', path: '/document-converter', upcoming: true }
      ]
    },
    {
      name: 'Archive Tools',
      icon: '🗜️',
      tools: [
        { name: 'RAR to Zip', path: '/rar-to-zip', upcoming: true },
        { name: 'Archive Converter', path: '/archive-converter', upcoming: true }
      ]
    },
    {
      name: 'Time Zone',
      icon: '🌍',
      tools: [
        { name: 'PST to EST', path: '/pst-to-est', upcoming: true },
        { name: 'CST to EST', path: '/cst-to-est', upcoming: true },
        { name: 'Time Zone Converter', path: '/timezone-converter', upcoming: true }
      ]
    },
    {
      name: 'Unit Converter',
      icon: '📏',
      tools: [
        { name: 'Lbs to Kg', path: '/lbs-to-kg', upcoming: true },
        { name: 'Kg to Lbs', path: '/kg-to-lbs', upcoming: true },
        { name: 'Feet to Meters', path: '/feet-to-meters', upcoming: true },
        { name: 'Unit Converter', path: '/unit-converter', upcoming: true }
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                File<span className="text-primary-600">Next</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {/* Tools Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                  onMouseEnter={() => setIsToolsDropdownOpen(true)}
                  className="flex items-center gap-1 text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                  Tools
                  <svg className={`w-4 h-4 transition-transform ${isToolsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isToolsDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-[800px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-120px)] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50"
                    style={{ transform: 'translateX(max(calc(-50% + 50px), calc(-100vw + 100% + 1rem)))' }}
                    onMouseLeave={() => setIsToolsDropdownOpen(false)}
                  >
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                      {toolCategories.map((category, idx) => (
                        <div key={idx}>
                          <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-gray-100">
                            <span className="text-lg">{category.icon}</span>
                            <h3 className="font-semibold text-sm text-gray-900">{category.name}</h3>
                          </div>
                          <ul className="space-y-1">
                            {category.tools.map((tool, toolIdx) => (
                              <li key={toolIdx}>
                                <Link
                                  to={tool.path}
                                  className="block text-xs text-gray-600 hover:text-primary-600 hover:bg-primary-50 px-2 py-1.5 rounded-lg transition-all"
                                  onClick={() => setIsToolsDropdownOpen(false)}
                                >
                                  <span className="flex items-center justify-between gap-1">
                                    <span className="truncate">{tool.name}</span>
                                    {tool.upcoming && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full font-semibold whitespace-nowrap">
                                        Soon
                                      </span>
                                    )}
                                  </span>
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
                className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/compress-image"
                className="btn-primary text-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-primary-600"
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
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-4">
                {/* Mode Toggle for Mobile */}
                <div className="px-4 pb-4 border-b border-gray-200">
                  <ModeToggle />
                </div>

                {toolCategories.map((category, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-2 mb-2 font-semibold text-gray-900">
                      <span>{category.icon}</span>
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {category.tools.map((tool, toolIdx) => (
                        <li key={toolIdx}>
                          <Link
                            to={tool.path}
                            className="block text-sm text-gray-600 hover:text-primary-600 py-1"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {tool.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/privacy"
                    className="block text-gray-600 hover:text-primary-600 font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Privacy
                  </Link>
                  <Link
                    to="/compress-image"
                    className="btn-primary text-sm w-full mt-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
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
          <Route path="/" element={<Home />} />
          <Route path="/:toolId" element={<ToolPage />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  File<span className="text-primary-400">Next</span>
                </span>
              </div>
              <p className="text-gray-400 max-w-md mb-4">
                Professional file processing tools that run entirely in your browser.
                No uploads, no data collection, completely free.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-400 font-semibold">100% Private & Secure</span>
              </div>
            </div>

            {/* Tools */}
            <div>
              <h3 className="text-white font-semibold mb-4">Tools</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/compress-image" className="hover:text-primary-400 transition-colors">
                    Image Compressor
                  </Link>
                </li>
                <li>
                  <Link to="/convert-image" className="hover:text-primary-400 transition-colors">
                    Image Converter
                  </Link>
                </li>
                <li>
                  <Link to="/image-to-pdf" className="hover:text-primary-400 transition-colors">
                    Image to PDF
                  </Link>
                </li>
                <li>
                  <Link to="/resize-image" className="hover:text-primary-400 transition-colors">
                    Image Resizer
                  </Link>
                </li>
                <li>
                  <Link to="/gif-maker" className="hover:text-primary-400 transition-colors">
                    GIF Maker
                  </Link>
                </li>
                <li>
                  <Link to="/watermark" className="hover:text-primary-400 transition-colors">
                    Add Watermark
                  </Link>
                </li>
                <li>
                  <Link to="/crop-image" className="hover:text-primary-400 transition-colors">
                    Image Cropper
                  </Link>
                </li>
                <li>
                  <Link to="/remove-background" className="hover:text-primary-400 transition-colors">
                    Background Remover
                  </Link>
                </li>
                <li>
                  <Link to="/compress-pdf" className="hover:text-primary-400 transition-colors">
                    PDF Compressor
                  </Link>
                </li>
                <li>
                  <Link to="/convert-pdf" className="hover:text-primary-400 transition-colors">
                    PDF to Image
                  </Link>
                </li>
                <li>
                  <Link to="/merge-pdf" className="hover:text-primary-400 transition-colors">
                    PDF Merger
                  </Link>
                </li>
                <li>
                  <Link to="/split-pdf" className="hover:text-primary-400 transition-colors">
                    PDF Splitter
                  </Link>
                </li>
                <li>
                  <Link to="/word-to-pdf" className="hover:text-primary-400 transition-colors">
                    Word to PDF
                  </Link>
                </li>
                <li>
                  <Link to="/compress-audio" className="hover:text-primary-400 transition-colors">
                    Audio Compressor
                  </Link>
                </li>
                <li>
                  <Link to="/convert-audio" className="hover:text-primary-400 transition-colors">
                    Audio Converter
                  </Link>
                </li>
                <li>
                  <Link to="/compress-video" className="hover:text-primary-400 transition-colors">
                    Video Compressor
                  </Link>
                </li>
                <li>
                  <Link to="/convert-video" className="hover:text-primary-400 transition-colors">
                    Video Converter
                  </Link>
                </li>
                <li>
                  <Link to="/qr-generator" className="hover:text-primary-400 transition-colors">
                    QR Code Generator
                  </Link>
                </li>
                <li>
                  <Link to="/password-generator" className="hover:text-primary-400 transition-colors">
                    Password Generator
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="hover:text-primary-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-primary-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2026 FileNext. All rights reserved. Built with ❤️ for privacy.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-gray-400 hover:text-primary-400 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary-400 transition-colors"
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
