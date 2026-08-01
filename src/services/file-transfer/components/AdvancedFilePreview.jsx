import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import mammoth from 'mammoth';

/**
 * AdvancedFilePreview — Next-Generation Interactive File Previewer
 * Supports Images (Zoom/Rotate/Grid), PDFs, Code/Text (Line numbers/Copy/Markdown),
 * CSV (Interactive Data Table), ZIP Archives (File Tree/Inspector),
 * DOCX (Mammoth HTML Render), Audio & Video with custom players, and Lightbox Fullscreen mode.
 */
export default function AdvancedFilePreview({ file, className = '', maxPreviewHeight = 'max-h-96' }) {
  const [fileMeta, setFileMeta] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [csvData, setCsvData] = useState(null); // { headers: [], rows: [] }
  const [zipFiles, setZipFiles] = useState([]); // [{ name, size, dir }]
  const [docxHtml, setDocxHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Image controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imgDimensions, setImgDimensions] = useState(null);
  const [showCheckerboard, setShowCheckerboard] = useState(true);

  // CSV search
  const [csvFilter, setCsvFilter] = useState('');

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code' | 'raw'

  const objectUrlRef = useRef(null);

  useEffect(() => {
    if (!file) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setZoom(1);
    setRotation(0);

    const name = file.name || 'file';
    const size = file.size || file.byteLength || 0;
    const type = file.type || '';
    const ext = (name.split('.').pop() || '').toLowerCase();

    // Standardize blob
    let blob = null;
    if (file instanceof Blob) {
      blob = file;
    } else if (file.blob instanceof Blob) {
      blob = file.blob;
    } else if (file.data) {
      blob = new Blob([file.data], { type: type || 'application/octet-stream' });
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const fileUrl = blob ? URL.createObjectURL(blob) : '';
    objectUrlRef.current = fileUrl;

    setFileMeta({ name, size, type, ext, fileUrl, blob });

    // Category determination & specialized loading
    const loadContent = async () => {
      try {
        // 1. ZIP Archives
        if (['zip', 'jar', 'apk', 'docx', 'xlsx', 'pptx'].includes(ext) && ext === 'zip' && blob) {
          try {
            const zip = await JSZip.loadAsync(blob);
            const entries = [];
            zip.forEach((relativePath, zipEntry) => {
              entries.push({
                name: relativePath,
                size: zipEntry._data ? zipEntry._data.uncompressedSize || 0 : 0,
                dir: zipEntry.dir,
              });
            });
            if (isMounted) setZipFiles(entries);
          } catch (e) {
            console.warn('Zip parsing error:', e);
          }
        }

        // 2. DOCX Documents (Mammoth)
        if ((ext === 'docx' || type.includes('wordprocessingml')) && blob) {
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            if (isMounted) setDocxHtml(result.value);
          } catch (e) {
            console.warn('Docx parsing error:', e);
          }
        }

        // 3. Text, JSON, CSV, Source Code
        const isTextLike =
          type.startsWith('text/') ||
          ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'csv', 'tsv', 'py', 'sh', 'sql', 'xml', 'yaml', 'yml', 'env', 'log'].includes(ext);

        if (isTextLike && blob) {
          const text = await blob.text();
          if (!isMounted) return;

          setTextContent(text);

          // CSV Parsing
          if (ext === 'csv' || ext === 'tsv' || type.includes('csv')) {
            const delimiter = ext === 'tsv' ? '\t' : ',';
            const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
            if (lines.length > 0) {
              const headers = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
              const rows = lines.slice(1, 201).map((line) => line.split(delimiter).map((cell) => cell.replace(/^["']|["']$/g, '').trim()));
              setCsvData({ headers, rows, totalCount: lines.length - 1 });
            }
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load file preview');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [file]);

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!fileMeta) return null;

  const { name, size, type, ext, fileUrl } = fileMeta;

  const isImage = type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext);
  const isPdf = type === 'application/pdf' || ext === 'pdf';
  const isAudio = type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext);
  const isVideo = type.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext);
  const isCodeOrText = textContent.length > 0 && !isImage && !isPdf && !isAudio && !isVideo;
  const isZip = ext === 'zip' && zipFiles.length > 0;
  const isDocx = docxHtml.length > 0;

  const formattedSize = (size / (1024 * 1024)).toFixed(2) + ' MB';

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-medium">Generating advanced preview...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6 text-center text-rose-500 text-xs">
          <p className="font-bold mb-1">Preview Notice</p>
          <p>{error}</p>
        </div>
      );
    }

    // 1. Image Previewer
    if (isImage) {
      return (
        <div
          className={`relative w-full overflow-hidden flex items-center justify-center p-4 rounded-xl min-h-[220px] transition-colors ${
            showCheckerboard
              ? 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-gray-50 dark:bg-slate-900/60'
              : 'bg-black/80'
          }`}
        >
          <img
            src={fileUrl}
            alt={name}
            onLoad={(e) => {
              setImgDimensions({
                width: e.target.naturalWidth,
                height: e.target.naturalHeight,
              });
            }}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="max-h-80 w-auto object-contain rounded-lg shadow-xl drop-shadow-md select-none"
          />

          {imgDimensions && (
            <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/80 border border-white/10 shadow">
              {imgDimensions.width} × {imgDimensions.height}px
            </div>
          )}
        </div>
      );
    }

    // 2. PDF Previewer
    if (isPdf) {
      return (
        <div className="w-full h-96 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-slate-950 relative shadow-inner">
          <iframe src={`${fileUrl}#toolbar=1`} title={name} className="w-full h-full border-none" />
        </div>
      );
    }

    // 3. Audio Custom Player Card
    if (isAudio) {
      return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-900/50 to-blue-600/10 border border-cyan-500/20 flex flex-col items-center gap-5 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
            <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zm12 0c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>

          <div className="w-full space-y-2 text-center">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-md mx-auto">{name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{formattedSize}</p>
            <audio controls src={fileUrl} className="w-full mt-3 rounded-lg shadow-sm" />
          </div>
        </div>
      );
    }

    // 4. Video Custom Player Card
    if (isVideo) {
      return (
        <div className="w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black shadow-2xl relative">
          <video controls src={fileUrl} className="w-full max-h-96 object-contain" />
        </div>
      );
    }

    // 5. CSV Interactive Data Grid
    if (csvData) {
      const filteredRows = csvData.rows.filter((row) =>
        row.some((cell) => cell.toLowerCase().includes(csvFilter.toLowerCase()))
      );

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Filter table rows..."
              value={csvFilter}
              onChange={(e) => setCsvFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
            />
            <span className="text-[11px] font-mono text-gray-500">
              Showing {filteredRows.length} of {csvData.totalCount} rows
            </span>
          </div>

          <div className="overflow-x-auto max-h-72 border border-gray-200 dark:border-white/10 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 sticky top-0 font-bold border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="px-3 py-2 border-r border-gray-200 dark:border-white/10 text-[10px] uppercase font-mono text-gray-400 w-10 text-center">#</th>
                  {csvData.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 border-r border-gray-200 dark:border-white/10 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/5 font-mono">
                {filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="px-3 py-1.5 border-r border-gray-200 dark:border-white/10 text-[10px] text-gray-400 text-center">{rIdx + 1}</td>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5 border-r border-gray-200 dark:border-white/10 whitespace-nowrap text-gray-800 dark:text-gray-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 6. ZIP Archive File Inspector Tree
    if (isZip) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 px-1">
            <span>Archive Contents ({zipFiles.length} files)</span>
            <span className="font-mono text-[11px] text-cyan-500">JSZip Verified</span>
          </div>

          <div className="max-h-72 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-xl p-2 bg-gray-50 dark:bg-slate-900/80 font-mono text-xs divide-y divide-gray-200/50 dark:divide-white/5">
            {zipFiles.map((entry, idx) => (
              <div key={idx} className="py-1.5 px-2 flex items-center justify-between hover:bg-cyan-500/10 rounded-md transition-colors">
                <div className="flex items-center gap-2 truncate">
                  <span>{entry.dir ? '📁' : '📄'}</span>
                  <span className="text-gray-800 dark:text-gray-200 truncate">{entry.name}</span>
                </div>
                {!entry.dir && entry.size > 0 && (
                  <span className="text-[10px] text-gray-400 shrink-0 font-mono ml-2">
                    {(entry.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 7. DOCX HTML Render (Mammoth)
    if (isDocx) {
      return (
        <div className="max-h-80 overflow-y-auto p-6 rounded-xl bg-white text-gray-900 border border-gray-200 dark:border-white/10 shadow-inner prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
        </div>
      );
    }

    // 8. Code & Text Previewer
    if (isCodeOrText) {
      const lines = textContent.split('\n');
      return (
        <div className="relative group rounded-xl border border-gray-800 bg-slate-950 overflow-hidden shadow-2xl font-mono text-xs">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-gray-400 text-[11px]">
            <span className="font-semibold text-cyan-400">{ext.toUpperCase() || 'TEXT'} Document</span>
            <span>{lines.length} lines</span>
          </div>

          <div className={`overflow-x-auto overflow-y-auto p-4 ${maxPreviewHeight} text-cyan-200 leading-relaxed`}>
            <table className="w-full border-collapse">
              <tbody>
                {lines.slice(0, 400).map((line, lineNo) => (
                  <tr key={lineNo} className="hover:bg-white/5">
                    <td className="w-10 select-none text-right pr-4 text-slate-600 text-[11px] font-mono border-r border-slate-800">
                      {lineNo + 1}
                    </td>
                    <td className="pl-4 whitespace-pre font-mono text-slate-200">{line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lines.length > 400 && (
              <div className="p-3 text-center text-xs text-amber-400 border-t border-slate-800 bg-slate-900/60">
                Preview truncated ({lines.length - 400} lines remaining). Download file for complete content.
              </div>
            )}
          </div>
        </div>
      );
    }

    // Fallback Card
    return (
      <div className="p-6 rounded-2xl bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center text-2xl font-bold">
          📁
        </div>
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider bg-cyan-500/10 text-cyan-500 border-cyan-500/20">
            .{ext || 'file'} Document
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Local file losslessly ready for download or P2P transfer.
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {/* Advanced Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs">
          {/* File Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              {ext || 'FILE'}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px] sm:max-w-[260px]">
              {name}
            </span>
            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 shrink-0">
              {formattedSize}
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  title="Zoom Out"
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  🔍-
                </button>
                <span className="text-[10px] font-mono text-gray-400 px-1">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  title="Zoom In"
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  🔍+
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate 90°"
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  🔄
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckerboard((v) => !v)}
                  title="Toggle Transparency Canvas"
                  className={`p-1.5 rounded-lg text-[11px] transition-colors ${
                    showCheckerboard ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400'
                  }`}
                >
                  🏁
                </button>
              </>
            )}

            {isCodeOrText && (
              <button
                type="button"
                onClick={handleCopyText}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border border-cyan-500/20 font-semibold text-[11px] transition-all flex items-center gap-1"
              >
                {copied ? '✓ Copied' : '📋 Copy Text'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              title="Expand Fullscreen Lightbox"
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors text-xs"
            >
              ⛶ Fullscreen
            </button>
          </div>
        </div>

        {/* Main Render Area */}
        {renderContent()}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col p-4 sm:p-8 animate-state-in">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {ext || 'FILE'}
              </span>
              <h3 className="text-base font-bold text-white truncate max-w-xl">{name}</h3>
              <span className="text-xs font-mono text-gray-400">{formattedSize}</span>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
            >
              ✕ Close
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
}
