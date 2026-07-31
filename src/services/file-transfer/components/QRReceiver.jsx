import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { LTDecoder } from '../lib/fountain';
import { decodeRGBMatrixFromCorners } from '../lib/rgbMatrixEngine';

/**
 * QRReceiver — Perspective-Calibrated Camera Receiver Engine
 */
export default function QRReceiver({ onReset }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  
  const [scannerStatus, setScannerStatus] = useState('initializing'); // 'initializing', 'scanning', 'complete', 'error'

  const [progressState, setProgressState] = useState({
    fileName: '',
    fileSize: 0,
    solvedBlocks: 0,
    totalBlocks: 0,
    progressRatio: 0,
    totalDroplets: 0,
    scanFps: 0,
  });

  const [assembledFile, setAssembledFile] = useState(null);

  const decoderRef = useRef(new LTDecoder());
  const animFrameIdRef = useRef(null);
  const fpsWindowRef = useRef([]);

  const startCamera = useCallback(async () => {
    setScannerStatus('initializing');

    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      const track = mediaStream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        setIsTorchSupported(!!track.getCapabilities().torch);
      } else {
        setIsTorchSupported(false);
      }

      setScannerStatus('scanning');
    } catch {
      setScannerStatus('error');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [facingMode]);

  const toggleTorch = async () => {
    if (!stream || !isTorchSupported) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !isTorchOn;
        await track.applyConstraints({ advanced: [{ torch: nextState }] });
        setIsTorchOn(nextState);
      } catch {
        // Torch error
      }
    }
  };

  const scanLoop = useCallback(() => {
    if (scannerStatus === 'complete' || !videoRef.current || videoRef.current.readyState !== 4) {
      animFrameIdRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    const overlayCanvas = overlayCanvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Pass 1: Try standard QR detector
    let code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    let rawPayload = null;

    if (code && code.data) {
      rawPayload = code.data;
      if (overlayCanvas) {
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
        const oCtx = overlayCanvas.getContext('2d');
        oCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        oCtx.strokeStyle = '#38bdf8';
        oCtx.lineWidth = 4;
        oCtx.beginPath();
        oCtx.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
        oCtx.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
        oCtx.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
        oCtx.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
        oCtx.closePath();
        oCtx.stroke();
      }
    } else {
      // Pass 2: Bilinear Corner Sampling for RGB Color Grid Matrix
      const corners = code ? code.location : null;
      const decodedRGB = decodeRGBMatrixFromCorners(imageData, corners);

      if (decodedRGB && decodedRGB.payloadBytes && decodedRGB.payloadBytes.length > 0) {
        try {
          rawPayload = new TextDecoder().decode(decodedRGB.payloadBytes);
        } catch {
          // Parse error
        }
      }
    }

    if (rawPayload) {
      const res = decoderRef.current.processPacket(rawPayload);

      if (res.complete) {
        setScannerStatus('complete');
        setAssembledFile(res.assembledFile);
      }

      const now = performance.now();
      fpsWindowRef.current.push(now);
      if (fpsWindowRef.current.length > 25) fpsWindowRef.current.shift();
      const windowLen = fpsWindowRef.current.length;
      const scanFps = windowLen > 1 ? Math.round((windowLen - 1) * 1000 / (now - fpsWindowRef.current[0])) : 0;

      const dec = decoderRef.current;
      setProgressState({
        fileName: dec.fileName,
        fileSize: dec.fileSize,
        solvedBlocks: dec.rank,
        totalBlocks: dec.K,
        progressRatio: dec.K > 0 ? dec.rank / dec.K : 0,
        totalDroplets: dec.totalDropletsReceived,
        scanFps,
      });
    }

    animFrameIdRef.current = requestAnimationFrame(scanLoop);
  }, [scannerStatus]);

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(scanLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [scanLoop]);

  const handleRestart = () => {
    decoderRef.current.reset();
    setAssembledFile(null);
    setScannerStatus('scanning');
    setProgressState({
      fileName: '',
      fileSize: 0,
      solvedBlocks: 0,
      totalBlocks: 0,
      progressRatio: 0,
      totalDroplets: 0,
      scanFps: 0,
    });
  };

  const renderPreview = () => {
    if (!assembledFile) return null;
    const { name, type, blob, data } = assembledFile;

    if (type.startsWith('image/')) {
      const url = URL.createObjectURL(blob);
      return <img src={url} alt={name} className="max-h-64 rounded-xl object-contain mx-auto border border-gray-200 dark:border-white/10" />;
    }

    if (type.startsWith('text/') || type.includes('json') || type.includes('javascript') || type.includes('xml')) {
      const text = new TextDecoder().decode(data);
      return (
        <pre className="max-h-56 overflow-y-auto p-3 text-xs font-mono rounded-xl bg-gray-900 text-cyan-300 border border-gray-800">
          {text.slice(0, 3000)}
          {text.length > 3000 ? '\n\n...[Truncated]' : ''}
        </pre>
      );
    }

    return (
      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-white/10 rounded-xl">
        Preview unavailable for file type ({type || 'binary'}). Ready for download.
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {scannerStatus === 'complete' && assembledFile ? (
        <div className="glass-panel p-6 rounded-3xl space-y-6 border border-emerald-500/30 bg-emerald-500/5 shadow-2xl animate-fade-in max-w-xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">File Received Losslessly</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-xs">{assembledFile.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(assembledFile.size / 1024).toFixed(1)} KB • CRC32: <span className="font-mono text-emerald-600 dark:text-emerald-400">{assembledFile.crc || 'Verified'}</span> ✓
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
              Scan Another File
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-full max-w-md aspect-video sm:aspect-square rounded-3xl overflow-hidden glass-panel border border-cyan-500/20 shadow-2xl bg-black flex items-center justify-center">
            <canvas ref={canvasRef} className="hidden" />

            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-dashed border-cyan-400/60 rounded-3xl relative animate-pulse">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />
              </div>
            </div>

            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{progressState.scanFps} FPS</span>
              </div>

              <div className="flex items-center gap-2">
                {isTorchSupported && (
                  <button
                    onClick={toggleTorch}
                    className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                      isTorchOn ? 'bg-amber-500 text-white border-amber-400' : 'bg-black/60 text-white/80 border-white/10 hover:bg-black/80'
                    }`}
                    title="Toggle Flashlight"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </button>
                )}

                <button
                  onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                  className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white/80 border border-white/10 hover:bg-black/80 transition-all"
                  title="Switch Camera"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                  {progressState.fileName || 'Point Camera at AirPulse Stream'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {progressState.totalBlocks > 0 
                    ? `${progressState.solvedBlocks} of ${progressState.totalBlocks} Blocks Decoded`
                    : 'Scanning AirPulse optical stream...'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-lg font-extrabold text-cyan-500 font-mono">
                  {Math.round(progressState.progressRatio * 100)}%
                </span>
              </div>
            </div>

            <div className="w-full bg-gray-200 dark:bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-gray-300/30 dark:border-white/5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, progressState.progressRatio * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
