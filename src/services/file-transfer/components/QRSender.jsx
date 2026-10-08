import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { AIInlinePanel } from '../../../components/AIServiceLayout';
import { WebRTCSenderManager } from '../lib/webrtcEngine';
import AdvancedFilePreview from './AdvancedFilePreview';

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const fileKind = (file) => {
  const extension = file.name.split('.').pop()?.toUpperCase();
  return file.type?.split('/')[0] || extension || 'FILE';
};

export default function QRSender({ files, onReset, onAddFiles, onRemoveFile }) {
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const senderManagerRef = useRef(null);
  const lastTimeRef = useRef(0);
  const lastBytesRef = useRef(0);
  const [pairingCode, setPairingCode] = useState('');
  const [status, setStatus] = useState('initializing');
  const [progressRatio, setProgressRatio] = useState(0);
  const [transferredBytes, setTransferredBytes] = useState(0);
  const [transferSpeedMbps, setTransferSpeedMbps] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);

  const totalSize = files.reduce((sum, file) => sum + file.data.byteLength, 0);
  const activePreviewIndex = Math.min(previewIndex, Math.max(0, files.length - 1));
  const activeFile = files[activePreviewIndex] || files[0];
  const previewFile = useMemo(() => (
    activeFile
      ? {
          name: activeFile.name,
          type: activeFile.type,
          data: activeFile.data,
          byteLength: activeFile.data.byteLength,
        }
      : null
  ), [activeFile]);

  useEffect(() => {
    if (!files?.length) return undefined;
    let isMounted = true;
    lastTimeRef.current = performance.now();
    lastBytesRef.current = 0;

    const manager = new WebRTCSenderManager(
      files,
      (code) => {
        if (!isMounted) return;
        setPairingCode(code);
        setStatus('ready');
        if (canvasRef.current) {
          QRCode.toCanvas(canvasRef.current, `${window.location.origin}/file-transfer?code=${code}`, {
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
      (progress, offset) => {
        if (!isMounted) return;
        setProgressRatio(progress);
        setTransferredBytes(offset);
        const now = performance.now();
        const timeDiff = (now - lastTimeRef.current) / 1000;
        if (timeDiff >= 0.3) {
          setTransferSpeedMbps(((offset - lastBytesRef.current) / (1024 * 1024) / timeDiff).toFixed(1));
          lastTimeRef.current = now;
          lastBytesRef.current = offset;
        }
      },
      () => isMounted && setStatus('complete'),
      (err) => {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err);
      }
    );

    senderManagerRef.current = manager;
    return () => {
      isMounted = false;
      manager.close();
    };
  }, [files]);

  const formattedCode = pairingCode ? `${pairingCode.slice(0, 3)} ${pairingCode.slice(3)}` : '...';
  const handleAddFiles = (event) => {
    onAddFiles?.(event.target.files);
    event.target.value = '';
  };

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
      <AIInlinePanel className="min-w-0 space-y-4 overflow-hidden p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200/80 pb-4 dark:border-white/10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-500">Share queue</p>
            <h2 className="mt-1 text-xl font-black text-gray-900 dark:text-white">
              {files.length} file{files.length === 1 ? '' : 's'} ready to send
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formatSize(totalSize)} total · files stay in your browser
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={status === 'connected'}
              className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-500 transition hover:bg-cyan-500/20 disabled:opacity-40"
            >
              + Add files
            </button>
            <button
              onClick={onReset}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Clear
            </button>
            <input ref={inputRef} type="file" multiple onChange={handleAddFiles} className="hidden" />
          </div>
        </div>

        <div className="grid max-h-52 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {files.map((file, index) => (
            <button
              key={`${file.name}-${file.size}-${index}`}
              onClick={() => setPreviewIndex(index)}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                index === activePreviewIndex
                  ? 'border-cyan-500/50 bg-cyan-500/10 shadow-sm'
                  : 'border-gray-200/80 hover:border-cyan-500/30 dark:border-white/10 dark:hover:border-cyan-500/30'
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[10px] font-black text-gray-500 dark:bg-white/10 dark:text-gray-300">
                {fileKind(file).slice(0, 5)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-gray-900 dark:text-white">{file.name}</span>
                <span className="mt-1 block text-[11px] text-gray-500 dark:text-gray-400">{formatSize(file.data.byteLength)}</span>
              </span>
              <span className="text-xs text-gray-400">{index + 1}</span>
              <span
                role="button"
                tabIndex={status === 'connected' ? -1 : 0}
                aria-label={`Remove ${file.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (status !== 'connected') onRemoveFile?.(index);
                }}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ' ') && status !== 'connected') {
                    event.preventDefault();
                    event.stopPropagation();
                    onRemoveFile?.(index);
                  }
                }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm transition ${
                  status === 'connected'
                    ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                    : 'text-gray-400 hover:bg-rose-500/10 hover:text-rose-500'
                }`}
                title={status === 'connected' ? 'Cannot remove files during transfer' : `Remove ${file.name}`}
              >
                ×
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/10">
          <div className="flex items-center justify-between border-b border-gray-200/80 px-4 py-3 dark:border-white/10">
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">Preview</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{activeFile?.name}</p>
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500 dark:bg-white/10 dark:text-gray-300">
              {activePreviewIndex + 1} / {files.length}
            </span>
          </div>
          <div className="min-h-[18rem] max-h-[24rem] overflow-y-auto p-3">
            {previewFile && (
              <AdvancedFilePreview
                file={previewFile}
                maxPreviewHeight="max-h-[30rem]"
              />
            )}
          </div>
        </div>
      </AIInlinePanel>

      <AIInlinePanel className="min-w-0 p-4 sm:p-5 xl:sticky xl:top-4">
        {status === 'complete' ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Ready for the next share</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">All {files.length} files were delivered losslessly.</p>
            <button onClick={onReset} className="mt-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20">
              Send more files
            </button>
          </div>
        ) : status === 'connected' ? (
          <div className="space-y-5 py-6 text-center">
            <div className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-cyan-500/20 text-cyan-500">↗</div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Sending your files</h3>
              <p className="mt-1 text-xs font-mono text-cyan-500">{transferSpeedMbps} MB/s direct P2P speed</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 p-0.5 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all" style={{ width: `${progressRatio * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs font-mono text-gray-500">
              <span>{formatSize(transferredBytes)} / {formatSize(totalSize)}</span>
              <span>{Math.round(progressRatio * 100)}%</span>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-5 py-4 text-center">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-md dark:border-white/10">
              <canvas ref={canvasRef} className="h-48 w-48 rounded-xl" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-500">Pairing code</p>
              <p className="mt-1 text-4xl font-black tracking-widest text-gray-900 dark:text-white">{formattedCode}</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Scan this QR code or enter the code on the receiving device. Your files never pass through our servers.
              </p>
            </div>
            {status === 'error' && <p className="rounded-xl bg-rose-500/10 p-3 text-xs font-semibold text-rose-500">{errorMessage}</p>}
          </div>
        )}
      </AIInlinePanel>
    </div>
  );
}
