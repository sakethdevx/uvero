import React, { useState } from 'react';
import QRSender from '../components/QRSender';
import QRReceiver from '../components/QRReceiver';

/**
 * AirPulseTransfer — Pure WebRTC P2P Direct Transfer Page
 * Instant 50-100 MB/s file transfers with 0 screen flashing and 0 eye strain.
 */
export default function AirPulseTransfer() {
  const [activeTab, setActiveTab] = useState('send'); // 'send' | 'receive'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setFileData(evt.target.result);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setFileData(evt.target.result);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const generateSampleText = () => {
    const text = `--- AirPulse WebRTC Direct Share Sample Document ---\nGenerated: ${new Date().toISOString()}\n\nThis is a sample document testing lossless WebRTC P2P direct socket file transfer.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], 'airpulse_sample_demo.txt', { type: 'text/plain' });

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setFileData(evt.target.result);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileData(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AirPulse WebRTC P2P Share</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
            Instant Peer-to-Peer File Transfer
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Direct browser-to-browser WebRTC socket transfer. 50-100 MB/s speed, zero server storage, zero eye strain.
          </p>
        </div>

        {/* Send / Receive Tab Switcher */}
        <div className="flex justify-center">
          <div className="glass-panel p-1 rounded-2xl inline-flex gap-1 border border-white/10 text-sm">
            <button
              onClick={() => setActiveTab('send')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'send'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Send File</span>
            </button>

            <button
              onClick={() => setActiveTab('receive')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'receive'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Receive File</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'send' ? (
          !selectedFile || !fileData ? (
            <div className="max-w-xl mx-auto space-y-4">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative group p-8 sm:p-12 glass-panel rounded-3xl border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 transition-all flex flex-col items-center justify-center text-center cursor-pointer bg-slate-900/50"
              >
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                <h3 className="text-base font-semibold text-white">
                  Drop your file here or <span className="text-cyan-400">browse</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports any file format (Documents, Images, Archives, Videos, Audio) up to 2 GB
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={generateSampleText}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4"
                >
                  Generate test sample file
                </button>
              </div>
            </div>
          ) : (
            <QRSender
              fileData={fileData}
              fileName={selectedFile.name}
              fileType={selectedFile.type}
              onReset={handleReset}
            />
          )
        ) : (
          <QRReceiver onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
