import React, { useState } from 'react';
import useSEO from '../../../hooks/useSEO';
import { AIServiceShell, CompactServiceHeader, AIBackLink, AIInlinePanel } from '../../../components/AIServiceLayout';
import QRSender from '../components/QRSender';
import QRReceiver from '../components/QRReceiver';

/**
 * FileTransfer — Pure WebRTC P2P Direct File Transfer Page
 * Matches standard Uvero max-w-7xl page width.
 */
export default function FileTransfer() {
  const [activeTab, setActiveTab] = useState('send'); // 'send' | 'receive'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState('');

  useSEO({
    title: 'File Transfer — Instant P2P Share | Uvero',
    description: 'Direct browser-to-browser WebRTC file transfer. Send large files instantly with 6-digit PIN code or QR scan. Zero server storage.',
    keywords: ['file transfer', 'P2P share', 'WebRTC transfer', 'browser file share', 'Uvero tools'],
  });

  const loadFiles = (files) => {
    const fileList = Array.from(files || []);
    if (!fileList.length) return;
    setFileError('');

    Promise.all(
      fileList.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result,
        });
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsArrayBuffer(file);
      }))
    ).then((loadedFiles) => {
      setSelectedFiles((currentFiles) => {
        const existingKeys = new Set(currentFiles.map((file) => `${file.name}:${file.size}`));
        return [
          ...currentFiles,
          ...loadedFiles.filter((file) => !existingKeys.has(`${file.name}:${file.size}`)),
        ];
      });
    }).catch((error) => {
      setFileError(error.message || 'Failed to read the selected files');
    });
  };

  const handleFileSelect = (e) => {
    loadFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    loadFiles(e.dataTransfer.files);
  };

  const generateSampleText = () => {
    const text = `--- P2P Direct File Transfer Sample Document ---\nGenerated: ${new Date().toISOString()}\n\nThis is a sample document testing lossless WebRTC P2P direct socket file transfer.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], 'sample_demo.txt', { type: 'text/plain' });

    loadFiles([file]);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setFileError('');
  };

  const handleRemoveFile = (fileIndex) => {
    setSelectedFiles((currentFiles) => currentFiles.filter((_, index) => index !== fileIndex));
  };

  return (
    <AIServiceShell maxWidth="max-w-7xl">
      <div className="mb-2">
        <AIBackLink to="/">Home</AIBackLink>
      </div>

      <CompactServiceHeader
        eyebrow="Direct P2P Transfer"
        title="File Transfer"
        description="Instant browser-to-browser file sharing. High-speed direct socket connection with zero server storage."
        className="mb-4"
        meta={
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold">
            WebRTC P2P
          </span>
        }
      />

      {/* Send / Receive Tab Navigation */}
      <div className="flex justify-center mb-4 sm:mb-5">
        <div className="glass-panel p-1 rounded-2xl inline-flex gap-1 border border-gray-200 dark:border-white/10 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'send'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Send File</span>
          </button>

          <button
            onClick={() => setActiveTab('receive')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'receive'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Receive File</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'send' ? (
        !selectedFiles.length ? (
          <AIInlinePanel className="max-w-2xl mx-auto space-y-4 text-center">
            {fileError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
                {fileError}
              </div>
            )}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="relative group p-8 sm:p-12 rounded-3xl border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 transition-all flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 dark:bg-white/5"
            >
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Drop your files here or <span className="text-cyan-500">browse</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Supports any file format (Documents, Images, Archives, Videos, Audio) up to 2 GB
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={generateSampleText}
                className="text-xs text-cyan-500 hover:text-cyan-600 font-semibold underline underline-offset-4"
              >
                Generate test sample file
              </button>
            </div>
          </AIInlinePanel>
        ) : (
          <QRSender
            files={selectedFiles}
            onReset={handleReset}
            onAddFiles={loadFiles}
            onRemoveFile={handleRemoveFile}
          />
        )
      ) : (
        <QRReceiver />
      )}
    </AIServiceShell>
  );
}
