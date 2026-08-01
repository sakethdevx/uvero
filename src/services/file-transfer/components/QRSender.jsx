import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { AIInlinePanel } from '../../../components/AIServiceLayout';
import { WebRTCSenderManager } from '../lib/webrtcEngine';

/**
 * QRSender — Streamlined Pure WebRTC Sender Component
 * Matches official Uvero UI design language with glass-panel styling and light/dark theme support.
 */
export default function QRSender({ fileData, fileName, fileType, onReset }) {
  const canvasRef = useRef(null);

  const [pairingCode, setPairingCode] = useState('');
  const [status, setStatus] = useState('initializing'); // 'initializing', 'ready', 'connected', 'complete', 'error'
  const [progressRatio, setProgressRatio] = useState(0);
  const [transferredBytes, setTransferredBytes] = useState(0);
  const [transferSpeedMbps, setTransferSpeedMbps] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const senderManagerRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const lastBytesRef = useRef(0);

  useEffect(() => {
    if (!fileData) return;

    let isMounted = true;

    const manager = new WebRTCSenderManager(
      fileData,
      fileName,
      fileType,
      (code) => {
        if (!isMounted) return;
        setPairingCode(code);
        setStatus('ready');

        // Render static pairing QR code
        if (canvasRef.current && code) {
          const pairingUrl = `${window.location.origin}/file-transfer?code=${code}`;
          QRCode.toCanvas(canvasRef.current, pairingUrl, {
            margin: 2,
            width: 260,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
        }
      },
      () => {
        if (!isMounted) return;
        setStatus('connected');
        lastTimeRef.current = performance.now();
        lastBytesRef.current = 0;
      },
      (progress, offset, total) => {
        if (!isMounted) return;
        setProgressRatio(progress);
        setTransferredBytes(offset);

        const now = performance.now();
        const timeDiff = (now - lastTimeRef.current) / 1000;
        if (timeDiff >= 0.3) {
          const bytesDiff = offset - lastBytesRef.current;
          const mbps = (bytesDiff / (1024 * 1024)) / timeDiff;
          setTransferSpeedMbps(mbps.toFixed(1));
          lastTimeRef.current = now;
          lastBytesRef.current = offset;
        }
      },
      () => {
        if (!isMounted) return;
        setStatus('complete');
      },
      (err) => {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err);
      }
    );

    senderManagerRef.current = manager;

    return () => {
      isMounted = false;
      if (senderManagerRef.current) senderManagerRef.current.close();
    };
  }, [fileData, fileName, fileType]);

  const formattedCode = pairingCode ? `${pairingCode.slice(0, 3)} ${pairingCode.slice(3)}` : '...';

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* File Info Bar & Connection Status Card */}
      <AIInlinePanel className="p-4 sm:p-6 space-y-5">
        {/* Top File Header Bar */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-200/80 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-500 font-bold border border-cyan-500/20 shrink-0">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[320px]">
                {fileName}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                {(fileData.byteLength / (1024 * 1024)).toFixed(2)} MB • WebRTC Direct P2P
              </p>
            </div>
          </div>

          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-medium rounded-xl transition-all border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 shrink-0"
          >
            Change File
          </button>
        </div>

        {/* Dynamic Status / QR Code Body */}
        {status === 'complete' ? (
          <div className="space-y-3 py-4 text-center animate-state-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Transfer Complete!</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              File delivered losslessly over WebRTC P2P DataChannel.
            </p>
          </div>
        ) : status === 'connected' ? (
          <div className="space-y-4 w-full py-2 text-center">
            <div className="w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center mx-auto animate-pulse">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Transferring File...</h3>
              <p className="text-xs font-mono text-cyan-500 mt-0.5">{transferSpeedMbps} MB/s Direct Socket Speed</p>
            </div>

            <div className="w-full bg-gray-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-200"
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>

            <div className="flex justify-between text-xs font-mono text-gray-500">
              <span>{(transferredBytes / (1024 * 1024)).toFixed(2)} MB</span>
              <span>{Math.round(progressRatio * 100)}%</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-1">
            {/* Left Side: Pairing Code Info */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-500">Pairing Code</span>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-gray-900 dark:text-white mt-1">
                  {formattedCode}
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto sm:mx-0">
                Scan the QR code with your mobile phone camera or enter the 6-digit pairing code on the receiving device to start instant WebRTC transfer.
              </p>
            </div>

            {/* Right Side: QR Code Canvas */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative bg-white p-2.5 rounded-2xl shadow-md border border-gray-200 dark:border-white/10">
                <canvas ref={canvasRef} className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl" />
              </div>
            </div>
          </div>
        )}
      </AIInlinePanel>
    </div>
  );
}
