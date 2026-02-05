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

    const validateFile = (file) => {
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
    };

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
    }, [onFileSelect, accept, maxSize, multiple]);

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
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
          ${isDragging
                        ? 'border-primary-500 bg-primary-50 scale-105'
                        : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                    }
        `}
            >
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="pointer-events-none">
                    <svg
                        className="mx-auto h-16 w-16 text-gray-400 mb-4"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                    >
                        <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    <p className="text-xl font-semibold text-gray-700 mb-2">
                        {label || 'Drop your file here'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        {description || 'or click to browse'}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
                </div>
            )}
        </div>
    );
}
