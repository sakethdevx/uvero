import { useState } from 'react';
import Button from '../../../shared/Button';
import Dropzone from '../../../shared/Dropzone';

const HashGenerator = () => {
    const [inputMode, setInputMode] = useState('text');
    const [textInput, setTextInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedAlgorithms, setSelectedAlgorithms] = useState(['SHA-256']);
    const [hashes, setHashes] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [copiedHash, setCopiedHash] = useState('');

    const algorithms = [
        { id: 'SHA-1', name: 'SHA-1', description: '160-bit (Legacy)' },
        { id: 'SHA-256', name: 'SHA-256', description: '256-bit (Recommended)' },
        { id: 'SHA-384', name: 'SHA-384', description: '384-bit' },
        { id: 'SHA-512', name: 'SHA-512', description: '512-bit' }
    ];

    const handleAlgorithmToggle = (algorithmId) => {
        setSelectedAlgorithms(prev => {
            if (prev.includes(algorithmId)) {
                // Keep at least one algorithm selected
                if (prev.length > 1) {
                    return prev.filter(id => id !== algorithmId);
                }
                return prev;
            } else {
                return [...prev, algorithmId];
            }
        });
    };

    const generateHash = async (data, algorithm) => {
        const encoder = new TextEncoder();
        let dataBuffer;

        if (typeof data === 'string') {
            dataBuffer = encoder.encode(data);
        } else {
            dataBuffer = data;
        }

        const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    const handleGenerate = async () => {
        if (inputMode === 'text' && !textInput.trim()) {
            setError('Please enter some text to hash');
            return;
        }

        if (inputMode === 'file' && !selectedFile) {
            setError('Please select a file to hash');
            return;
        }

        setError('');
        setIsProcessing(true);
        const newHashes = {};

        try {
            let data;
            if (inputMode === 'text') {
                data = textInput;
            } else {
                // Read file as ArrayBuffer
                data = await selectedFile.arrayBuffer();
            }

            for (const algorithm of selectedAlgorithms) {
                const hash = await generateHash(data, algorithm);
                newHashes[algorithm] = hash;
            }

            setHashes(newHashes);
        } catch (err) {
            setError('Failed to generate hash. Please try again.');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileSelect = (files) => {
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
            setHashes({});
            setError('');
        }
    };

    const handleCopyHash = async (algorithm, hash) => {
        try {
            await navigator.clipboard.writeText(hash);
            setCopiedHash(algorithm);
            setTimeout(() => setCopiedHash(''), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleReset = () => {
        setTextInput('');
        setSelectedFile(null);
        setHashes({});
        setError('');
        setCopiedHash('');
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const divisor = Math.pow(k, i);
        return Math.round(bytes / divisor * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="glass-panel p-4 sm:p-6 md:p-8">
            <div className="space-y-8">
                {/* Input Mode Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                        Input Methodology
                    </label>
                    <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-full max-w-md">
                        <button
                            onClick={() => { setInputMode('text'); setSelectedFile(null); setHashes({}); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                                inputMode === 'text'
                                    ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Text Input
                        </button>
                        <button
                            onClick={() => { setInputMode('file'); setTextInput(''); setHashes({}); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                                inputMode === 'file'
                                    ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            File Source
                        </button>
                    </div>
                </div>

                {/* Input Area */}
                <div className="space-y-4">
                    {inputMode === 'text' ? (
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                                Source Content
                            </label>
                            <textarea
                                value={textInput}
                                onChange={(e) => { setTextInput(e.target.value); setHashes({}); }}
                                placeholder="Enter text to generate cryptographic hashes..."
                                rows={6}
                                className="w-full px-5 py-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/5 rounded-2xl focus:outline-none transition-all duration-300 font-mono text-sm resize-none shadow-sm dark:shadow-none"
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                                Target File
                            </label>
                            <Dropzone onFileSelect={handleFileSelect} maxFiles={1} minimized={!!selectedFile} />
                            {selectedFile && (
                                <div className="glass-subtle p-4 rounded-2xl flex items-center justify-between border-purple-500/20 bg-purple-500/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">{selectedFile.name}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{formatFileSize(selectedFile.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedFile(null); setHashes({}); }}
                                        className="p-2 hover:bg-red-500/10 rounded-xl text-red-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Algorithm Selection */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                        Hashing Algorithms
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {algorithms.map((algo) => (
                            <label
                                key={algo.id}
                                className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                                    selectedAlgorithms.includes(algo.id)
                                        ? 'border-purple-500 bg-purple-500/[0.03] dark:bg-purple-500/5'
                                        : 'border-gray-100 dark:border-white/5 hover:border-purple-200 dark:hover:border-purple-900/50 bg-white dark:bg-white/[0.02]'
                                }`}
                            >
                                <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all ${
                                    selectedAlgorithms.includes(algo.id) ? 'bg-purple-500 border-purple-500' : 'border-gray-200 dark:border-white/10'
                                }`}>
                                    {selectedAlgorithms.includes(algo.id) && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedAlgorithms.includes(algo.id)}
                                    onChange={() => handleAlgorithmToggle(algo.id)}
                                    className="hidden"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{algo.name}</div>
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{algo.description}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <div className="pt-2">
                    <button
                        onClick={handleGenerate}
                        disabled={
                            isProcessing ||
                            (inputMode === 'text' && !textInput.trim()) ||
                            (inputMode === 'file' && !selectedFile)
                        }
                        className="w-full btn-accent py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        {isProcessing ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing Hash Engine...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Execute Hashing System
                            </>
                        )}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold uppercase tracking-widest text-center animate-shake">
                        {error}
                    </div>
                )}

                {/* Results Area */}
                {Object.keys(hashes).length > 0 && (
                    <div className="space-y-6 pt-8 border-t border-gray-100 dark:border-white/5 animate-resultReveal">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Cryptographic Results</h3>
                            <button onClick={handleReset} className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors uppercase tracking-widest">
                                Flush Engine
                            </button>
                        </div>

                        <div className="space-y-4">
                            {selectedAlgorithms.map((algorithm) => {
                                const hash = hashes[algorithm];
                                if (!hash) return null;

                                return (
                                    <div key={algorithm} className="glass-subtle p-4 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                                {algorithm}
                                            </span>
                                            <button
                                                onClick={() => handleCopyHash(algorithm, hash)}
                                                className="suggestion-chip !opacity-100 !animate-none flex items-center gap-2 h-8 px-3 active:scale-95 transition-transform"
                                            >
                                                {copiedHash === algorithm ? (
                                                    <>
                                                        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-green-600 dark:text-green-400">Copied</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>Copy Hash</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                                            <div className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all leading-relaxed tracking-tight selection:bg-purple-500/30">
                                                {hash}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HashGenerator;
