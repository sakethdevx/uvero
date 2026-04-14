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
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
                    {/* Input Mode Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                            Input Type
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setInputMode('text');
                                    setSelectedFile(null);
                                    setHashes({});
                                }}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                                    inputMode === 'text'
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                }`}
                            >
                                <div className="text-2xl mb-2">📝</div>
                                <div className="font-medium text-gray-900 dark:text-white">Text</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Hash text input</div>
                            </button>
                            <button
                                onClick={() => {
                                    setInputMode('file');
                                    setTextInput('');
                                    setHashes({});
                                }}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                                    inputMode === 'file'
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                }`}
                            >
                                <div className="text-2xl mb-2">📁</div>
                                <div className="font-medium text-gray-900 dark:text-white">File</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Hash file content</div>
                            </button>
                        </div>
                    </div>

                    {/* Input Area */}
                    {inputMode === 'text' ? (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                Text to Hash
                            </label>
                            <textarea
                                value={textInput}
                                onChange={(e) => {
                                    setTextInput(e.target.value);
                                    setHashes({});
                                }}
                                placeholder="Enter text to generate hash..."
                                rows={6}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none transition-colors font-mono text-sm"
                            />
                        </div>
                    ) : (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                File to Hash
                            </label>
                            <Dropzone
                                onFilesSelected={handleFileSelect}
                                maxFiles={1}
                            />
                            {selectedFile && (
                                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{formatFileSize(selectedFile.size)}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setHashes({});
                                            }}
                                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Algorithm Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                            Hash Algorithms
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {algorithms.map((algo) => (
                                <label
                                    key={algo.id}
                                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        selectedAlgorithms.includes(algo.id)
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedAlgorithms.includes(algo.id)}
                                        onChange={() => handleAlgorithmToggle(algo.id)}
                                        className="w-5 h-5 text-purple-600 dark:text-purple-400 rounded focus:ring-purple-500 mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white">{algo.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{algo.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="mb-6">
                        <Button
                            onClick={handleGenerate}
                            disabled={
                                isProcessing ||
                                (inputMode === 'text' && !textInput.trim()) ||
                                (inputMode === 'file' && !selectedFile)
                            }
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                            {isProcessing ? 'Generating...' : 'Generate Hashes'}
                        </Button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Results */}
                    {Object.keys(hashes).length > 0 && (
                        <div className="border-t pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Hashes</h3>
                                <Button onClick={handleReset} variant="secondary" className="text-sm">
                                    Reset
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {selectedAlgorithms.map((algorithm) => {
                                    const hash = hashes[algorithm];
                                    if (!hash) return null;

                                    return (
                                        <div key={algorithm} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-purple-600 dark:text-purple-400">{algorithm}</span>
                                                <button
                                                    onClick={() => handleCopyHash(algorithm, hash)}
                                                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1"
                                                >
                                                    {copiedHash === algorithm ? (
                                                        <>
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                            Copy
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="font-mono text-sm text-gray-800 dark:text-gray-100 break-all bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                                                {hash}
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
