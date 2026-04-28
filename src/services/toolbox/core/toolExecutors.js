import imageCompressorExecutor from '../tools/image/image-compressor/executor';
import imageConverterExecutor from '../tools/image/image-converter/executor';
import imageResizerExecutor from '../tools/image/image-resizer/executor';
import imageCropperExecutor from '../tools/image/image-cropper/executor';
import gifMakerExecutor from '../tools/image/gif-maker/executor';
import imageToPdfExecutor from '../tools/image/image-to-pdf/executor';
import jpgToPdfExecutor from '../tools/image/jpg-to-pdf/executor';
import pdfToJpgExecutor from '../tools/image/pdf-to-jpg/executor';
import watermarkExecutor from '../tools/image/watermark/executor';
import backgroundRemoverExecutor from '../tools/image/background-remover/executor';
import imageWasmConverterExecutor from '../tools/image/image-wasm-converter/executor';
import videoToMp3Executor from '../tools/audio/video-to-mp3/executor';
import audioCompressorExecutor from '../tools/audio/audio-compressor/executor';
import audioConverterExecutor from '../tools/audio/audio-converter/executor';
import mp3ConverterExecutor from '../tools/audio/mp3-converter/executor';
import mp4ToMp3Executor from '../tools/audio/mp4-to-mp3/executor';
import heicToJpgExecutor from '../tools/image/heic-to-jpg/executor';
import pdfCompressorExecutor from '../tools/pdf/pdf-compressor/executor';
import pdfMergerExecutor from '../tools/pdf/pdf-merger/executor';
import pdfSplitterExecutor from '../tools/pdf/pdf-splitter/executor';
import pageNumbersExecutor from '../tools/pdf/page-numbers/executor';
import rotatePdfExecutor from '../tools/pdf/rotate-pdf/executor';
import protectPdfExecutor from '../tools/pdf/protect-pdf/executor';
import unlockPdfExecutor from '../tools/pdf/unlock-pdf/executor';
import watermarkPdfExecutor from '../tools/pdf/watermark-pdf/executor';
import cropPdfExecutor from '../tools/pdf/crop-pdf/executor';
import organizePdfExecutor from '../tools/pdf/organize-pdf/executor';
import signPdfExecutor from '../tools/pdf/sign-pdf/executor';
import redactPdfExecutor from '../tools/pdf/redact-pdf/executor';
import editPdfExecutor from '../tools/pdf/edit-pdf/executor';
import comparePdfExecutor from '../tools/pdf/compare-pdf/executor';
import repairPdfExecutor from '../tools/pdf/repair-pdf/executor';
import scanToPdfExecutor from '../tools/pdf/scan-to-pdf/executor';
import pdfConverterExecutor from '../tools/pdf/pdf-converter/executor';
import pdfToWordExecutor from '../tools/pdf/pdf-to-word/executor';
import pdfToExcelExecutor from '../tools/pdf/pdf-to-excel/executor';
import pdfToPowerPointExecutor from '../tools/pdf/pdf-to-powerpoint/executor';
import epubToPdfExecutor from '../tools/document/epub-to-pdf/executor';
import htmlToPdfExecutor from '../tools/pdf/html-to-pdf/executor';
import pdfToPdfaExecutor from '../tools/pdf/pdf-to-pdfa/executor';
import ocrPdfExecutor from '../tools/pdf/ocr-pdf/executor';
import translatePdfExecutor from '../tools/pdf/translate-pdf/executor';
import wordToPdfExecutor from '../tools/pdf/word-to-pdf/executor';
import excelToPdfExecutor from '../tools/pdf/excel-to-pdf/executor';
import powerPointToPdfExecutor from '../tools/pdf/powerpoint-to-pdf/executor';
import archiveConverterExecutor from '../tools/archive/archive-converter/executor';
import rarToZipExecutor from '../tools/archive/rar-to-zip/executor';
import videoCompressorExecutor from '../tools/video/video-compressor/executor';
import videoConverterExecutor from '../tools/video/video-converter/executor';
import mp4ConverterExecutor from '../tools/video/mp4-converter/executor';
import videoToGifExecutor from '../tools/video/video-to-gif/executor';
import movToMp4Executor from '../tools/video/mov-to-mp4/executor';
import epubToMobiExecutor from '../tools/document/epub-to-mobi/executor';
import { usesOfflineExecutorInOnlineMode } from './toolMetadata';

