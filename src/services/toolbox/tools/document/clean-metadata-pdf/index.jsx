import { useState, useCallback, useEffect } from 'react';
import { useCleanMetadataPdf } from './hooks';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import { MAX_FILES } from '../shared/pdfConstants';
import { METADATA_PROFILES, METADATA_FIELDS } from '../shared/pdfMetadata/metadataConstants';
import { getProfileOptions } from '../shared/pdfMetadata/metadataProfiles';
import { loadPdfLib } from '../shared/pdfEngine';
import { loadFileAsArrayBuffer } from '../shared/pdfUtils';
import { extractMetadata } from '../shared/pdfMetadata/metadataExtractor';

export const metadata = {
    id: 'clean-metadata-pdf',
    name: 'Clean PDF Metadata',
    category: 'document',
    keywords: ['clean', 'metadata', 'remove', 'pdf', 'offline', 'local', 'privacy', 'sanitize'],
    icon: '🧹',
    offline: true,
    experimental: false
};

export default function CleanMetadataPdfTool() {
    const [files, setFiles] = useState([]);
    const [profile, setProfile] = useState(METADATA_PROFILES.FULL_CLEAN);
    const [customFields, setCustomFields] = useState([]);
    const [previewMetadata, setPreviewMetadata] = useState(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const { process, cancel, reset, isProcessing, progress, progressMessage, error, result } = useCleanMetadataPdf();

    const loadMetadataPreview = async (file) => {
        setIsPreviewLoading(true);
        try {
            const pdfLib = await loadPdfLib();
            const arrayBuffer = await loadFileAsArrayBuffer(file);
            const pdfDoc = await pdfLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const extracted = extractMetadata(pdfDoc);
            setPreviewMetadata(extracted);
        } catch (e) {
            console.error("Failed to load metadata preview", e);
            setPreviewMetadata(null);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleFileSelect = useCallback((newFile) => {
        setFiles([newFile]); // Intentionally overwrite to support single file processing easily
        loadMetadataPreview(newFile);
        if (result) reset();
    }, [result, reset]);

    const handleRemove = () => {
        setFiles([]);
        setPreviewMetadata(null);
        if (result) reset();
    };

    const handleProcess = () => {
        process(files, {
            profile,
            fieldsToRemove: profile === 'custom' ? customFields : []
        });
    };

    const handleDownload = () => {
        if (result?.blob) {
            const url = URL.createObjectURL(result.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleCustomFieldToggle = (field) => {
        setCustomFields(prev =>
            prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!result && !isProcessing && (
                <Dropzone
                    accept="application/pdf"
                    onFileSelect={handleFileSelect}
                    multiple={false}
                    description="Drag & drop a PDF file here or click to browse"
                />
            )}

            {files.length > 0 && !result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-medium text-lg">Clean Metadata</h3>
                        <div className="text-sm text-gray-500">
                            {files[0].name} ({formatBytes(files[0].size)})
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left column: Options */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Sanitization Profile
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    value={profile}
                                    onChange={(e) => setProfile(e.target.value)}
                                >
                                    <option value={METADATA_PROFILES.BASIC}>Basic (Author, Subject, Keywords)</option>
                                    <option value={METADATA_PROFILES.PRIVACY}>Privacy (Basic + Title, Creator, Producer)</option>
                                    <option value={METADATA_PROFILES.FULL_CLEAN}>Full Clean (Privacy + Dates)</option>
                                    <option value="custom">Custom Selection</option>
                                </select>
                            </div>

                            {profile === 'custom' && (
                                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fields to Remove</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.values(METADATA_FIELDS).map(field => (
                                            <label key={field} className="flex items-center space-x-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={customFields.includes(field)}
                                                    onChange={() => handleCustomFieldToggle(field)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right column: Preview */}
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-sm overflow-hidden flex flex-col">
                            <h4 className="font-medium mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Current Metadata Overview</h4>

                            {isPreviewLoading ? (
                                <div className="flex justify-center items-center h-32 text-gray-400">
                                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                    Loading preview...
                                </div>
                            ) : previewMetadata ? (
                                <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                                    {Object.entries(previewMetadata).map(([key, val]) => (
                                        <div key={key} className="flex">
                                            <span className="font-medium text-gray-500 dark:text-gray-400 w-1/3 min-w-[100px] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="text-gray-900 dark:text-gray-100 w-2/3 break-all truncate">
                                                {val || <span className="text-gray-400 italic">None</span>}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 italic text-center py-4">Preview unavailable</div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-800">
                            {error.message}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <Button variant="secondary" onClick={handleRemove} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleProcess}
                            disabled={isProcessing || (profile === 'custom' && customFields.length === 0)}
                        >
                            {isProcessing ? 'Processing...' : 'Clean Metadata'}
                        </Button>
                    </div>
                </div>
            )}

            {isProcessing && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <ProgressBar
                        progress={progress}
                        message={progressMessage}
                        onCancel={cancel}
                    />
                </div>
            )}

            {result && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <div>
                        <h3 className="text-xl font-medium mb-2">Metadata Removed Successfully</h3>
                        <p className="text-gray-500">
                            The document has been sanitized based on your selected profile.
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-w-md mx-auto text-left text-sm border border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Cleanup Summary</h4>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Removed Fields:</span>
                                <span className="font-medium">{result.metadata.removedFields.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Original Size:</span>
                                <span className="font-medium">{formatBytes(result.metadata.originalSize)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Cleaned Size:</span>
                                <span className="font-medium">{formatBytes(result.metadata.newSize)}</span>
                            </div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-gray-500 text-xs">Removed:</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                                    {result.metadata.removedFields.length > 0 ? result.metadata.removedFields.join(', ') : 'None'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center space-x-4">
                        <Button variant="secondary" onClick={handleRemove}>
                            Clean Another File
                        </Button>
                        <Button variant="primary" onClick={handleDownload} className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download Cleaned PDF</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
