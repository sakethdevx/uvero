import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { AIInlinePanel } from '../../../components/AIServiceLayout';
import { WebRTCReceiverManager } from '../lib/webrtcEngine';
import AdvancedFilePreview from './AdvancedFilePreview';

/**
 * QRReceiver — Streamlined Pure WebRTC Receiver Component
 * Styled with official Uvero AIInlinePanel design system with enhanced document & image previews.
 */
export default function QRReceiver() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [inputCode, setInputCode] = useState('');
  const [activeMode, setActiveMode] = useState('code'); // 'code' | 'camera'
  const [status, setStatus] = useState('idle'); // 'idle', 'connecting', 'receiving', 'complete', 'error'
  
  const [progressRatio, setProgressRatio] = useState(0);
  const [transferSpeedMbps, setTransferSpeedMbps] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [assembledFiles, setAssembledFiles] = useState([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const receiverManagerRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const lastTimeRef = useRef(0);
  const lastBytesRef = useRef(0);
  const cameraStreamRef = useRef(null);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get('code');
      if (codeParam) {
        setInputCode(codeParam);
        connectWithCode(codeParam);
      }
    } catch {
      // Ignore URL parse error
    }
  }, []);

  const connectWithCode = (codeToUse) => {
    const code = codeToUse || inputCode;
    if (!code || code.trim().length < 6) return;

    stopCamera();
    setStatus('connecting');
    setErrorMessage('');

    try {
      const manager = new WebRTCReceiverManager(
        code,
        () => {
          setStatus('receiving');
          lastTimeRef.current = performance.now();
          lastBytesRef.current = 0;
        },
        (progress, offset) => {
          setProgressRatio(progress);

          const now = performance.now();
          const timeDiff = (now - lastTimeRef.current) / 1000;
          if (timeDiff >= 0.25 && offset >= lastBytesRef.current) {
            const bytesDiff = offset - lastBytesRef.current;
            const mbps = Math.max(0, (bytesDiff / (1024 * 1024)) / timeDiff);
            setTransferSpeedMbps(mbps.toFixed(1));
            lastTimeRef.current = now;
            lastBytesRef.current = offset;
          }
        },
        (fileObj) => {
          setStatus('complete');
          setAssembledFiles(fileObj);
          setSelectedFileIndex(0);
        },
        (err) => {
          setStatus('error');
          setErrorMessage(err || 'WebRTC connection failed');
        }
      );

      receiverManagerRef.current = manager;
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to start receiver');
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  };

  useEffect(() => {
    if (activeMode === 'camera' && status === 'idle') {
      let isMounted = true;
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((mediaStream) => {
          if (!isMounted) {
            mediaStream.getTracks().forEach(t => t.stop());
            return;
          }
          cameraStreamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(() => {});
          }

          const scan = () => {
            if (!isMounted || !videoRef.current || videoRef.current.readyState !== 4) {
              animFrameIdRef.current = requestAnimationFrame(scan);
              return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current || document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code && code.data) {
              try {
                const url = new URL(code.data);
                const codeParam = url.searchParams.get('code');
                if (codeParam) {
                  stopCamera();
                  setInputCode(codeParam);
                  connectWithCode(codeParam);
                  return;
                }
              } catch {
                if (code.data.length === 6 && /^\d+$/.test(code.data)) {
                  stopCamera();
                  setInputCode(code.data);
                  connectWithCode(code.data);
                  return;
                }
              }
            }

            animFrameIdRef.current = requestAnimationFrame(scan);
          };

          animFrameIdRef.current = requestAnimationFrame(scan);
        })
        .catch(() => {});

      return () => {
        isMounted = false;
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [activeMode, status]);

  const handleRestart = () => {
    if (receiverManagerRef.current) receiverManagerRef.current.close();
    stopCamera();
    setStatus('idle');
    setAssembledFiles([]);
    setSelectedFileIndex(0);
    setInputCode('');
    setProgressRatio(0);
    setErrorMessage('');
  };

  const handleDownload = (file) => {
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const totalReceivedSize = assembledFiles.reduce((sum, file) => sum + file.size, 0);
  const selectedFile = assembledFiles[selectedFileIndex] || assembledFiles[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {status === 'complete' && assembledFiles.length ? (
        <AIInlinePanel className="space-y-5 border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-2xl animate-state-in sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-500/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-500">Transfer complete</p>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  {assembledFiles.length} file{assembledFiles.length === 1 ? '' : 's'} received
                </h3>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
              <p className="font-semibold text-gray-700 dark:text-gray-200">{(totalReceivedSize / (1024 * 1024)).toFixed(2)} MB total</p>
              <p>Lossless WebRTC P2P transfer</p>
            </div>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-900 dark:text-white">Received files</p>
                <span className="text-[11px] text-gray-500">{assembledFiles.length} items</span>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {assembledFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className={`flex min-w-0 items-center gap-2 overflow-hidden rounded-xl border p-2 transition ${
                      index === selectedFileIndex
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-gray-200/80 dark:border-white/10'
                    }`}
                  >
                    <button onClick={() => setSelectedFileIndex(index)} className="min-w-0 flex-1 overflow-hidden text-left">
                      <span className="block truncate text-xs font-bold text-gray-900 dark:text-white" title={file.name}>{file.name}</span>
                      <span className="mt-1 block text-[11px] text-gray-500 dark:text-gray-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600"
                      aria-label={`Download ${file.name}`}
                      title={`Download ${file.name}`}
                    >
                      ↓
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => assembledFiles.forEach(handleDownload)}
                className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-400"
              >
                Download all files
              </button>
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Preview</p>
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{selectedFile?.name}</p>
                </div>
                <span className="text-[11px] text-gray-500">{selectedFileIndex + 1} / {assembledFiles.length}</span>
              </div>
              <div className="max-h-96 min-h-[16rem] overflow-y-auto rounded-2xl border border-gray-200/80 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
                {selectedFile && <AdvancedFilePreview key={`${selectedFile.name}-${selectedFile.size}`} file={selectedFile} />}
              </div>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Receive more files
          </button>
        </AIInlinePanel>
      ) : status === 'receiving' || status === 'connecting' ? (
        <AIInlinePanel className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {status === 'connecting' ? 'Connecting WebRTC Peer...' : 'Receiving File...'}
            </h3>
            <p className="text-xs font-mono text-cyan-500 mt-1">
              {status === 'receiving' ? `${transferSpeedMbps} MB/s Direct Socket Speed` : 'Establishing P2P DataChannel...'}
            </p>
          </div>

          <div className="w-full bg-gray-200 dark:bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-200"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-cyan-500">{Math.round(progressRatio * 100)}%</span>
        </AIInlinePanel>
      ) : (
        <AIInlinePanel className="p-8 flex flex-col items-center space-y-6 text-center">
          <div className="flex justify-center w-full">
            <div className="glass-panel p-1 rounded-xl inline-flex gap-1 border border-gray-200 dark:border-white/10 text-xs">
              <button
                onClick={() => setActiveMode('code')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeMode === 'code' ? 'bg-cyan-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                🔢 6-Digit Pairing Code
              </button>
              <button
                onClick={() => setActiveMode('camera')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeMode === 'camera' ? 'bg-cyan-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📷 Scan Static QR
              </button>
            </div>
          </div>

          {activeMode === 'code' ? (
            <div className="space-y-4 w-full max-w-xs">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Enter Sender 6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full py-3 px-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-center font-mono text-2xl font-bold tracking-widest text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />

              <button
                onClick={() => connectWithCode()}
                disabled={inputCode.length < 6}
                className="w-full py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-500/25"
              >
                Connect & Receive File
              </button>
            </div>
          ) : (
            <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden glass-panel border border-cyan-500/20 bg-black flex items-center justify-center">
              <canvas ref={canvasRef} className="hidden" />
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
              {errorMessage}
            </div>
          )}
        </AIInlinePanel>
      )}
    </div>
  );
}