const toolExecutors = {
    'compress-image': imageCompressorExecutor,
    'convert-image': imageConverterExecutor,
    'resize-image': imageResizerExecutor,
    'crop-image': imageCropperExecutor,
    'gif-maker': gifMakerExecutor,
    'image-to-pdf': imageToPdfExecutor,
    'jpg-to-pdf': jpgToPdfExecutor,
    'pdf-to-jpg': pdfToJpgExecutor,
    'watermark': watermarkExecutor,
    'remove-background': backgroundRemoverExecutor,
    'image-wasm-converter': imageWasmConverterExecutor,
    'compress-audio': audioCompressorExecutor,
    'convert-audio': audioConverterExecutor,
    'video-to-mp3': videoToMp3Executor,
    'mp3-converter': mp3ConverterExecutor,
    'mp4-to-mp3': mp4ToMp3Executor,
    'heic-to-jpg': heicToJpgExecutor,
    'compress-pdf': pdfCompressorExecutor,
    'merge-pdf': pdfMergerExecutor,
    'split-pdf': pdfSplitterExecutor,
    'page-numbers': pageNumbersExecutor,
    'rotate-pdf': rotatePdfExecutor,
    'protect-pdf': protectPdfExecutor,
    'unlock-pdf': unlockPdfExecutor,
    'watermark-pdf': watermarkPdfExecutor,
    'crop-pdf': cropPdfExecutor,
    'organize-pdf': organizePdfExecutor,
    'sign-pdf': signPdfExecutor,
    'redact-pdf': redactPdfExecutor,
    'edit-pdf': editPdfExecutor,
    'compare-pdf': comparePdfExecutor,
    'repair-pdf': repairPdfExecutor,
    'scan-to-pdf': scanToPdfExecutor,
    'convert-pdf': pdfConverterExecutor,
    'pdf-to-word': pdfToWordExecutor,
    'pdf-to-excel': pdfToExcelExecutor,
    'pdf-to-powerpoint': pdfToPowerPointExecutor,
    'epub-to-pdf': epubToPdfExecutor,
    'html-to-pdf': htmlToPdfExecutor,
    'pdf-to-pdfa': pdfToPdfaExecutor,
    'ocr-pdf': ocrPdfExecutor,
    'translate-pdf': translatePdfExecutor,
    'word-to-pdf': wordToPdfExecutor,
    'excel-to-pdf': excelToPdfExecutor,
    'powerpoint-to-pdf': powerPointToPdfExecutor,
    'archive-converter': archiveConverterExecutor,
    'rar-to-zip': rarToZipExecutor,
    'compress-video': videoCompressorExecutor,
    'convert-video': videoConverterExecutor,
    'mp4-converter': mp4ConverterExecutor,
    'video-to-gif': videoToGifExecutor,
    'mov-to-mp4': movToMp4Executor,
    'epub-to-mobi': epubToMobiExecutor,
};

export function getToolExecutor(toolId) {
    const executor = toolExecutors[toolId] || null;

    if (!executor) {
        return null;
    }

    if (!usesOfflineExecutorInOnlineMode(toolId) || !executor.supportedModes?.includes('offline')) {
        return executor;
    }

    return {
        ...executor,
        supportedModes: ['offline', 'online'],
        async run(input) {
            if ((input.mode || 'offline') === 'online') {
                return executor.run({
                    ...input,
                    mode: 'offline',
                });
            }

            return executor.run(input);
        },
    };
}

export function getSupportedModesForToolId(toolId) {
    return getToolExecutor(toolId)?.supportedModes || null;
}

export function hasToolExecutor(toolId) {
    return !!getToolExecutor(toolId);
}
