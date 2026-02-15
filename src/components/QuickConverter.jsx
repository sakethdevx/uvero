import { useState } from 'react';
import Dropzone from '../shared/Dropzone';
import Button from '../shared/Button';
import ProgressBar from '../shared/ProgressBar';
import { useMode } from '../context/ModeContext';
import imageCompressorProcessor from '../tools/image/image-compressor/processor';
import imageConverterProcessor from '../tools/image/image-converter/processor';
import { processor as imageResizerProcessor } from '../tools/image/image-resizer/processor';
import { processor as imageCropperProcessor } from '../tools/image/image-cropper/processor';
import { processor as backgroundRemoverProcessor } from '../tools/image/background-remover/processor';
import { processor as watermarkProcessor } from '../tools/image/watermark/processor';
import { processor as imageToPdfProcessor } from '../tools/image/image-to-pdf/processor';
import { processor as gifMakerProcessor } from '../tools/image/gif-maker/processor';
import { processor as pdfCompressorProcessor } from '../tools/pdf/pdf-compressor/processor';
import { processor as pdfConverterProcessor } from '../tools/pdf/pdf-converter/processor';
import { processor as pdfSplitterProcessor } from '../tools/pdf/pdf-splitter/processor';
import { processor as pdfMergerProcessor } from '../tools/pdf/pdf-merger/processor';
import { processor as pdfToWordProcessor } from '../tools/pdf/pdf-to-word/processor';
import { processor as pdfToExcelProcessor } from '../tools/pdf/pdf-to-excel/processor';
import { processor as pdfToPowerPointProcessor } from '../tools/pdf/pdf-to-powerpoint/processor';
import { processor as audioCompressorProcessor } from '../tools/audio/audio-compressor/processor';
import { processor as audioConverterProcessor } from '../tools/audio/audio-converter/processor';
import { processor as videoCompressorProcessor } from '../tools/video/video-compressor/processor';
import { processor as videoConverterProcessor } from '../tools/video/video-converter/processor';
import videoToMp3Processor from '../tools/audio/video-to-mp3/processor';
import wordToPdfProcessor from '../tools/pdf/word-to-pdf/processor';
import excelToPdfProcessor from '../tools/pdf/excel-to-pdf/processor';
import powerpointToPdfProcessor from '../tools/pdf/powerpoint-to-pdf/processor';
import epubToPdfProcessor from '../tools/document/epub-to-pdf/processor';
import { processor as rotatePdfProcessor } from '../tools/pdf/rotate-pdf/processor';
import { processor as repairPdfProcessor } from '../tools/pdf/repair-pdf/processor';
import { processor as cropPdfProcessor } from '../tools/pdf/crop-pdf/processor';
import { processor as pageNumbersProcessor } from '../tools/pdf/page-numbers/processor';
import { processor as watermarkPdfProcessor } from '../tools/pdf/watermark-pdf/processor';
import { processor as ocrPdfProcessor } from '../tools/pdf/ocr-pdf/processor';
import { processor as unlockPdfProcessor } from '../tools/pdf/unlock-pdf/processor';
import { processor as protectPdfProcessor } from '../tools/pdf/protect-pdf/processor';

/**
 * Quick Converter Component
 * Allows users to drop files on the landing page and perform operations
 * without navigating to specific tool pages
 */
