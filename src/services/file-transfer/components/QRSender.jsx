import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { LTEncoder, compressPayloadIfBeneficial } from '../lib/fountain';
import { WebRTCSender } from '../lib/webrtcPeer';

/**
 * QRSender — High-Performance Optical Stream + Auto-Fallback WebRTC Sender
 */
export default function QRSender({ fileData, fileName, fileType, onReset }) {
  const canvasRef = useRef(null);

  const [fps, setFps] = useState(30);
  const [density, setDensity] = useState('balanced');
  const [activeEngine, setActiveEngine] = useState('optical'); // 'optical' | 'webrtc'
  const [isPlaying, setIsPlaying] = useState(true);
  
  const [webrtcStatus, setWebrtcStatus] = useState('idle'); // 'idle', 'ready', 'connected'
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

  // Initialize LTEncoder & WebRTC
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

      // Initialize WebRTC
      const sender = new WebRTCSender(
        fileData,
        fileName,
        fileType,
        (serializedOffer) => {
          if (!isMounted) return;
          setWebrtcStatus('ready');
          if (activeEngine === 'webrtc' && canvasRef.current && serializedOffer) {
            const qrPayload = JSON.stringify({ w: 1, s: serializedOffer });
            QRCode.toCanvas(canvasRef.current, qrPayload, {
              errorCorrectionLevel: 'L',
              margin: 2,
              width: 320,
              color: { dark: '#38bdf8', light: '#0f172a' }, // Soft Cyan on Dark Slate
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
          setActiveEngine('optical');
        }
      );

      webrtcSenderRef.current = sender;
    });

    return () => {
      isMounted = false;
      if (webrtcSenderRef.current) webrtcSenderRef.current.close();
    };
  }, [fileData, fileName, fileType, density]);

  // Main Optical Stream Render Loop (Stealth Soft Dark Mode)
  const renderLoop = useCallback((timestamp) => {
    if (!isPlaying || !encoderRef.current || activeEngine === 'webrtc') {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const targetInterval = 1000 / fps;
    const elapsed = timestamp - lastFrameTimeRef.current;

    if (elapsed >= targetInterval) {
      lastFrameTimeRef.current = timestamp - (elapsed % targetInterval);

      const dropletPacket = encoderRef.current.nextDroplet();

      if (canvasRef.current) {
        QRCode.toCanvas(
          canvasRef.current,
          dropletPacket,
          {
            errorCorrectionLevel: 'L',
            margin: 2,
            width: 320,
            color: {
              dark: '#38bdf8',  // Soft Cyan (Zero Eye Strain)
              light: '#0f172a', // Dark Slate Background
            },
          },
          (err) => {
            if (!err) {
              const now = performance.now();
              fpsWindowRef.current.push(now);
              if (fpsWindowRef.current.length > 30) fpsWindowRef.current.shift();
              
              const windowLen = fpsWindowRef.current.length;
              const actualFps = windowLen > 1 
                ? Math.round((windowLen - 1) * 1000 / (now - fpsWindowRef.current[0])) 
                : fps;

              const dropletsSent = encoderRef.current.seedCounter - 1;
              const bytesPerSec = (encoderRef.current.blockSize * actualFps) / 1024;

              setStats(prev => ({
                ...prev,
                dropletsSent,
                currentFps: actualFps,
                transferRateKbps: bytesPerSec.toFixed(1),
              }));
            }
          }
        );
      }
    }

    animFrameIdRef.current = requestAnimationFrame(renderLoop);
  }, [fps, isPlaying, activeEngine]);

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [renderLoop]);

  return (
    <div className="space-y-6">
      {/* Top File Metadata Panel */}
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

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="glass-panel p-1 rounded-xl inline-flex gap-1 border border-gray-200 dark:border-white/10 text-xs">
          <button
            onClick={() => setActiveEngine('optical')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeEngine === 'optical' ? 'bg-cyan-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📡 Stealth Optical Stream (Recommended)
          </button>
          <button
            onClick={() => setActiveEngine('webrtc')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeEngine === 'webrtc' ? 'bg-violet-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            ⚡ WebRTC Direct P2P
          </button>
        </div>
      </div>

      {/* Main Display Canvas */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative group p-4 glass-panel rounded-3xl border border-cyan-500/20 shadow-2xl flex flex-col items-center bg-[#0f172a]">
          <div className="relative p-2 rounded-2xl">
            <canvas ref={canvasRef} className="w-64 h-64 sm:w-80 sm:h-80 rounded-xl" />
          </div>

          {activeEngine === 'optical' ? (
            <div className="mt-4 flex items-center gap-4 text-xs font-mono text-cyan-400">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyan-400 animate-ping' : 'bg-amber-500'}`} />
                <span>{isPlaying ? `${stats.currentFps} FPS` : 'PAUSED'}</span>
              </div>
              <span>•</span>
              <span>~{stats.transferRateKbps} KB/s</span>
              <span>•</span>
              <span>Frame #{stats.dropletsSent}</span>
            </div>
          ) : (
            <div className="mt-4 text-xs font-mono text-cyan-400">
              {webrtcStatus === 'connected' 
                ? `P2P Transfer: ${Math.round(webrtcProgress * 100)}%`
                : 'Scan offer QR on mobile device'}
            </div>
          )}
        </div>

        {/* Sender Controls */}
        {activeEngine === 'optical' && (
          <div className="glass-panel p-4 rounded-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setIsPlaying(prev => !prev)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isPlaying 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20' 
                    : 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-cyan-500/25'
                }`}
              >
                {isPlaying ? 'Pause Stream' : 'Resume Stream'}
              </button>

              <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                {[15, 24, 30, 60].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setFps(rate)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      fps === rate
                        ? 'bg-cyan-500 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {rate} FPS
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Density Preset</span>
                <span className="capitalize font-mono text-cyan-500">{density}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'reliable', label: 'High Reliability', desc: 'Largest QR pixels' },
                  { id: 'balanced', label: 'Balanced', desc: 'Recommended' },
                  { id: 'turbo', label: 'Turbo Mode', desc: 'High density' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setDensity(preset.id)}
                    className={`p-2 rounded-xl text-left transition-all border ${
                      density === preset.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="text-xs font-semibold">{preset.label}</div>
                    <div className="text-[10px] text-gray-400">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
