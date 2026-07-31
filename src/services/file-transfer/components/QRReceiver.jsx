import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { AIInlinePanel } from '../../../components/AIServiceLayout';
import { WebRTCReceiverManager } from '../lib/webrtcEngine';

/**
 * QRReceiver — Streamlined Pure WebRTC Receiver Component
 * Styled with official Uvero AIInlinePanel design system with enhanced document & image previews.
 */
export default function QRReceiver({ onReset }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [inputCode, setInputCode] = useState('');
  const [activeMode, setActiveMode] = useState('code'); // 'code' | 'camera'
  const [status, setStatus] = useState('idle'); // 'idle', 'connecting', 'receiving', 'complete', 'error'
  
  const [progressRatio, setProgressRatio] = useState(0);
  const [receivedBytes, setReceivedBytes] = useState(0);
  const [transferSpeedMbps, setTransferSpeedMbps] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [assembledFile, setAssembledFile] = useState(null);

  const receiverManagerRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
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
        (progress, offset, total) => {
          setProgressRatio(progress);
          setReceivedBytes(offset);

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
        (fileObj) => {
          setStatus('complete');
          setAssembledFile(fileObj);
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
    setAssembledFile(null);
    setInputCode('');
    setProgressRatio(0);
    setReceivedBytes(0);
    setErrorMessage('');
  };

  const renderPreview = () => {
    if (!assembledFile) return null;
    const { name, type, blob, data } = assembledFile;
    const lowerName = name.toLowerCase();
    const ext = lowerName.split('.').pop() || '';
    const fileUrl = URL.createObjectURL(blob);

    // 1. Image Preview
    if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      return (
        <div className="flex flex-col items-center">
          <img src={fileUrl} alt={name} className="max-h-72 rounded-xl object-contain border border-gray-200 dark:border-white/10 shadow-sm" />
        </div>
      );
    }

    // 2. PDF Document Preview
    if (type === 'application/pdf' || ext === 'pdf') {
      return (
        <div className="w-full h-80 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-900">
          <iframe src={fileUrl} title={name} className="w-full h-full border-none" />
        </div>
      );
    }

    // 3. Audio Preview
    if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
      return (
        <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex flex-col items-center gap-3">
          <span className="text-2xl">🎵</span>
          <audio controls src={fileUrl} className="w-full" />
        </div>
      );
    }

    // 4. Video Preview
    if (type.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv'].includes(ext)) {
      return (
        <div className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black">
          <video controls src={fileUrl} className="w-full max-h-72 object-contain" />
        </div>
      );
    }

    // 5. Plain Text & Source Code (excluding zip / docx / xlsx binary xml types)
    const isBinaryZipOffice = ['docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'zip', 'rar', '7z', 'gz'].includes(ext) ||
                              type.includes('officedocument') || type.includes('zip') || type.includes('compressed');

    if (!isBinaryZipOffice && (type.startsWith('text/') || type.includes('json') || type.includes('javascript') || ['txt', 'md', 'json', 'js', 'py', 'css', 'html'].includes(ext))) {
      const text = new TextDecoder().decode(data);
      return (
        <pre className="max-h-56 overflow-y-auto p-3 text-xs font-mono rounded-xl bg-gray-900 text-cyan-300 border border-gray-800">
          {text.slice(0, 3000)}
          {text.length > 3000 ? '\n\n...[Truncated]' : ''}
        </pre>
      );
    }

    // 6. Office Documents & Binary Files Card Preview
    const getDocumentBadge = () => {
      if (['docx', 'doc'].includes(ext)) return { icon: '📄', label: 'Word Document', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      if (['xlsx', 'xls', 'csv'].includes(ext)) return { icon: '📊', label: 'Spreadsheet', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      if (['pptx', 'ppt'].includes(ext)) return { icon: '📊', label: 'Presentation', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: '📦', label: 'Archive Package', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
      return { icon: '📁', label: 'Binary File', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
    };

    const docMeta = getDocumentBadge();

    return (
      <div className="p-6 rounded-2xl bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center text-2xl font-bold">
          {docMeta.icon}
        </div>
        <div>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${docMeta.color}`}>
            {docMeta.label}
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Binary document verified & ready for instant local download.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {status === 'complete' && assembledFile ? (
        <AIInlinePanel className="p-6 space-y-6 border border-emerald-500/30 bg-emerald-500/5 shadow-2xl animate-state-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">File Received Losslessly</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{assembledFile.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(assembledFile.size / (1024 * 1024)).toFixed(2)} MB • WebRTC P2P Direct
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">File Preview</label>
            {renderPreview()}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={URL.createObjectURL(assembledFile.blob)}
              download={assembledFile.name}
              className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download File</span>
            </a>

            <button
              onClick={handleRestart}
              className="w-full sm:w-auto py-3 px-5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              Receive Another File
            </button>
          </div>
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