export default function QuickConverter() {
    const { isOnlineMode: _isOnlineMode } = useMode(); // Reserved for future mode-based filtering
    const [files, setFiles] = useState([]);
    const [selectedOperation, setSelectedOperation] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);
    const [showOptions, setShowOptions] = useState(false);
    
    // Tool-specific options
    const [quality, setQuality] = useState(80); // For image/video compression
    const [outputFormat, setOutputFormat] = useState('png'); // For image/pdf/audio/video conversion
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [pdfCompressionLevel, setPdfCompressionLevel] = useState('balanced'); // For PDF compression: low, balanced, high
    const [pageRange, setPageRange] = useState('all'); // For PDF conversion: all, first
    const [audioBitrate, setAudioBitrate] = useState('192'); // For audio compression
    const [videoQuality, setVideoQuality] = useState('medium'); // For video compression: low, medium, high
    const [pdfSplitMode, setPdfSplitMode] = useState('all'); // For PDF split: all, pages, ranges
    const [pdfTotalPages, setPdfTotalPages] = useState(0); // Total pages in PDF
    const [pdfPageSpec, setPdfPageSpec] = useState(''); // Pages or ranges specification

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
                { id: 'split-pdf', name: 'Split PDF', icon: '✂️' },
                { id: 'merge-pdf', name: 'Merge PDFs', icon: '📑' },
                { id: 'pdf-to-word', name: 'PDF to Word', icon: '📝' },
                { id: 'pdf-to-excel', name: 'PDF to Excel', icon: '📊' },
                { id: 'pdf-to-powerpoint', name: 'PDF to PowerPoint', icon: '📽️' },
                { id: 'edit-pdf', name: 'Edit PDF', icon: '✏️' },
                { id: 'sign-pdf', name: 'Sign PDF', icon: '✍️' },
                { id: 'rotate-pdf', name: 'Rotate PDF', icon: '🔄' },
                { id: 'watermark-pdf', name: 'Watermark PDF', icon: '💧' },
                { id: 'protect-pdf', name: 'Protect PDF', icon: '🔒' },
                { id: 'unlock-pdf', name: 'Unlock PDF', icon: '🔓' },
                { id: 'organize-pdf', name: 'Organize PDF', icon: '📋' },
                { id: 'page-numbers', name: 'Page Numbers', icon: '#️⃣' },
                { id: 'repair-pdf', name: 'Repair PDF', icon: '🔧' },
                { id: 'crop-pdf', name: 'Crop PDF', icon: '✂️' },
                { id: 'redact-pdf', name: 'Redact PDF', icon: '🔏' },
                { id: 'ocr-pdf', name: 'OCR PDF', icon: '👁️' },
                { id: 'compare-pdf', name: 'Compare PDF', icon: '🔍' },
                { id: 'translate-pdf', name: 'Translate PDF', icon: '🌐' }
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
        setShowOptions(false);
        setResults([]);
    };

    const handleRemoveFile = (index) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
        if (files.length === 1) {
            setSelectedOperation('');
            setShowOptions(false);
            setResults([]);
        }
    };

    const handleOperationSelect = async (operationId) => {
        setSelectedOperation(operationId);
        setShowOptions(true);
        setError('');
        setResults([]);
        
        // Set default output formats based on operation
        if (operationId === 'convert-image' || operationId === 'convert-pdf') {
            setOutputFormat('png');
        } else if (operationId === 'convert-audio') {
            setOutputFormat('mp3');
        } else if (operationId === 'video-converter') {
            setOutputFormat('mp4');
        }
        
        // For PDF split, get page info
        if (operationId === 'split-pdf' && files.length > 0) {
            try {
                const pageInfo = await pdfSplitterProcessor.getPageInfo(files[0]);
                setPdfTotalPages(pageInfo.totalPages);
            } catch (err) {
                setError('Failed to read PDF information: ' + err.message);
            }
        }
    };

    const handleProcess = async () => {
        if (!selectedOperation || files.length === 0) return;

        setIsProcessing(true);
        setError('');
        setProgress(0);
        const processedResults = [];

        try {
            // Special handling for merge-pdf - operates on all files at once
            if (selectedOperation === 'merge-pdf') {
                // Validate all files are PDFs
                const allPdfs = files.every(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
                if (!allPdfs) {
                    throw new Error('All files must be PDF files for merging');
                }
                if (files.length < 2) {
                    throw new Error('Please select at least 2 PDF files to merge');
                }

                const mergeResult = await pdfMergerProcessor.merge(
                    files,
                    (prog) => setProgress(prog)
                );
                
                const mergeBlob = await fetch(mergeResult.url).then(r => r.blob());
                URL.revokeObjectURL(mergeResult.url);
                
                const result = {
                    file: new File([mergeBlob], mergeResult.filename, { type: 'application/pdf' }),
                    originalSize: files.reduce((sum, f) => sum + f.size, 0),
                    convertedSize: mergeResult.size,
                    note: `Merged ${files.length} PDF files`
                };
                
                // For merged PDFs, create a pseudo-original that represents all input files
                const mergedOriginal = new File([], `${files.length} PDF files`, { type: 'application/pdf' });
                Object.defineProperty(mergedOriginal, 'size', { value: result.originalSize });
                
                processedResults.push({
                    original: mergedOriginal,
                    result: result,
                    index: 0,
                    isMerged: true,
                    sourceFiles: files.map(f => f.name)
                });
                
                setProgress(100);
                setResults(processedResults);
                setIsProcessing(false);
                return;
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                let result;

                // Update progress
                setProgress(Math.round((i / files.length) * 100));

                switch (selectedOperation) {
                    case 'compress-image':
                        result = await imageCompressorProcessor.compress(
                            file,
                            quality,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        break;

                    case 'convert-image': {
                        const widthNum = width ? parseInt(width) : null;
                        const heightNum = height ? parseInt(height) : null;
                        result = await imageConverterProcessor.convert(
                            file,
                            outputFormat,
                            widthNum,
                            heightNum,
                            true, // maintain aspect ratio
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        break;
                    }

                    case 'resize-image': {
                        const resizeWidth = width ? parseInt(width) : 800;
                        const resizeHeight = height ? parseInt(height) : 600;
                        const resizeResult = await imageResizerProcessor.resize(
                            file,
                            resizeWidth,
                            resizeHeight,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        // Convert to expected format
                        result = {
                            file: new File([await fetch(resizeResult.url).then(r => r.blob())], resizeResult.filename, { type: file.type }),
                            originalSize: file.size,
                            convertedSize: resizeResult.size
                        };
                        break;
                    }

                    case 'crop-image': {
                        // Auto-crop to center 80% of image
                        const cropImg = new Image();
                        const cropUrl = URL.createObjectURL(file);
                        await new Promise((resolve, reject) => {
                            cropImg.onload = resolve;
                            cropImg.onerror = reject;
                            cropImg.src = cropUrl;
                        });
                        const cropWidth = Math.floor(cropImg.width * 0.8);
                        const cropHeight = Math.floor(cropImg.height * 0.8);
                        const cropX = Math.floor(cropImg.width * 0.1);
                        const cropY = Math.floor(cropImg.height * 0.1);
                        URL.revokeObjectURL(cropUrl);
                        
                        const cropResult = await imageCropperProcessor.cropImage(
                            file,
                            { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        const cropBlob = await fetch(cropResult.url).then(r => r.blob());
                        URL.revokeObjectURL(cropResult.url);
                        result = {
                            file: new File([cropBlob], cropResult.filename, { type: 'image/png' }),
                            originalSize: file.size,
                            convertedSize: cropResult.size
                        };
                        break;
                    }

                    case 'remove-background': {
                        const bgRemoveResult = await backgroundRemoverProcessor.removeBackground(
                            file,
                            'medium',
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([bgRemoveResult.blob], bgRemoveResult.filename, { type: 'image/png' }),
                            originalSize: file.size,
                            convertedSize: bgRemoveResult.blob.size
                        };
                        break;
                    }

                    case 'watermark': {
                        // Add default text watermark
                        const watermarkResult = await watermarkProcessor.addWatermark(
                            file,
                            {
                                type: 'text',
                                text: 'FileNext',
                                fontSize: 48,
                                opacity: 0.5,
                                position: 'bottom-right',
                                color: '#ffffff'
                            },
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        const watermarkBlob = await fetch(watermarkResult.url).then(r => r.blob());
                        URL.revokeObjectURL(watermarkResult.url);
                        result = {
                            file: new File([watermarkBlob], watermarkResult.filename, { type: 'image/png' }),
                            originalSize: file.size,
                            convertedSize: watermarkResult.size
                        };
                        break;
                    }

                    case 'image-to-pdf': {
                        const pdfFromImageBlob = await imageToPdfProcessor.convert(
                            [file],
                            'fit',
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([pdfFromImageBlob], file.name.replace(/\.[^/.]+$/, '.pdf'), { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: pdfFromImageBlob.size
                        };
                        break;
                    }

                    case 'compress-pdf': {
                        const pdfBlob = await pdfCompressorProcessor.compress(
                            file,
                            pdfCompressionLevel,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([pdfBlob], file.name.replace(/\.pdf$/i, '_compressed.pdf'), { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: pdfBlob.size
                        };
                        break;
                    }

                    case 'convert-pdf': {
                        const pdfImages = await pdfConverterProcessor.convert(
                            file,
                            outputFormat,
                            pageRange,
                            '',
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        // For PDF conversion, we get multiple images, so we'll process the first one
                        // and add a note about multiple pages
                        if (pdfImages.length > 0) {
                            const firstImage = pdfImages[0];
                            result = {
                                file: new File([firstImage.blob], `${file.name.replace(/\.pdf$/i, '')}_page1.${outputFormat}`, { type: firstImage.blob.type }),
                                originalSize: file.size,
                                convertedSize: firstImage.blob.size,
                                note: pdfImages.length > 1 ? `Converted ${pdfImages.length} pages (showing first page)` : null
                            };
                        }
                        break;
                    }

                    case 'compress-audio': {
                        const audioBlob = await audioCompressorProcessor.compress(
                            file,
                            parseInt(audioBitrate),
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([audioBlob], file.name.replace(/\.[^.]+$/, '.mp3'), { type: 'audio/mpeg' }),
                            originalSize: file.size,
                            convertedSize: audioBlob.size
                        };
                        break;
                    }

                    case 'convert-audio': {
                        const convertedAudio = await audioConverterProcessor.convert(
                            file,
                            outputFormat,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([convertedAudio.blob], convertedAudio.filename, { type: convertedAudio.blob.type }),
                            originalSize: file.size,
                            convertedSize: convertedAudio.blob.size
                        };
                        break;
                    }

                    case 'compress-video': {
                        const videoBlob = await videoCompressorProcessor.compress(
                            file,
                            videoQuality,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([videoBlob], file.name.replace(/\.[^.]+$/, '_compressed.mp4'), { type: 'video/mp4' }),
                            originalSize: file.size,
                            convertedSize: videoBlob.size
                        };
                        break;
                    }

                    case 'video-converter': {
                        const convertedVideo = await videoConverterProcessor.convert(
                            file,
                            outputFormat,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([convertedVideo.blob], convertedVideo.filename, { type: convertedVideo.blob.type }),
                            originalSize: file.size,
                            convertedSize: convertedVideo.blob.size
                        };
                        break;
                    }

                    case 'video-to-mp3': {
                        const mp3Result = await videoToMp3Processor.convert(
                            file,
                            parseInt(audioBitrate) || 192,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([mp3Result.blob], mp3Result.filename, { type: 'audio/mpeg' }),
                            originalSize: file.size,
                            convertedSize: mp3Result.blob.size
                        };
                        break;
                    }

                    case 'video-to-gif': {
                        const gifResult = await gifMakerProcessor.createGIF(
                            [file],
                            'video',
                            {
                                frameDelay: 100,
                                quality: 10,
                                width: 480,
                                loop: 0
                            },
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        const gifBlob = await fetch(gifResult.url).then(r => r.blob());
                        URL.revokeObjectURL(gifResult.url);
                        result = {
                            file: new File([gifBlob], gifResult.filename, { type: 'image/gif' }),
                            originalSize: file.size,
                            convertedSize: gifResult.size
                        };
                        break;
                    }

                    case 'word-to-pdf': {
                        const wordPdfBlob = await wordToPdfProcessor.convert(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([wordPdfBlob], file.name.replace(/\.(doc|docx)$/i, '.pdf'), { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: wordPdfBlob.size
                        };
                        break;
                    }

                    case 'excel-to-pdf': {
                        const excelPdfBlob = await excelToPdfProcessor.convert(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([excelPdfBlob], file.name.replace(/\.(xls|xlsx)$/i, '.pdf'), { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: excelPdfBlob.size
                        };
                        break;
                    }

                    case 'powerpoint-to-pdf': {
                        const pptPdfBlob = await powerpointToPdfProcessor.convert(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([pptPdfBlob], file.name.replace(/\.(ppt|pptx)$/i, '.pdf'), { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: pptPdfBlob.size
                        };
                        break;
                    }

                    case 'epub-to-pdf': {
                        const epubPdfBlob = await epubToPdfProcessor.convert(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([epubPdfBlob], file.name.replace(/\.epub$/i, '.pdf'), { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: epubPdfBlob.size
                        };
                        break;
                    }

                    case 'split-pdf': {
                        const splitResult = await pdfSplitterProcessor.split(
                            file,
                            pdfSplitMode,
                            pdfPageSpec,
                            pdfTotalPages,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        // For split PDF, we get multiple files
                        // We'll return them all in a special format
                        result = {
                            files: splitResult.files,
                            originalSize: file.size,
                            isSplit: true
                        };
                        break;
                    }

                    case 'pdf-to-word': {
                        const wordResult = await pdfToWordProcessor.convert(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([wordResult.blob], file.name.replace(/\.pdf$/i, '.docx'), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
                            originalSize: file.size,
                            convertedSize: wordResult.blob.size
                        };
                        break;
                    }

                    case 'pdf-to-excel': {
                        const excelResult = await pdfToExcelProcessor.convert(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([excelResult.blob], file.name.replace(/\.pdf$/i, '.xlsx'), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
                            originalSize: file.size,
                            convertedSize: excelResult.blob.size
                        };
                        break;
                    }

                    case 'pdf-to-powerpoint': {
                        const pptResult = await pdfToPowerPointProcessor.convert(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([pptResult.blob], file.name.replace(/\.pdf$/i, '.pptx'), { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }),
                            originalSize: file.size,
                            convertedSize: pptResult.blob.size
                        };
                        break;
                    }

                    case 'rotate-pdf': {
                        const rotatedBlob = await rotatePdfProcessor.rotate(
                            file,
                            90,
                            'all',
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([rotatedBlob], `rotated_${file.name}`, { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: rotatedBlob.size,
                            note: 'Rotated 90° clockwise'
                        };
                        break;
                    }

                    case 'repair-pdf': {
                        const repairResult = await repairPdfProcessor.repair(
                            file,
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([repairResult.blob], `repaired_${file.name}`, { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: repairResult.blob.size,
                            note: `Recovered ${repairResult.pagesRecovered} pages`
                        };
                        break;
                    }

                    case 'crop-pdf': {
                        const croppedBlob = await cropPdfProcessor.crop(
                            file,
                            { top: 20, right: 20, bottom: 20, left: 20, allPages: true },
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([croppedBlob], `cropped_${file.name}`, { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: croppedBlob.size,
                            note: 'Cropped with 20pt margins'
                        };
                        break;
                    }

                    case 'page-numbers': {
                        const numberedBlob = await pageNumbersProcessor.addPageNumbers(
                            file,
                            { position: 'bottom-center', startNumber: 1, fontSize: 12, format: 'plain', color: '#000000', margin: 30 },
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([numberedBlob], `numbered_${file.name}`, { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: numberedBlob.size,
                            note: 'Added page numbers (bottom center)'
                        };
                        break;
                    }

                    case 'watermark-pdf': {
                        const watermarkedBlob = await watermarkPdfProcessor.addWatermark(
                            file,
                            { type: 'text', text: 'CONFIDENTIAL', fontSize: 48, color: '#ff0000', opacity: 0.3, rotation: -45, position: 'center' },
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([watermarkedBlob], `watermarked_${file.name}`, { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: watermarkedBlob.size,
                            note: 'Added "CONFIDENTIAL" watermark'
                        };
                        break;
                    }

                    case 'ocr-pdf': {
                        const ocrResult = await ocrPdfProcessor.processOCR(
                            file,
                            'eng',
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        const ocrBlob = ocrResult.blob;
                        result = {
                            file: new File([ocrBlob], ocrResult.filename, { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: ocrBlob.size,
                            note: `Extracted text from ${ocrResult.totalPages} pages`
                        };
                        break;
                    }

                    case 'unlock-pdf': {
                        const unlockedBlob = await unlockPdfProcessor.unlock(
                            file,
                            '',
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([unlockedBlob], `unlocked_${file.name}`, { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: unlockedBlob.size
                        };
                        break;
                    }

                    case 'protect-pdf': {
                        const protectedBlob = await protectPdfProcessor.protect(
                            file,
                            'password',
                            { allowPrinting: true, allowCopying: false },
                            (prog) => setProgress(Math.round((i / files.length) * 100 + prog / files.length))
                        );
                        result = {
                            file: new File([protectedBlob], `protected_${file.name}`, { type: 'application/pdf' }),
                            originalSize: file.size,
                            convertedSize: protectedBlob.size,
                            note: 'Protected with password'
                        };
                        break;
                    }

                    case 'edit-pdf':
                    case 'sign-pdf':
                    case 'organize-pdf':
                    case 'redact-pdf':
                    case 'compare-pdf':
                    case 'translate-pdf':
                        throw new Error(`"${selectedOperation}" requires the full tool interface. Please visit the dedicated tool page at /${selectedOperation} for this operation.`);

                    default:
                        throw new Error(`Operation ${selectedOperation} is not yet supported in Quick Converter. Please use the dedicated tool page.`);
                }

                processedResults.push({
                    original: file,
                    result: result,
                    index: i
                });
            }

            setProgress(100);
            setResults(processedResults);
        } catch (err) {
            setError(err.message || 'Processing failed. Please try again.');
            console.error('Processing error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = (result) => {
        if (!result || !result.file) return;

        const url = URL.createObjectURL(result.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadAll = () => {
        results.forEach(({ result }) => {
            handleDownload(result);
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
                                        setShowOptions(false);
                                        setResults([]);
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
                        {availableOperations.length > 0 && !showOptions && !results.length && (
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

                        {/* Tool Options */}
                        {showOptions && !isProcessing && !results.length && (
                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Settings
                                    </h3>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setShowOptions(false);
                                            setSelectedOperation('');
                                        }}
                                    >
                                        Back
                                    </Button>
                                </div>

                                {/* Image Compression Options */}
                                {selectedOperation === 'compress-image' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Quality: {quality}%
                                            </label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="100"
                                                value={quality}
                                                onChange={(e) => setQuality(parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Lower quality = smaller file size
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Image Conversion Options */}
                                {selectedOperation === 'convert-image' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Output Format
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['png', 'jpg', 'webp'].map((format) => (
                                                    <button
                                                        key={format}
                                                        onClick={() => setOutputFormat(format)}
                                                        className={`p-3 rounded-lg border-2 transition-all uppercase font-semibold ${
                                                            outputFormat === format
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {format}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Width (optional)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={width}
                                                    onChange={(e) => setWidth(e.target.value)}
                                                    placeholder="Auto"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Height (optional)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={height}
                                                    onChange={(e) => setHeight(e.target.value)}
                                                    placeholder="Auto"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Leave empty to keep original dimensions. Aspect ratio will be maintained.
                                        </p>
                                    </div>
                                )}

                                {/* Image Resizing Options */}
                                {selectedOperation === 'resize-image' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Width (pixels)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={width}
                                                    onChange={(e) => setWidth(e.target.value)}
                                                    placeholder="800"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Height (pixels)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={height}
                                                    onChange={(e) => setHeight(e.target.value)}
                                                    placeholder="600"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Specify target dimensions. Defaults to 800x600 if not specified.
                                        </p>
                                    </div>
                                )}

                                {/* PDF Compression Options */}
                                {selectedOperation === 'compress-pdf' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Compression Level
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['low', 'balanced', 'high'].map((level) => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setPdfCompressionLevel(level)}
                                                        className={`p-3 rounded-lg border-2 transition-all capitalize font-semibold ${
                                                            pdfCompressionLevel === level
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Higher compression = smaller file size but may reduce quality
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* PDF Conversion Options */}
                                {selectedOperation === 'convert-pdf' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Output Format
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['png', 'jpg'].map((format) => (
                                                    <button
                                                        key={format}
                                                        onClick={() => setOutputFormat(format)}
                                                        className={`p-3 rounded-lg border-2 transition-all uppercase font-semibold ${
                                                            outputFormat === format
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {format}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Pages to Convert
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: 'all', label: 'All Pages' },
                                                    { id: 'first', label: 'First Page' }
                                                ].map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => setPageRange(option.id)}
                                                        className={`p-3 rounded-lg border-2 transition-all font-semibold ${
                                                            pageRange === option.id
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PDF Split Options */}
                                {selectedOperation === 'split-pdf' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                PDF has {pdfTotalPages} {pdfTotalPages === 1 ? 'page' : 'pages'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Split Mode
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { id: 'all', label: 'All Pages', desc: 'Each page as separate PDF' },
                                                    { id: 'pages', label: 'Specific Pages', desc: 'Select pages to extract' },
                                                    { id: 'ranges', label: 'Page Ranges', desc: 'Split by ranges' }
                                                ].map((mode) => (
                                                    <button
                                                        key={mode.id}
                                                        onClick={() => {
                                                            setPdfSplitMode(mode.id);
                                                            setPdfPageSpec('');
                                                        }}
                                                        className={`p-3 rounded-lg border-2 transition-all font-semibold text-left ${
                                                            pdfSplitMode === mode.id
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        <div className="text-sm">{mode.label}</div>
                                                        <div className="text-xs opacity-70 mt-1">{mode.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {(pdfSplitMode === 'pages' || pdfSplitMode === 'ranges') && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {pdfSplitMode === 'pages' ? 'Page Numbers' : 'Page Ranges'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pdfPageSpec}
                                                    onChange={(e) => setPdfPageSpec(e.target.value)}
                                                    placeholder={pdfSplitMode === 'pages' ? 'e.g., 1,3,5' : 'e.g., 1-3,5-7'}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {pdfSplitMode === 'pages' 
                                                        ? 'Enter page numbers separated by commas (e.g., 1,3,5)'
                                                        : 'Enter page ranges separated by commas (e.g., 1-3,5-7)'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Audio Compression Options */}
                                {selectedOperation === 'compress-audio' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Bitrate: {audioBitrate} kbps
                                            </label>
                                            <div className="grid grid-cols-4 gap-3">
                                                {['128', '192', '256', '320'].map((bitrate) => (
                                                    <button
                                                        key={bitrate}
                                                        onClick={() => setAudioBitrate(bitrate)}
                                                        className={`p-3 rounded-lg border-2 transition-all font-semibold ${
                                                            audioBitrate === bitrate
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {bitrate}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Lower bitrate = smaller file size but may reduce audio quality
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Audio Conversion Options */}
                                {selectedOperation === 'convert-audio' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Output Format
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['mp3', 'wav', 'ogg'].map((format) => (
                                                    <button
                                                        key={format}
                                                        onClick={() => setOutputFormat(format)}
                                                        className={`p-3 rounded-lg border-2 transition-all uppercase font-semibold ${
                                                            outputFormat === format
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {format}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Video Compression Options */}
                                {selectedOperation === 'compress-video' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Quality Level
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['low', 'medium', 'high'].map((level) => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setVideoQuality(level)}
                                                        className={`p-3 rounded-lg border-2 transition-all capitalize font-semibold ${
                                                            videoQuality === level
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Lower quality = smaller file size
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Video Conversion Options */}
                                {selectedOperation === 'video-converter' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Output Format
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['mp4', 'webm', 'avi'].map((format) => (
                                                    <button
                                                        key={format}
                                                        onClick={() => setOutputFormat(format)}
                                                        className={`p-3 rounded-lg border-2 transition-all uppercase font-semibold ${
                                                            outputFormat === format
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-gray-200 hover:border-primary-300'
                                                        }`}
                                                    >
                                                        {format}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-center pt-4">
                                    <Button
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        className="px-8 py-3 text-lg"
                                    >
                                        {isProcessing ? 'Processing...' : 'Start Conversion'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar */}
                        {isProcessing && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Processing...
                                </h3>
                                <ProgressBar progress={progress} />
                                <p className="text-sm text-gray-600 text-center">
                                    Processing {files.length} file{files.length > 1 ? 's' : ''}...
                                </p>
                            </div>
                        )}

                        {/* Results */}
                        {results.length > 0 && (
                            <div className="space-y-4 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        ✅ Conversion Complete!
                                    </h3>
                                    {results.length > 1 && (
                                        <Button
                                            onClick={handleDownloadAll}
                                            variant="secondary"
                                        >
                                            Download All
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {results.map(({ original, result }, index) => (
                                        <div key={index}>
                                            {result.isSplit ? (
                                                // Split PDF results - show multiple files
                                                <div className="space-y-2">
                                                    <p className="font-medium text-gray-900 mb-2">
                                                        Split {original.name} into {result.files.length} {result.files.length === 1 ? 'file' : 'files'}
                                                    </p>
                                                    {result.files.map((splitFile, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                                                        >
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900 text-sm">
                                                                    {splitFile.filename}
                                                                </p>
                                                                <p className="text-xs text-gray-600">
                                                                    {formatFileSize(splitFile.size)} • {splitFile.pages} {splitFile.pages === 1 ? 'page' : 'pages'}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                onClick={() => {
                                                                    const a = document.createElement('a');
                                                                    a.href = splitFile.url;
                                                                    a.download = splitFile.filename;
                                                                    document.body.appendChild(a);
                                                                    a.click();
                                                                    document.body.removeChild(a);
                                                                }}
                                                                className="ml-4"
                                                                size="sm"
                                                            >
                                                                Download
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                // Regular results - single file
                                                <div
                                                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                                                >
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">
                                                            {result.file.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {formatFileSize(original.size)} → {formatFileSize(result.file.size)}
                                                            {result.originalSize && result.convertedSize && (
                                                                <span className="ml-2 text-green-600 font-semibold">
                                                                    ({Math.round((1 - result.convertedSize / result.originalSize) * 100)}% smaller)
                                                                </span>
                                                            )}
                                                        </p>
                                                        {result.note && (
                                                            <p className="text-xs text-blue-600 mt-1">
                                                                ℹ️ {result.note}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        onClick={() => handleDownload(result)}
                                                        className="ml-4"
                                                    >
                                                        Download
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setFiles([]);
                                            setSelectedOperation('');
                                            setShowOptions(false);
                                            setResults([]);
                                        }}
                                    >
                                        Convert More Files
                                    </Button>
                                </div>
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
                    Select files, choose an operation, customize settings, and download - all without leaving this page!
                </p>
            </div>
        </div>
    );
}
