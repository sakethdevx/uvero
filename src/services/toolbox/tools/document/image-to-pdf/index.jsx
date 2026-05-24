import { useState, useCallback } from 'react';
import { useImageToPdf } from './hooks';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { MAX_FILES } from '../shared/pdfConstants';
import { SUPPORTED_IMAGE_TYPES, SUPPORTED_EXTENSIONS, PAGE_SIZES, ORIENTATIONS } from '../shared/pdfComposition/compositionConstants';

export const metadata = {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    category: 'document',
    keywords: ['image', 'convert', 'pdf', 'offline', 'jpg', 'png', 'local'],
    icon: '🖼️',
    offline: true,
    experimental: false,
    multiFile: true,
    pageBased: false,
    securityTool: false,
    workspace: 'pdf-tools',
    processing: 'local-react',
    accepts: SUPPORTED_EXTENSIONS,
    maxFiles: 100
};

export default function ImageToPdfTool({ initialFiles = [], embedded = false }) {
    const [files, setFiles] = useState(initialFiles);
    const [options, setOptions] = useState({
        pageSize: 'A4',
        margin: 0,
        orientation: ORIENTATIONS.AUTO,
        scaleToFit: true,
        centerImage: true,
    });

    const { isProcessing, progress, error, resultPdf, generatePdf, clearResult } = useImageToPdf();

    const handleFileSelect = useCallback((file) => {
        setFiles(prev => {
            if (prev.length >= MAX_FILES) return prev;
            return [...prev, file];
        });
        clearResult();
    }, [clearResult]);

    const handleRemoveFile = (indexToRemove) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        clearResult();
    };

    const handleOptionChange = (key, value) => {
        setOptions(prev => ({ ...prev, [key]: value }));
        clearResult();
    };

    const handleProcess = async () => {
        if (files.length === 0) return;
        await generatePdf(files, options);
    };

    if (resultPdf && !isProcessing) {
        return (
            <div className="space-y-6">
                <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">PDF Generated Successfully</h3>
                        <p className="text-sm opacity-90 text-green-700 mt-1">
                            {files.length} images compiled securely inside your browser.
                        </p>
                    </div>
                </div>

                <div className="tool-workspace-row flex justify-between items-center gap-4 p-4">
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{resultPdf.name}</span>
                        <span className="text-sm text-gray-500">{(resultPdf.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <Button
                        as="a"
                        href={resultPdf.url}
                        download={resultPdf.name}
                        target="_blank"
                        rel="noreferrer"
                        className="!py-2 !px-4"
                    >
                        Download PDF
                    </Button>
                </div>

                <div className="flex justify-center mt-6">
                    <Button
                        onClick={() => {
                            clearResult();
                            setFiles([]);
                        }}
                        className="text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 bg-transparent"
                    >
                        Convert More Images
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {!embedded && !isProcessing && (
                <Dropzone
                    onFileSelect={handleFileSelect}
                    accept={SUPPORTED_IMAGE_TYPES.join(',')}
                    multiple={true}
                    minimized={files.length > 0}
                    disabled={files.length >= MAX_FILES}
                    description={`Drop images here (${SUPPORTED_EXTENSIONS.join(', ')}). Max ${MAX_FILES} files.`}
                />
            )}

            {files.length > 0 && !isProcessing && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Composition Options
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 tool-workspace-section">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Page Size
                            </label>
                            <select
                                className="tool-workspace-input px-3 py-2"
                                value={options.pageSize}
                                onChange={(e) => handleOptionChange('pageSize', e.target.value)}
                            >
                                <option value="FIT">Fit to Image (Original Size)</option>
                                {Object.keys(PAGE_SIZES).map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>

                        {options.pageSize !== 'FIT' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Orientation
                                </label>
                                <select
                                    className="tool-workspace-input px-3 py-2"
                                    value={options.orientation}
                                    onChange={(e) => handleOptionChange('orientation', e.target.value)}
                                >
                                    <option value={ORIENTATIONS.PORTRAIT}>Portrait</option>
                                    <option value={ORIENTATIONS.LANDSCAPE}>Landscape</option>
                                    <option value={ORIENTATIONS.AUTO}>Auto Match Image</option>
                                </select>
                            </div>
                        )}

                        <div className="md:col-span-2 space-y-2 mt-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={options.scaleToFit}
                                    onChange={(e) => handleOptionChange('scaleToFit', e.target.checked)}
                                    className="h-4 w-4 tool-workspace-check rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    Scale to fit page (preserve aspect ratio)
                                </span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={options.centerImage}
                                    onChange={(e) => handleOptionChange('centerImage', e.target.checked)}
                                    className="h-4 w-4 tool-workspace-check rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    Center image on page
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {files.map((file, i) => (
                            <FileInfo
                                key={`${file.name}-${i}`}
                                file={file}
                                onRemove={() => handleRemoveFile(i)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {isProcessing && (
                <div className="space-y-4 pt-4">
                    <ProgressBar progress={progress} label="Building PDF..." />
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Processing images offline within your browser...
                    </p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                    <p className="font-semibold text-sm">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {files.length > 0 && !isProcessing && (
                <div className="flex justify-end gap-3 border-t dark:border-gray-800 pt-6 mt-6">
                    <Button
                        onClick={() => {
                            clearResult();
                            setFiles([]);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
                    >
                        Clear All
                    </Button>
                    <Button
                        onClick={handleProcess}
                    >
                        Generate PDF
                    </Button>
                </div>
            )}
        </div>
    );
}
