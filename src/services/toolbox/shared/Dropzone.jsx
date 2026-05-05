import { useState, useCallback } from 'react';

/**
 * Reusable Dropzone component for file uploads
 * Supports drag & drop and click-to-upload
 */
export default function Dropzone({ accept, onFileSelect, maxSize = 100 * 1024 * 1024, multiple = false, label, description, minimized = false }) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateFile = useCallback((file) => {
        setError('');

        // Check file size
        if (file.size > maxSize) {
            setError(`File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`);
            return false;
        }

        // Check file type if accept is specified
        if (accept) {
            const acceptedTypes = accept.split(',').map(t => t.trim());
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            const isAccepted = acceptedTypes.some(type => {
                if (type.includes('*')) {
                    // Handle wildcards like image/*
                    const baseType = type.split('/')[0];
                    return file.type.startsWith(baseType);
                }
                return type === fileExtension || type === file.type;
            });

            if (!isAccepted) {
                setError(`Invalid file type. Accepted: ${accept}`);
                return false;
            }
        }

        return true;
    }, [accept, maxSize]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            if (multiple) {
                // Validate and pass all valid files
                const validFiles = files.filter(file => validateFile(file));
                if (validFiles.length > 0) {
                    validFiles.forEach(file => onFileSelect(file));
                }
            } else {
                // Single file mode - only take first file
                if (validateFile(files[0])) {
                    onFileSelect(files[0]);
                }
            }
        }
    }, [onFileSelect, multiple, validateFile]);

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            if (multiple) {
                // Validate and pass all valid files
                const validFiles = files.filter(file => validateFile(file));
                if (validFiles.length > 0) {
                    validFiles.forEach(file => onFileSelect(file));
                }
            } else {
                // Single file mode - only take first file
                if (validateFile(files[0])) {
                    onFileSelect(files[0]);
                }
            }
        }
        // Reset input so the same file can be selected again
        e.target.value = '';
    };

    return (
        <div className="w-full">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative group overflow-hidden rounded-[2rem] transition-all duration-700
                    ${minimized ? 'p-5' : 'p-12'}
                    ${isDragging
                        ? 'bg-indigo-50/50 dark:bg-indigo-500/10 scale-[1.01]'
                        : 'bg-gray-50/30 dark:bg-white/[0.01] hover:bg-white dark:hover:bg-white/[0.03]'
                    }
                    border-2 border-dashed
                    ${isDragging ? 'border-indigo-500' : 'border-gray-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50'}
                    text-center
                `}
            >
                {/* AI Scanning Animation Layer */}
                {isDragging && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-500/20 to-transparent animate-scan-fast" />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
                    </div>
                )}

                <div className="absolute -inset-24 bg-indigo-500/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
 
                <div className={`relative pointer-events-none flex ${minimized ? 'flex-row items-center gap-4 text-left' : 'flex-col items-center'}`}>
                    <div className={`
                        flex items-center justify-center transition-all duration-700 shrink-0
                        ${minimized 
                            ? 'h-12 w-12 rounded-xl' 
                            : 'mx-auto h-24 w-24 mb-8 rounded-[2rem]'
                        }
                        ${isDragging 
                            ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 rotate-12 scale-110' 
                            : 'bg-white dark:bg-gray-900 text-indigo-500 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/10 group-hover:scale-105 group-hover:-rotate-6'}
                    `}>
                        <svg className={`${minimized ? 'w-6 h-6' : 'w-12 h-12'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 15L17.5 17.625 14.875 18.375l2.625.75L18.25 21.75l.75-2.625 2.625-.75-2.625-.75L18.25 15zM15.75 2.25l.75 2.625 2.625.75-2.625.75L15.75 9l-.75-2.625-2.625-.75L15.75 2.25z" />
                        </svg>
                    </div>
 
                    <div className="min-w-0 flex-1">
                        <h3 className={`font-black text-gray-900 dark:text-white tracking-tighter ${minimized ? 'text-lg mb-0.5' : 'text-3xl mb-3'}`}>
                            {minimized ? (multiple ? 'Add More Assets' : 'Change Asset') : (label || 'Initiate Processing')}
                        </h3>
                        {!minimized && (
                            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-[280px] mx-auto leading-relaxed">
                                {description || 'Drag your assets here or tap to explore files'}
                            </p>
                        )}
                        {minimized && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate">
                                Tap here to replace the current selection
                            </p>
                        )}
                    </div>
                    
                    {!minimized && (
                        <div className="mt-10 flex items-center justify-center gap-2">
                            <div className="flex gap-1">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-1 h-1 rounded-full bg-indigo-500/40 animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />
                                ))}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500/60">Neural Engine Ready</span>
                            <div className="flex gap-1">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-1 h-1 rounded-full bg-indigo-500/40 animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
 
            {error && (
                <div className={`${minimized ? 'mt-4 p-3' : 'mt-8 p-5'} bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-[1.5rem]`}>
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest flex items-center gap-3 justify-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        Fault: {error}
                    </p>
                </div>
            )}
        </div>
    );
}
