import { useState, useCallback } from 'react';

/**
 * Reusable Dropzone component for file uploads
 * Supports drag & drop and click-to-upload
 */
export default function Dropzone({ accept, onFileSelect, maxSize = 100 * 1024 * 1024, multiple = false, label, description }) {
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
                    relative group overflow-hidden border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-500
                    ${isDragging
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-500/10 scale-[1.02] ring-4 ring-primary-500/20'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:border-primary-400 dark:hover:border-primary-500/50 hover:bg-white dark:hover:bg-white/[0.05]'
                    }
                `}
            >
                {/* Background Glow Effect */}
                <div className="absolute -inset-24 bg-primary-500/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
 
                <div className="relative pointer-events-none">
                    <div className={`
                        mx-auto h-20 w-20 mb-6 rounded-2xl flex items-center justify-center transition-all duration-500
                        ${isDragging ? 'bg-primary-500 text-white scale-110 rotate-3' : 'bg-white dark:bg-gray-800 text-primary-500 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/10 group-hover:scale-110 group-hover:-rotate-3'}
                    `}>
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
 
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                        {label || 'Drop your file here'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {description || 'or click to browse your computer'}
                    </p>
                    
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <div className="h-px w-8 bg-gray-200 dark:bg-white/10" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Max 100MB</span>
                        <div className="h-px w-8 bg-gray-200 dark:bg-white/10" />
                    </div>
                </div>
            </div>
 
            {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl animate-shake">
                    <p className="text-sm text-red-600 dark:text-red-400 font-bold flex items-center gap-2 justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {error}
                    </p>
                </div>
            )}
        </div>
    );
}
