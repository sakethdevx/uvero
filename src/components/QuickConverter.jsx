import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropzone from '../shared/Dropzone';
import Button from '../shared/Button';
import { useMode } from '../context/ModeContext';

/**
 * Quick Converter Component
 * Allows users to drop files on the landing page and perform operations
 * without navigating to specific tool pages
 */
export default function QuickConverter() {
    const navigate = useNavigate();
    const { isOnlineMode } = useMode();
    const [files, setFiles] = useState([]);
    const [selectedOperation, setSelectedOperation] = useState('');
    const [error, setError] = useState('');

    // Avoid unused variable warnings
    console.log(isOnlineMode); // Mode may affect available operations in future

    // Detect file type and suggest operations
    const getOperationsForFile = (file) => {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        
        const operations = [];

        // Image operations
        if (fileType.startsWith('image/')) {
            operations.push(
                { id: 'compress-image', name: 'Compress Image', icon: '🖼️' },
                { id: 'convert-image', name: 'Convert Image', icon: '🔄' },
                { id: 'resize-image', name: 'Resize Image', icon: '📏' },
                { id: 'crop-image', name: 'Crop Image', icon: '✂️' },
                { id: 'remove-background', name: 'Remove Background', icon: '🎨' },
                { id: 'watermark', name: 'Add Watermark', icon: '©️' },
                { id: 'image-to-pdf', name: 'Convert to PDF', icon: '📄' }
            );
        }

        // PDF operations
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            operations.push(
                { id: 'compress-pdf', name: 'Compress PDF', icon: '📄' },
                { id: 'convert-pdf', name: 'PDF to Image', icon: '🖼️' },
                { id: 'split-pdf', name: 'Split PDF', icon: '✂️' }
            );
        }

        // Audio operations
        if (fileType.startsWith('audio/')) {
            operations.push(
                { id: 'compress-audio', name: 'Compress Audio', icon: '🎵' },
                { id: 'convert-audio', name: 'Convert Audio', icon: '🔄' },
                { id: 'video-to-mp3', name: 'Extract Audio', icon: '🎬' }
            );
        }

        // Video operations
        if (fileType.startsWith('video/')) {
            operations.push(
                { id: 'compress-video', name: 'Compress Video', icon: '🎬' },
                { id: 'video-converter', name: 'Convert Video', icon: '🔄' },
                { id: 'video-to-mp3', name: 'Extract Audio', icon: '🎵' },
                { id: 'video-to-gif', name: 'Convert to GIF', icon: '🎞️' }
            );
        }

        // Document operations
        if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            operations.push(
                { id: 'word-to-pdf', name: 'Word to PDF', icon: '📝' }
            );
        }

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            operations.push(
                { id: 'excel-to-pdf', name: 'Excel to PDF', icon: '📈' }
            );
        }

        if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
            operations.push(
                { id: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', icon: '📊' }
            );
        }

        if (fileName.endsWith('.epub')) {
            operations.push(
                { id: 'epub-to-pdf', name: 'EPUB to PDF', icon: '📚' }
            );
        }

        // If no specific operations, suggest general tools
        if (operations.length === 0) {
            operations.push(
                { id: 'qr-generator', name: 'Generate QR Code', icon: '📱' },
                { id: 'password-generator', name: 'Password Generator', icon: '🔐' },
                { id: 'unit-converter', name: 'Unit Converter', icon: '📏' }
            );
        }

        return operations;
    };

    const handleFileSelect = (file) => {
        setFiles(prevFiles => [...prevFiles, file]);
        setError('');
        setSelectedOperation('');
    };

    const handleRemoveFile = (index) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
        if (files.length === 1) {
            setSelectedOperation('');
        }
    };

    const handleOperationSelect = (operationId) => {
        setSelectedOperation(operationId);
        setError('');
    };

    const handleProcess = () => {
        if (!selectedOperation || files.length === 0) return;

        // Navigate to the tool page with files
        // Store files in sessionStorage for the tool to access
        sessionStorage.setItem('quickConverterFiles', JSON.stringify(
            files.map(f => ({
                name: f.name,
                type: f.type,
                size: f.size
            }))
        ));

        // Store actual file objects in a way that can be retrieved
        // We'll pass the File objects directly via state
        navigate(`/${selectedOperation}`, { 
            state: { 
                files: files,
                fromQuickConverter: true 
            } 
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Get operations based on the first file
    const availableOperations = files.length > 0 ? getOperationsForFile(files[0]) : [];

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    Quick File Converter
                </h2>
                <p className="text-lg text-gray-600">
                    Drop your files here, choose an operation, and convert instantly
                </p>
            </div>

            <div className="card mb-6">
                {files.length === 0 ? (
                    <Dropzone
                        onFileSelect={handleFileSelect}
                        multiple={true}
                        label="Drop your files here"
                        description="Supports images, PDFs, videos, audio, and documents"
                    />
                ) : (
                    <div className="space-y-4">
                        {/* File List */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Selected Files ({files.length})
                                </h3>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setFiles([]);
                                        setSelectedOperation('');
                                    }}
                                >
                                    Clear All
                                </Button>
                            </div>

                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="text-3xl">
                                            {file.type.startsWith('image/') ? '🖼️' :
                                             file.type.startsWith('video/') ? '🎬' :
                                             file.type.startsWith('audio/') ? '🎵' :
                                             file.type === 'application/pdf' ? '📄' : '📁'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFile(index)}
                                        className="ml-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        aria-label="Remove file"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}

                            {/* Add More Files Button */}
                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => {
                                        const newFiles = Array.from(e.target.files);
                                        newFiles.forEach(handleFileSelect);
                                        e.target.value = '';
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 hover:bg-gray-50 transition-all cursor-pointer">
                                    <p className="text-gray-600 font-medium">
                                        ➕ Add More Files
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Operation Selector */}
                        {availableOperations.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Choose an Operation
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {availableOperations.map((operation) => (
                                        <button
                                            key={operation.id}
                                            onClick={() => handleOperationSelect(operation.id)}
                                            className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                                                selectedOperation === operation.id
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-primary-300'
                                            }`}
                                        >
                                            <div className="text-2xl mb-2">{operation.icon}</div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {operation.name}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Process Button */}
                        {selectedOperation && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    onClick={handleProcess}
                                    className="px-8 py-3 text-lg"
                                >
                                    Start Conversion
                                </Button>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="text-center text-sm text-gray-500 space-y-2">
                <p className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-green-600">
                        Your files are processed entirely in your browser - no uploads, 100% private
                    </span>
                </p>
                <p>
                    After selecting an operation, you'll be taken to the tool page where you can customize settings and download results
                </p>
            </div>
        </div>
    );
}
