import React, { useState, useCallback } from 'react';
import QRSender from '../components/QRSender';
import QRReceiver from '../components/QRReceiver';

/**
 * AirPulseTransfer — Main Page for AirPulse Optical Share Service
 */
export default function AirPulseTransfer() {
  const [activeTab, setActiveTab] = useState('send');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const processFile = useCallback((rawFile) => {
    if (!rawFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      setFile({
        name: rawFile.name,
        type: rawFile.type || 'application/octet-stream',
        size: rawFile.size,
        data: new Uint8Array(buffer),
      });
    };
    reader.readAsArrayBuffer(rawFile);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const generateSamplePayload = () => {
    const text = `AirPulse Optical Transfer Test Payload\n------------------------------------\nTime: ${new Date().toISOString()}\nStatus: Verified Lossless Optical Beam\nEncryption & Verification: Luby Transform Fountain Engine\n\nThank you for testing AirPulse Optical Share on Uvero!`;
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    setFile({
      name: 'airpulse_sample_demo.txt',
      type: 'text/plain',
      size: data.length,
      data,
    });
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-xs font-semibold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Zero Cables • Zero Wi-Fi • 60 FPS Optical</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          AirPulse <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Optical Share</span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm text-gray-600 dark:text-gray-400">
          Transfer files between phones and laptops without Wi-Fi, Bluetooth, or cables using high-speed animated QR beams & fountain code recovery.
        </p>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex justify-center">
        <div className="glass-panel p-1.5 rounded-2xl inline-flex gap-1.5 border border-gray-200 dark:border-white/10 shadow-lg">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'send'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Send File</span>
          </button>

          <button
            onClick={() => setActiveTab('receive')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'receive'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Receive File</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'send' ? (
        file ? (
          <QRSender
            fileData={file.data}
            fileName={file.name}
            fileType={file.type}
            onReset={() => setFile(null)}
          />
        ) : (
          <div className="max-w-xl mx-auto space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`glass-panel p-10 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-4 cursor-pointer ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-500/10 scale-105'
                  : 'border-gray-300 dark:border-white/15 hover:border-cyan-500/50 hover:bg-gray-50/50 dark:hover:bg-white/5'
              }`}
            >
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20 shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Choose or Drop a File to Beam</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Supports images, documents, code, zip files, or binary payloads.
                </p>
              </div>

              <input
                type="file"
                id="airpulse-file-input"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <label
                  htmlFor="airpulse-file-input"
                  className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  Browse Local Files
                </label>

                <button
                  type="button"
                  onClick={generateSamplePayload}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-semibold text-xs transition-all"
                >
                  ⚡ Try Demo File
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        <QRReceiver onReset={() => setActiveTab('send')} />
      )}

      {/* Overview Footer */}
      <div className="glass-panel p-6 rounded-3xl border border-gray-200 dark:border-white/10 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>How AirPulse Works</span>
          </div>

          <button
            onClick={() => setShowInfoModal(prev => !prev)}
            className="text-xs font-semibold text-cyan-500 hover:underline"
          >
            {showInfoModal ? 'Hide Details' : 'Learn More'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 space-y-1">
            <div className="font-bold text-gray-900 dark:text-white">100% Offline & Private</div>
            <div className="text-gray-500 dark:text-gray-400">Zero network required. Data streams straight screen-to-camera with zero server involvement.</div>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 space-y-1">
            <div className="font-bold text-gray-900 dark:text-white">Fountain Code Resiliency</div>
            <div className="text-gray-500 dark:text-gray-400">Uses Luby Transform equations so missing 50%+ of scanned frames does not block reconstruction.</div>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 space-y-1">
            <div className="font-bold text-gray-900 dark:text-white">Up to 60 FPS Stream</div>
            <div className="text-gray-500 dark:text-gray-400">Direct HTML5 Canvas rendering engine tuned for high refresh rate mobile displays and cameras.</div>
          </div>
        </div>

        {showInfoModal && (
          <div className="pt-4 border-t border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed animate-fade-in">
            <p>
              <strong>AirPulse</strong> decomposes your file into linear XOR source blocks. Instead of requiring frames in a strict sequential order, the sender generates a mathematical fountain of pseudo-random droplets.
            </p>
            <p>
              When your camera scans any droplet, the receiver’s Gaussian reduction engine dynamically updates its linear equation matrix. The moment the receiver collects enough linearly independent droplets, the file is reassembled with complete CRC-32 integrity verification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
