import { useCallback, useState } from 'react';
import { usePdfToImage } from './hooks';
import Dropzone from '../../../shared/Dropzone';
import Button from '../../../shared/Button';
import ProgressBar from '../../../shared/ProgressBar';
import FileInfo from '../../../shared/FileInfo';
import { PDF_IMAGE_FORMATS, RENDER_QUALITY_PRESETS } from '../shared/pdfRendering/renderConstants';

export const metadata = {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    category: 'document',
    keywords: ['pdf', 'image', 'png', 'jpg', 'webp', 'rasterize', 'export'],
    icon: '🖼️',
    offline: true,
    experimental: false,
    multiFile: true,
    pageBased: true,
    securityTool: false,
    workspace: 'pdf-tools',
    processing: 'local-react',
    accepts: ['.pdf'],
    maxFiles: 100
};

const FORMAT_OPTIONS = [
    { value: PDF_IMAGE_FORMATS.PNG, label: 'PNG' },
    { value: PDF_IMAGE_FORMATS.JPG, label: 'JPG' },
    { value: PDF_IMAGE_FORMATS.WEBP, label: 'WEBP' },
];

const QUALITY_OPTIONS = [
    { value: 'low', label: 'Low', detail: '96 DPI' },
    { value: 'medium', label: 'Medium', detail: '144 DPI' },
    { value: 'high', label: 'High', detail: '216 DPI' },
    { value: 'print-quality', label: 'Print', detail: '300 DPI' },
];

export default function PdfToImageTool({ initialFiles = [] }) {
    const [file, setFile] = useState(initialFiles[0] || null);
    const [options, setOptions] = useState({
        format: PDF_IMAGE_FORMATS.PNG,
        qualityPreset: 'medium',
        pageMode: 'all',
        pageRanges: '',
    });

    const {
        exportImages,
        cancel,
        reset,
        isProcessing,
        progress,
        progressMessage,
        error,
        result,
    } = usePdfToImage();

    const handleFileSelect = useCallback((file) => {
        setFiles([file]);
        reset();
    }, [reset]);

    const handleOptionChange = (key, value) => {
        setOptions((previous) => ({ ...previous, [key]: value }));
        reset();
    };

    const handleExport = () => {
        exportImages([file], options);
    };

    const handleRestart = () => {
        setFiles([]);
        setOptions({
            format: PDF_IMAGE_FORMATS.PNG,
            qualityPreset: 'medium',
            pageMode: 'all',
            pageRanges: '',
        });
        reset();
    };

    const handleDownload = () => {
        if (!result) return;
        const link = document.createElement('a');
        link.href = result.url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const selectedPreset = RENDER_QUALITY_PRESETS[options.qualityPreset];
    const canExport = !!file && (
        options.pageMode === 'all' || options.pageRanges.trim().length > 0
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!file && !result && !isProcessing && (
                <Dropzone
                    accept="application/pdf"
                    onFileSelect={handleFileSelect}
                    multiple={false}
                    description="Drop a PDF here to export pages as PNG, JPG, or WEBP images"
                />
            )}

            {file && !result && (
                <div className="tool-workspace-panel">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="font-medium text-lg">PDF Export Settings</h3>
                        <p className="text-sm text-gray-500">Pages render locally in a worker</p>
                    </div>

                    <FileInfo file={file} onRemove={() => { setFile(null); reset(); }} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Image Format
                            </label>
                            <select
                                className="tool-workspace-input px-3 py-2"
                                value={options.format}
                                onChange={(event) => handleOptionChange('format', event.target.value)}
                                disabled={isProcessing}
                            >
                                {FORMAT_OPTIONS.map((format) => (
                                    <option key={format.value} value={format.value}>{format.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Quality
                            </label>
                            <select
                                className="tool-workspace-input px-3 py-2"
                                value={options.qualityPreset}
                                onChange={(event) => handleOptionChange('qualityPreset', event.target.value)}
                                disabled={isProcessing}
                            >
                                {QUALITY_OPTIONS.map((quality) => (
                                    <option key={quality.value} value={quality.value}>
                                        {quality.label} ({quality.detail})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">
                                Scale {selectedPreset.scale.toFixed(2)}x, quality {Math.round(selectedPreset.imageQuality * 100)}%
                            </p>
                        </div>

                        <div className="space-y-3 md:col-span-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pages</p>
                            <div className="flex flex-wrap gap-3">
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="radio"
                                        name="pageMode"
                                        value="all"
                                        checked={options.pageMode === 'all'}
                                        onChange={(event) => handleOptionChange('pageMode', event.target.value)}
                                        disabled={isProcessing}
                                        className="w-4 h-4 tool-workspace-check"
                                    />
                                    All pages
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="radio"
                                        name="pageMode"
                                        value="ranges"
                                        checked={options.pageMode === 'ranges'}
                                        onChange={(event) => handleOptionChange('pageMode', event.target.value)}
                                        disabled={isProcessing}
                                        className="w-4 h-4 tool-workspace-check"
                                    />
                                    Selected pages
                                </label>
                            </div>

                            {options.pageMode === 'ranges' && (
                                <input
                                    type="text"
                                    value={options.pageRanges}
                                    onChange={(event) => handleOptionChange('pageRanges', event.target.value)}
                                    placeholder="Example: 1-3, 5, 8-10"
                                    disabled={isProcessing}
                                    className="tool-workspace-input px-3 py-2"
                                />
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-5 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                            <p className="font-medium">Export Error</p>
                            <p>{error.message}</p>
                        </div>
                    )}

                    {isProcessing ? (
                        <div className="space-y-4 mt-5">
                            <ProgressBar progress={progress} />
                            <div className="flex justify-between items-center gap-4 text-sm text-gray-500">
                                <p>{progressMessage}</p>
                                <Button onClick={cancel} variant="outline" className="text-red-500 border-red-200">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-3 mt-6">
                            <Button onClick={handleRestart} variant="outline">
                                Clear
                            </Button>
                            <Button
                                onClick={handleExport}
                                disabled={!canExport}
                                className={!canExport ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                                Export Images
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {result && (
                <div className="tool-workspace-result space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-2">Export Complete</h2>
                        <p className="text-gray-500">
                            Exported {result.metadata.pageCount} page{result.metadata.pageCount === 1 ? '' : 's'} as {result.metadata.format.toUpperCase()}.
                        </p>
                        <div className="flex justify-center gap-4 text-sm text-gray-500 mt-2 flex-wrap">
                            <span>{result.metadata.dpi} DPI</span>
                            <span>{result.outputType === 'zip' ? 'ZIP package' : 'Single image'}</span>
                            <span>{(result.blob.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <Button onClick={handleRestart} variant="outline">
                            Start Over
                        </Button>
                        <Button onClick={handleDownload}>
                            Download {result.outputType === 'zip' ? 'ZIP' : 'Image'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
