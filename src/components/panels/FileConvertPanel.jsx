import { useState, useCallback, useRef } from 'react';
import AILoader from '../AILoader';
import SuggestionChips, { ErrorRecovery } from '../SuggestionChips';
import { getSuggestions, getErrorRecovery } from '../../lib/Suggestions';
import { useSession } from '../../lib/SessionContext';
import processor from '../../services/toolbox/core/unifiedProcessor';

/**
 * FileConvertPanel — Tier 1 inline file converter.
 * Now with: session memory, result suggestions, smart error recovery.
 */
export default function FileConvertPanel({ params, onDismiss, onSuggestionSelect }) {
  const { session, recordAction } = useSession();

  // Use session context if available (e.g. "compress it" after previous upload)
  const sessionFile = session.lastInput?.type === 'file' ? session.lastInput.data : null;
  const initialFile = sessionFile || null;

  const [file, setFile] = useState(initialFile);
  const [outputFormat, setOutputFormat] = useState(params.format || '');
  const [availableFormats, setAvailableFormats] = useState(() => {
    if (initialFile) {
      const outputs = processor.getSupportedOutputs(initialFile);
      return outputs.filter(o => !['crop', 'resize', 'watermark', 'remove-background'].includes(o.value));
    }
    return [];
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [detectedCategory, setDetectedCategory] = useState(params.category || null);
  const fileInputRef = useRef(null);
  const lastConvertRef = useRef(null);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setResult(null);
    setError('');

    const outputs = processor.getSupportedOutputs(selectedFile);
    const conversionFormats = outputs.filter(o =>
      !['crop', 'resize', 'watermark', 'remove-background'].includes(o.value)
    );
    setAvailableFormats(conversionFormats);

    // Detect category from the file
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const catMap = {
      image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'heic', 'tiff', 'svg'],
      audio: ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'],
      video: ['mp4', 'mkv', 'mov', 'avi', 'webm'],
      document: ['pdf', 'docx', 'epub', 'md', 'txt', 'html', 'csv'],
    };
    for (const [cat, exts] of Object.entries(catMap)) {
      if (exts.includes(ext)) { setDetectedCategory(cat); break; }
    }

    if (params.format && conversionFormats.some(f => f.value === params.format)) {
      setOutputFormat(params.format);
    } else if (conversionFormats.length > 0 && !outputFormat) {
      setOutputFormat(conversionFormats[0].value);
    }
  }, [params.format, outputFormat]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleConvert = useCallback(async () => {
    if (!file || !outputFormat) return;

    setIsProcessing(true);
    setCurrentStep(0);
    setError('');
    lastConvertRef.current = { file, outputFormat };

    try {
      // Intentional "Analyzing" delay — feels intelligent, not instant
      await new Promise(r => setTimeout(r, 250));
      setCurrentStep(1);
      const converted = await processor.convert(file, outputFormat, (p) => {
        if (p > 30) setCurrentStep(2);
        if (p > 80) setCurrentStep(3);
      });

      setCurrentStep(4);
      // Brief pause before showing result — prevents flash
      await new Promise(r => setTimeout(r, 200));
      setResult(converted);

      // Record in session
      recordAction({
        input: { type: 'file', data: file, name: file.name },
        action: {
          capability: 'file-convert',
          label: `Convert to ${outputFormat.toUpperCase()}`,
          description: `${file.name} → ${outputFormat.toUpperCase()}`,
          icon: '⚡',
        },
        result: {
          type: 'file',
          data: converted.file,
          meta: {
            originalSize: converted.originalSize,
            convertedSize: converted.convertedSize,
            format: outputFormat,
            category: detectedCategory,
            summary: `${formatSize(converted.originalSize)} → ${formatSize(converted.convertedSize)}`,
          },
        },
      });
    } catch (err) {
      setError(err.message || 'Conversion failed.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, outputFormat, recordAction, detectedCategory]);

  const handleRetry = useCallback(() => {
    if (lastConvertRef.current) {
      setError('');
      handleConvert();
    }
  }, [handleConvert]);

  const handleDownload = useCallback(() => {
    if (!result?.file) return;
    const url = URL.createObjectURL(result.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.file.name || `converted.${outputFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, outputFormat]);

  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
    setOutputFormat(params.format || '');
    setAvailableFormats([]);
    setError('');
    setCurrentStep(0);
    setDetectedCategory(null);
  }, [params.format]);

  const handleSuggestion = useCallback((suggestion) => {
    if (suggestion.action === 'reset') {
      handleReset();
    } else if (suggestion.intent) {
      onSuggestionSelect?.(suggestion);
    }
  }, [handleReset, onSuggestionSelect]);

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // ── Processing state ──
  if (isProcessing) {
    return (
      <AILoader
        mode="steps"
        steps={['Analyzing input', 'Loading engine', 'Converting file', 'Finalizing output']}
        currentStep={currentStep}
      />
    );
  }

  // ── Error state (smart recovery) ──
  if (error) {
    const recovery = getErrorRecovery(error);
    return (
      <ErrorRecovery
        title={recovery.title}
        message={error}
        suggestions={recovery.suggestions}
        onSelect={handleSuggestion}
        onRetry={handleRetry}
      />
    );
  }

  // ── Result state ──
  if (result) {
    const reduction = result.originalSize > 0
      ? Math.round(((result.originalSize - result.convertedSize) / result.originalSize) * 100)
      : 0;

    const suggestions = getSuggestions('file-convert', { category: detectedCategory });

    return (
      <div className="result-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Conversion complete</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {formatSize(result.originalSize)} → {formatSize(result.convertedSize)}
              {reduction > 0 && <span className="text-green-500 ml-1">({reduction}% smaller)</span>}
            </p>
          </div>
        </div>

        <button onClick={handleDownload} className="btn-accent w-full flex items-center justify-center gap-2 text-sm mb-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download {outputFormat.toUpperCase()}
        </button>

        <SuggestionChips suggestions={suggestions} onSelect={handleSuggestion} />
      </div>
    );
  }

  // ── Input state ──
  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative group cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500/50"
          style={{ borderColor: 'var(--border)' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'var(--accent-subtle)' }}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drop a file or <span style={{ color: 'var(--accent)' }}>browse</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Images, audio, video, documents
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ background: 'var(--accent-subtle)' }}
            >📄</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatSize(file.size)}</p>
            </div>
            <button onClick={handleReset} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {availableFormats.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Convert to:</p>
              <div className="flex flex-wrap gap-1.5">
                {availableFormats.slice(0, 12).map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => setOutputFormat(fmt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      outputFormat === fmt.value
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                    style={outputFormat === fmt.value ? { background: 'var(--accent)' } : { background: 'var(--surface-2)' }}
                  >
                    {fmt.label}
                  </button>
                ))}
                {availableFormats.length > 12 && (
                  <span className="text-xs self-center pl-1" style={{ color: 'var(--text-secondary)' }}>
                    +{availableFormats.length - 12} more
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={!outputFormat}
            className="btn-accent w-full flex items-center justify-center gap-2 text-sm disabled:opacity-40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Convert to {outputFormat.toUpperCase()}
          </button>
        </div>
      )}
    </div>
  );
}
