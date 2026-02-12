/**
 * Tool Registry
 * Central registry for all available tools
 * Makes it easy to add new tools and maintain routing
 */

import ImageCompressor from './image/image-compressor/ImageCompressor';
import imageCompressorSEO from './image/image-compressor/seo.json';
import ImageConverter from './image/image-converter/ImageConverter';
import imageConverterSEO from './image/image-converter/seo.json';
import ImageToPDF from './image/image-to-pdf/ImageToPDF';
import imageToPDFSEO from './image/image-to-pdf/seo.json';
import ImageResizer from './image/image-resizer/ImageResizer';
import imageResizerSEO from './image/image-resizer/seo.json';
import GIFMaker from './image/gif-maker/GIFMaker';
import gifMakerSEO from './image/gif-maker/seo.json';
import Watermark from './image/watermark/Watermark';
import watermarkSEO from './image/watermark/seo.json';
import ImageCropper from './image/image-cropper/ImageCropper';
import imageCropperSEO from './image/image-cropper/seo.json';
import BackgroundRemover from './image/background-remover/BackgroundRemover';
import backgroundRemoverSEO from './image/background-remover/seo.json';
import PDFCompressor from './pdf/pdf-compressor/PDFCompressor';
import pdfCompressorSEO from './pdf/pdf-compressor/seo.json';
import PDFConverter from './pdf/pdf-converter/PDFConverter';
import pdfConverterSEO from './pdf/pdf-converter/seo.json';
import AudioCompressor from './audio/audio-compressor/AudioCompressor';
import audioCompressorSEO from './audio/audio-compressor/seo.json';
import AudioConverter from './audio/audio-converter/AudioConverter';
import audioConverterSEO from './audio/audio-converter/seo.json';
import VideoToMP3 from './audio/video-to-mp3/VideoToMP3';
import videoToMP3SEO from './audio/video-to-mp3/seo.json';
import PDFMerger from './pdf/pdf-merger/PDFMerger';
import pdfMergerSEO from './pdf/pdf-merger/seo.json';
import PDFSplitter from './pdf/pdf-splitter/PDFSplitter';
import pdfSplitterSEO from './pdf/pdf-splitter/seo.json';
import VideoCompressor from './video/video-compressor/VideoCompressor';
import videoCompressorSEO from './video/video-compressor/seo.json';
import VideoConverter from './video/video-converter/VideoConverter';
import videoConverterSEO from './video/video-converter/seo.json';
import QRGenerator from './utility/qr-generator/QRGenerator';
import qrGeneratorSEO from './utility/qr-generator/seo.json';
import PasswordGenerator from './utility/password-generator/PasswordGenerator';
import passwordGeneratorSEO from './utility/password-generator/seo.json';
import WordToPDF from './pdf/word-to-pdf/WordToPDF';
import wordToPDFSEO from './pdf/word-to-pdf/seo.json';
import HTMLToPDF from './pdf/html-to-pdf/HTMLToPDF';
import htmlToPDFSEO from './pdf/html-to-pdf/seo.json';
import ExcelToPDF from './pdf/excel-to-pdf/ExcelToPDF';
import excelToPDFSEO from './pdf/excel-to-pdf/seo.json';
import PDFToPDFA from './pdf/pdf-to-pdfa/PDFToPDFA';
import pdfToPDFASEO from './pdf/pdf-to-pdfa/seo.json';
import PowerPointToPDF from './pdf/powerpoint-to-pdf/PowerPointToPDF';
import powerpointToPDFSEO from './pdf/powerpoint-to-pdf/seo.json';
import PDFToWord from './pdf/pdf-to-word/PDFToWord';
import PDFToExcel from './pdf/pdf-to-excel/PDFToExcel';
import PDFToPowerPoint from './pdf/pdf-to-powerpoint/PDFToPowerPoint';
import pdfToWordSEO from './pdf/pdf-to-word/seo.json';
import pdfToPowerpointSEO from './pdf/pdf-to-powerpoint/seo.json';
import pdfToExcelSEO from './pdf/pdf-to-excel/seo.json';

