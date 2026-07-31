import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { LTEncoder, compressPayloadIfBeneficial } from '../lib/fountain';
import { WebRTCSender } from '../lib/webrtcPeer';
import { renderPrismCanvas } from '../lib/prismColor';

/**
 * QRSender — Dual-Engine Sender Component
 * Supports Instant WebRTC P2P + Prism 4-Color Pastel Stream Fallback
 */
export default function QRSender({ fileData, fileName, fileType, onReset }) {
  const canvasRef = useRef(null);
  const prismCanvasRef = useRef(null);

  const [fps, setFps] = useState(30);
  const [density, setDensity] = useState('balanced');
  const [renderMode, setRenderMode] = useState('webrtc'); // 'webrtc' | 'prism' | 'qr'
  const [isPlaying, setIsPlaying] = useState(true);
  
  const [webrtcStatus, setWebrtcStatus] = useState('initializing'); // 'initializing', 'ready', 'connected', 'fallback'
  const [webrtcProgress, setWebrtcProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState(null);

  const [stats, setStats] = useState({
    dropletsSent: 0,
    currentFps: 0,
    transferRateKbps: 0,
    totalBlocks: 0,
    blockSize: 0,
    crc32: '',
  });

  const encoderRef = useRef(null);
  const webrtcSenderRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const fpsWindowRef = useRef([]);

  // Initialize WebRTC P2P Offer
  useEffect(() => {
    if (!fileData) return;

    let isMounted = true;

    compressPayloadIfBeneficial(fileData).then(({ data: payloadData, isCompressed }) => {
      if (!isMounted) return;

      if (isCompressed) {
        const ratio = ((1 - payloadData.length / fileData.length) * 100).toFixed(0);
        setCompressionInfo({
          originalSize: fileData.length,
          compressedSize: payloadData.length,
          ratio,
        });
      } else {
        setCompressionInfo(null);
      }

      const enc = new LTEncoder(payloadData, fileName, fileType, density, isCompressed);
      encoderRef.current = enc;

      setStats(prev => ({
        ...prev,
        dropletsSent: 0,
        totalBlocks: enc.K,
        blockSize: enc.blockSize,
        crc32: enc.crc32,
      }));

      // Initialize WebRTC Sender
      const sender = new WebRTCSender(
        fileData,
        fileName,
        fileType,
        (serializedOffer) => {
          if (!isMounted) return;
          setWebrtcStatus('ready');
          // Render 1 single QR offer for WebRTC bootstrap
          if (canvasRef.current && serializedOffer) {
            const qrPayload = JSON.stringify({ w: 1, s: serializedOffer });
            QRCode.toCanvas(canvasRef.current, qrPayload, {
              errorCorrectionLevel: 'L',
              margin: 2,
              width: 320,
              color: { dark: '#0f172a', light: '#ffffff' },
            });
          }
        },
        (progress) => {
          if (!isMounted) return;
          setWebrtcProgress(progress);
        },
        () => {
          if (!isMounted) return;
          setWebrtcStatus('connected');
        },
        () => {
          if (!isMounted) return;
          setWebrtcStatus('fallback');
          setRenderMode('prism');
        }
      );

      webrtcSenderRef.current = sender;
    });

    return () => {
      isMounted = false;
      if (webrtcSenderRef.current) webrtcSenderRef.current.close();
    };
  }, [fileData, fileName, fileType, density]);

  // Main Fallback Animation Loop (Prism 4-Color Pastel Matrix)
  const renderLoop = useCallback((timestamp) => {
    if (!isPlaying || !encoderRef.current || renderMode === 'webrtc') {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const targetInterval = 1000 / fps;
    const elapsed = timestamp - lastFrameTimeRef.current;

    if (elapsed >= targetInterval) {
      lastFrameTimeRef.current = timestamp - (elapsed % targetInterval);

      const dropletPacket = encoderRef.current.nextDroplet();

      if (renderMode === 'prism' && prismCanvasRef.current) {
        renderPrismCanvas(prismCanvasRef.current, dropletPacket);
      } else if (canvasRef.current) {
        QRCode.toCanvas(
          canvasRef.current,
          dropletPacket,
          {
            errorCorrectionLevel: 'L',
            margin: 2,
            width: 320,
            color: { dark: '#0f172a', light: '#ffffff' },
          },
          () => {}
        );
      }

      const now = performance.now();
      fpsWindowRef.current.push(now);
      if (fpsWindowRef.current.length > 30) fpsWindowRef.current.shift();
      
      const windowLen = fpsWindowRef.current.length;
      const actualFps = windowLen > 1 ? Math.round((windowLen - 1) * 1000 / (now - fpsWindowRef.current[0])) : fps;
      const dropletsSent = encoderRef.current.seedCounter - 1;
      const bytesPerSec = (encoderRef.current.blockSize * actualFps) / 1024;

      setStats(prev => ({
        ...prev,
        dropletsSent,
        currentFps: actualFps,
        transferRateKbps: bytesPerSec.toFixed(1),
      }));
    }

    animFrameIdRef.current = requestAnimationFrame(renderLoop);
  }, [fps, isPlaying, renderMode]);

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [renderLoop]);

  return (
    <div className="space-y-6">
      {/* Top File Meta Panel */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-500 font-bold border border-cyan-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[220px]">
                {fileName}
              </h3>
              {compressionInfo && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                  -{compressionInfo.ratio}% Compressed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(fileData.byteLength / 1024).toFixed(1)} KB • {stats.totalBlocks} Blocks
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="px-3 py-1.5 text-xs font-medium rounded-xl transition-all border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
        >
          Change File
        </button>
      </div>

      {/* Primary / Fallback Mode Switcher Header */}
      <div className="flex justify-center">
        <div className="glass-panel p-1 rounded-xl inline-flex gap-1 border border-gray-200 dark:border-white/10 text-xs">
          <button
            onClick={() => setRenderMode('webrtc')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              renderMode === 'webrtc' ? 'bg-cyan-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            ⚡ WebRTC Instant (0.2s)
          </button>
          <button
            onClick={() => setRenderMode('prism')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              renderMode === 'prism' ? 'bg-violet-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            🎨 Prism Soft Colors (Fallback)
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex flex-col items-center justify-center space-y-4">
        {renderMode === 'webrtc' ? (
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 shadow-2xl flex flex-col items-center space-y-4 max-w-md w-full text-center">
            {webrtcStatus === 'connected' ? (
              <div className="space-y-4 py-6 w-full">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">WebRTC P2P DataChannel Active</h4>
                <div className="w-full bg-gray-200 dark:bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-200" style={{ width: `${webrtcProgress * 100}%` }} />
                </div>
                <p className="text-xs text-gray-500 font-mono">{Math.round(webrtcProgress * 100)}% Transferred via Local Socket</p>
              </div>
            ) : (
              <>
                <div className="relative bg-white p-3 rounded-2xl shadow-inner">
                  <canvas ref={canvasRef} className="w-64 h-64 sm:w-80 sm:h-80 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Scan 1 Time to Bootstrap Instant P2P</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Transfers entire file in 0.2 seconds with 0 screen flashing & 0 eye strain.
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Prism 4-Color Pastel Matrix Display */
          <div className="relative group p-4 glass-panel rounded-3xl border border-violet-500/20 shadow-2xl flex flex-col items-center">
            <div className="relative bg-[#0f172a] p-3 rounded-2xl shadow-inner">
              <canvas ref={prismCanvasRef} width={320} height={320} className="w-64 h-64 sm:w-80 sm:h-80 rounded-xl" />
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs font-mono text-gray-600 dark:text-gray-300">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              <span>Prism 4-Color Pastel Stream (2 bits/tile)</span>
              <span>•</span>
              <span>Frame #{stats.dropletsSent}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
