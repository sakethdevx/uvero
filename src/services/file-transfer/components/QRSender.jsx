import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LTEncoder, compressPayloadIfBeneficial } from '../lib/fountain';
import { renderRGBMatrixFrame } from '../lib/rgbMatrixEngine';

/**
 * QRSender — RGB Color Grid Optical Matrix Sender
 * Features 4-Color RGB Matrix, Corner Alignment Markers, Frame Sequence Headers,
 * and Zero Eye Strain Soft RGB Canvas Rendering.
 */
export default function QRSender({ fileData, fileName, fileType, onReset }) {
  const canvasRef = useRef(null);

  const [fps, setFps] = useState(24);
  const [isPlaying, setIsPlaying] = useState(true);
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
  const animFrameIdRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const fpsWindowRef = useRef([]);

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

      const enc = new LTEncoder(payloadData, fileName, fileType, 'balanced', isCompressed);
      encoderRef.current = enc;

      setStats(prev => ({
        ...prev,
        dropletsSent: 0,
        totalBlocks: enc.K,
        blockSize: enc.blockSize,
        crc32: enc.crc32,
      }));
    });

    return () => {
      isMounted = false;
    };
  }, [fileData, fileName, fileType]);

  // RGB Color Grid Canvas Render Loop
  const renderLoop = useCallback((timestamp) => {
    if (!isPlaying || !encoderRef.current || !canvasRef.current) {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const targetInterval = 1000 / fps;
    const elapsed = timestamp - lastFrameTimeRef.current;

    if (elapsed >= targetInterval) {
      lastFrameTimeRef.current = timestamp - (elapsed % targetInterval);

      const enc = encoderRef.current;
      const frameSeq = enc.seedCounter;
      const dropletPacket = enc.nextDroplet();
      const payloadBytes = new TextEncoder().encode(dropletPacket);

      const frameHeader = {
        fileId: parseInt(enc.fileId, 16) || 1001,
        frameSeq,
        totalFrames: enc.K,
      };

      // Render RGB Color Grid Frame onto HTML5 Canvas
      renderRGBMatrixFrame(canvasRef.current, frameHeader, payloadBytes, 14);

      const now = performance.now();
      fpsWindowRef.current.push(now);
      if (fpsWindowRef.current.length > 30) fpsWindowRef.current.shift();
      
      const windowLen = fpsWindowRef.current.length;
      const actualFps = windowLen > 1 
        ? Math.round((windowLen - 1) * 1000 / (now - fpsWindowRef.current[0])) 
        : fps;

      const dropletsSent = enc.seedCounter - 1;
      const bytesPerSec = (enc.blockSize * actualFps) / 1024;

      setStats(prev => ({
        ...prev,
        dropletsSent,
        currentFps: actualFps,
        transferRateKbps: bytesPerSec.toFixed(1),
      }));
    }

    animFrameIdRef.current = requestAnimationFrame(renderLoop);
  }, [fps, isPlaying]);

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

      {/* Main Display Canvas */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative group p-4 glass-panel rounded-3xl border border-cyan-500/20 shadow-2xl flex flex-col items-center bg-[#0f172a]">
          <div className="relative p-2 rounded-2xl">
            <canvas ref={canvasRef} width={340} height={340} className="w-64 h-64 sm:w-80 sm:h-80 rounded-xl" />
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs font-mono text-cyan-400">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyan-400 animate-ping' : 'bg-amber-500'}`} />
              <span>{isPlaying ? `${stats.currentFps} FPS` : 'PAUSED'}</span>
            </div>
            <span>•</span>
            <span>RGB Color Grid Stream</span>
            <span>•</span>
            <span>Frame #{stats.dropletsSent}</span>
          </div>
        </div>

        {/* Sender Controls */}
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
              {[15, 24, 30].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setFps(rate)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
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
        </div>
      </div>
    </div>
  );
}