export const tools = {
    'compress-image': {
        id: 'compress-image',
        name: 'Image Compressor',
        description: 'Reduce image file size without losing quality',
        component: ImageCompressor,
        category: 'image',
        seo: imageCompressorSEO,
        icon: '🖼️',
        popular: true,
        modes: ['offline', 'online'] // Works in both modes
    },
    'convert-image': {
        id: 'convert-image',
        name: 'Image Converter',
        description: 'Convert between JPG, PNG, WebP and resize images',
        component: ImageConverter,
        category: 'image',
        seo: imageConverterSEO,
        icon: '🔄',
        popular: true,
        modes: ['offline', 'online']
    },
    'image-to-pdf': {
        id: 'image-to-pdf',
        name: 'Image to PDF',
        description: 'Combine multiple images into a single PDF',
        component: ImageToPDF,
        category: 'image',
        seo: imageToPDFSEO,
        icon: '📄',
        popular: true,
        modes: ['offline', 'online']
    },
    'resize-image': {
        id: 'resize-image',
        name: 'Image Resizer',
        description: 'Resize images by dimensions or percentage',
        component: ImageResizer,
        category: 'image',
        seo: imageResizerSEO,
        icon: '📏',
        popular: true,
        modes: ['offline', 'online']
    },
    'gif-maker': {
        id: 'gif-maker',
        name: 'GIF Maker',
        description: 'Create animated GIFs from images or videos',
        component: GIFMaker,
        category: 'image',
        seo: gifMakerSEO,
        icon: '🎞️',
        popular: true,
        modes: ['offline', 'online']
    },
    'watermark': {
        id: 'watermark',
        name: 'Add Watermark',
        description: 'Protect images with text or logo watermarks',
        component: Watermark,
        category: 'image',
        seo: watermarkSEO,
        icon: '©️',
        popular: true,
        modes: ['offline', 'online']
    },
    'crop-image': {
        id: 'crop-image',
        name: 'Image Cropper',
        description: 'Crop images to any size or aspect ratio',
        component: ImageCropper,
        category: 'image',
        seo: imageCropperSEO,
        icon: '✂️',
        popular: true,
        modes: ['offline', 'online']
    }, 'remove-background': {
        id: 'remove-background',
        name: 'Background Remover',
        description: 'Remove backgrounds from images automatically',
        component: BackgroundRemover,
        category: 'image',
        seo: backgroundRemoverSEO,
        icon: '🎨',
        popular: true,
        modes: ['offline', 'online']
    }, 'compress-pdf': {
        id: 'compress-pdf',
        name: 'PDF Compressor',
        description: 'Reduce PDF file size with smart compression',
        component: PDFCompressor,
        category: 'pdf',
        seo: pdfCompressorSEO,
        icon: '📄',
        popular: true,
        modes: ['offline', 'online']
    },
    'convert-pdf': {
        id: 'convert-pdf',
        name: 'PDF to Image',
        description: 'Convert PDF pages to PNG or JPG images',
        component: PDFConverter,
        category: 'pdf',
        seo: pdfConverterSEO,
        icon: '📄',
        popular: true,
        modes: ['offline', 'online']
    },
    'compress-audio': {
        id: 'compress-audio',
        name: 'Audio Compressor',
        description: 'Convert audio to MP3 with customizable bitrate',
        component: AudioCompressor,
        category: 'audio',
        seo: audioCompressorSEO,
        icon: '🎵',
        popular: true,
        modes: ['offline', 'online']
    },
    'convert-audio': {
        id: 'convert-audio',
        name: 'Audio Converter',
        description: 'Convert between MP3, WAV, and OGG formats',
        component: AudioConverter,
        category: 'audio',
        seo: audioConverterSEO,
        icon: '🎵',
        popular: true,
        modes: ['offline', 'online']
    },
    'video-to-mp3': {
        id: 'video-to-mp3',
        name: 'Video to MP3',
        description: 'Extract audio from videos and convert to MP3',
        component: VideoToMP3,
        category: 'audio',
        seo: videoToMP3SEO,
        icon: '🎬',
        popular: true,
        modes: ['offline', 'online']
    },
    'merge-pdf': {
        id: 'merge-pdf',
        name: 'PDF Merger',
        description: 'Combine multiple PDF files into one document',
        component: PDFMerger,
        category: 'pdf',
        seo: pdfMergerSEO,
        icon: '📑',
        popular: true,
        modes: ['offline', 'online']
    },
    'split-pdf': {
        id: 'split-pdf',
        name: 'PDF Splitter',
        description: 'Split PDF into separate pages or extract specific pages',
        component: PDFSplitter,
        category: 'pdf',
        seo: pdfSplitterSEO,
        icon: '✂️',
        popular: true,
        modes: ['offline', 'online']
    },
    'compress-video': {
        id: 'compress-video',
        name: 'Video Compressor',
        description: 'Reduce video file size while maintaining quality',
        component: VideoCompressor,
        category: 'video',
        seo: videoCompressorSEO,
        icon: '🎬',
        popular: true,
        modes: ['offline', 'online']
    },
    'video-converter': {
        id: 'video-converter',
        name: 'Video Converter',
        description: 'Convert videos between MP4, WebM, AVI, MOV, MKV',
        component: VideoConverter,
        category: 'video',
        seo: videoConverterSEO,
        icon: '🔄',
        popular: true,
        modes: ['offline', 'online']
    },
    'qr-generator': {
        id: 'qr-generator',
        name: 'QR Code Generator',
        description: 'Create custom QR codes for URLs, text, and more',
        component: QRGenerator,
        category: 'utility',
        seo: qrGeneratorSEO,
        icon: '📱',
        popular: true,
        modes: ['offline', 'online']
    },
    'password-generator': {
        id: 'password-generator',
        name: 'Password Generator',
        description: 'Create strong, secure passwords with customizable options',
        component: PasswordGenerator,
        category: 'utility',
        seo: passwordGeneratorSEO,
        icon: '🔐',
        popular: true,
        modes: ['offline', 'online']
    },
    'word-to-pdf': {
        id: 'word-to-pdf',
        name: 'Word to PDF',
        description: 'Convert Microsoft Word documents (DOCX) to PDF format',
        component: WordToPDF,
        category: 'pdf',
        seo: wordToPDFSEO,
        icon: '📝',
        popular: true,
        modes: ['offline', 'online']
    },
    'powerpoint-to-pdf': {
        id: 'powerpoint-to-pdf',
        name: 'PowerPoint to PDF',
        description: 'Convert Microsoft PowerPoint presentations to PDF format',
        component: PowerPointToPDF,
        category: 'pdf',
        seo: powerpointToPDFSEO,
        icon: '📊',
        popular: true,
        modes: ['offline', 'online']
    },
    'excel-to-pdf': {
        id: 'excel-to-pdf',
        name: 'Excel to PDF',
        description: 'Convert Microsoft Excel spreadsheets to PDF format',
        component: ExcelToPDF,
        category: 'pdf',
        seo: excelToPDFSEO,
        icon: '📈',
        modes: ['offline', 'online']
    },
    'html-to-pdf': {
        id: 'html-to-pdf',
        name: 'HTML to PDF',
        description: 'Convert HTML files and web pages to PDF format',
        component: HTMLToPDF,
        category: 'pdf',
        seo: htmlToPDFSEO,
        icon: '🌐',
        modes: ['offline', 'online']
    },
    'pdf-to-word': {
        id: 'pdf-to-word',
        name: 'PDF to Word',
        description: 'Convert PDF documents to Microsoft Word format',
        component: PDFToWord,
        category: 'pdf',
        seo: pdfToWordSEO,
        icon: '📝',
        popular: true,
        modes: ['offline', 'online']
    },
    'pdf-to-powerpoint': {
        id: 'pdf-to-powerpoint',
        name: 'PDF to PowerPoint',
        description: 'Convert PDF documents to PowerPoint presentations',
        component: PDFToPowerPoint,
        category: 'pdf',
        seo: pdfToPowerpointSEO,
        icon: '📊',
        modes: ['offline', 'online'],
        popular: true
    },
    'pdf-to-excel': {
        id: 'pdf-to-excel',
        name: 'PDF to Excel',
        description: 'Convert PDF documents to Excel spreadsheets',
        component: PDFToExcel,
        category: 'pdf',
        seo: pdfToExcelSEO,
        icon: '📈',
        modes: ['offline', 'online'],
        popular: true
    },
    'pdf-to-pdfa': {
        id: 'pdf-to-pdfa',
        name: 'PDF to PDF/A',
        description: 'Convert PDF to PDF/A archival format for long-term preservation',
        component: PDFToPDFA,
        category: 'pdf',
        seo: pdfToPDFASEO,
        icon: '📦',
        modes: ['offline', 'online']
    }
};

/**
 * Get all tools
 */
export const getAllTools = () => Object.values(tools);

/**
 * Get tool by ID
 */
export const getToolById = (id) => tools[id];

/**
 * Get tools by category
 */
export const getToolsByCategory = (category) => {
    return Object.values(tools).filter(tool => tool.category === category);
};

/**
 * Get popular tools
 */
export const getPopularTools = () => {
    return Object.values(tools).filter(tool => tool.popular);
};
