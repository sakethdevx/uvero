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
import UnitConverter from './utility/unit-converter/UnitConverter';
import unitConverterSEO from './utility/unit-converter/seo.json';
import HashGenerator from './utility/hash-generator/HashGenerator';
import hashGeneratorSEO from './utility/hash-generator/seo.json';
import JPGToPDF from './image/jpg-to-pdf/JPGToPDF';
import jpgToPDFSEO from './image/jpg-to-pdf/seo.json';
import PDFToJPG from './image/pdf-to-jpg/PDFToJPG';
import pdfToJPGSEO from './image/pdf-to-jpg/seo.json';
import HEICToJPG from './image/heic-to-jpg/HEICToJPG';
import heicToJPGSEO from './image/heic-to-jpg/seo.json';
import MP3Converter from './audio/mp3-converter/MP3Converter';
import mp3ConverterSEO from './audio/mp3-converter/seo.json';
import MP4ToMP3 from './audio/mp4-to-mp3/MP4ToMP3';
import mp4ToMP3SEO from './audio/mp4-to-mp3/seo.json';
import MP4Converter from './video/mp4-converter/MP4Converter';
import mp4ConverterSEO from './video/mp4-converter/seo.json';
import VideoToGIF from './video/video-to-gif/VideoToGIF';
import videoToGIFSEO from './video/video-to-gif/seo.json';
import MOVToMP4 from './video/mov-to-mp4/MOVToMP4';
import movToMP4SEO from './video/mov-to-mp4/seo.json';
import LbsToKg from './utility/lbs-to-kg/LbsToKg';
import lbsToKgSEO from './utility/lbs-to-kg/seo.json';
import KgToLbs from './utility/kg-to-lbs/KgToLbs';
import kgToLbsSEO from './utility/kg-to-lbs/seo.json';
import FeetToMeters from './utility/feet-to-meters/FeetToMeters';
import feetToMetersSEO from './utility/feet-to-meters/seo.json';
import PSTToEST from './utility/pst-to-est/PSTToEST';
import pstToEstSEO from './utility/pst-to-est/seo.json';
import CSTToEST from './utility/cst-to-est/CSTToEST';
import cstToEstSEO from './utility/cst-to-est/seo.json';
import TimeZoneConverter from './utility/timezone-converter/TimeZoneConverter';
import timezoneConverterSEO from './utility/timezone-converter/seo.json';
import EPUBToPDF from './document/epub-to-pdf/EPUBToPDF';
import epubToPdfSEO from './document/epub-to-pdf/seo.json';
import EPUBToMOBI from './document/epub-to-mobi/EPUBToMOBI';
import epubToMobiSEO from './document/epub-to-mobi/seo.json';
import DocumentConverter from './document/document-converter/DocumentConverter';
import documentConverterSEO from './document/document-converter/seo.json';
import ArchiveConverter from './archive/archive-converter/ArchiveConverter';
import archiveConverterSEO from './archive/archive-converter/seo.json';
import RARToZip from './archive/rar-to-zip/RARToZip';
import rarToZipSEO from './archive/rar-to-zip/seo.json';
import RotatePdf from './pdf/rotate-pdf/RotatePdf';
import rotatePdfSEO from './pdf/rotate-pdf/seo.json';
import WatermarkPdf from './pdf/watermark-pdf/WatermarkPdf';
import watermarkPdfSEO from './pdf/watermark-pdf/seo.json';
import ProtectPdf from './pdf/protect-pdf/ProtectPdf';
import protectPdfSEO from './pdf/protect-pdf/seo.json';
import UnlockPdf from './pdf/unlock-pdf/UnlockPdf';
import unlockPdfSEO from './pdf/unlock-pdf/seo.json';
import PageNumbers from './pdf/page-numbers/PageNumbers';
import pageNumbersSEO from './pdf/page-numbers/seo.json';
import OrganizePdf from './pdf/organize-pdf/OrganizePdf';
import organizePdfSEO from './pdf/organize-pdf/seo.json';
import RepairPdf from './pdf/repair-pdf/RepairPdf';
import repairPdfSEO from './pdf/repair-pdf/seo.json';
import CropPdf from './pdf/crop-pdf/CropPdf';
import cropPdfSEO from './pdf/crop-pdf/seo.json';
import EditPdf from './pdf/edit-pdf/EditPdf';
import editPdfSEO from './pdf/edit-pdf/seo.json';
import SignPdf from './pdf/sign-pdf/SignPdf';
import signPdfSEO from './pdf/sign-pdf/seo.json';
import RedactPdf from './pdf/redact-pdf/RedactPdf';
import redactPdfSEO from './pdf/redact-pdf/seo.json';
import OcrPdf from './pdf/ocr-pdf/OcrPdf';
import ocrPdfSEO from './pdf/ocr-pdf/seo.json';
import ComparePdf from './pdf/compare-pdf/ComparePdf';
import comparePdfSEO from './pdf/compare-pdf/seo.json';
import ScanToPdf from './pdf/scan-to-pdf/ScanToPdf';
import scanToPdfSEO from './pdf/scan-to-pdf/seo.json';
import TranslatePdf from './pdf/translate-pdf/TranslatePdf';
import translatePdfSEO from './pdf/translate-pdf/seo.json';
import { getSupportedModesForToolId } from '../core/toolExecutors';
import { getToolMetadata } from '../core/toolMetadata';

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
        modes: ['offline']
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
        modes: ['offline']
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
        modes: ['offline']
    }, 'remove-background': {
        id: 'remove-background',
        name: 'Background Remover',
        description: 'Remove backgrounds from images automatically',
        component: BackgroundRemover,
        category: 'image',
        seo: backgroundRemoverSEO,
        icon: '🎨',
        popular: true,
        modes: ['offline']
    }, 'compress-pdf': {
        id: 'compress-pdf',
        name: 'PDF Compressor',
        description: 'Reduce PDF file size with smart compression',
        component: PDFCompressor,
        category: 'pdf',
        seo: pdfCompressorSEO,
        icon: '📄',
        popular: true,
        modes: ['offline']
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
        modes: ['offline']
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
        modes: ['offline']
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
        modes: ['offline']
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
    'convert-video': {
        id: 'convert-video',
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
        modes: ['offline']
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
        modes: ['offline']
    },
    'excel-to-pdf': {
        id: 'excel-to-pdf',
        name: 'Excel to PDF',
        description: 'Convert Microsoft Excel spreadsheets to PDF format',
        component: ExcelToPDF,
        category: 'pdf',
        seo: excelToPDFSEO,
        icon: '📈',
        modes: ['offline']
    },
    'html-to-pdf': {
        id: 'html-to-pdf',
        name: 'HTML to PDF',
        description: 'Convert HTML files and web pages to PDF format',
        component: HTMLToPDF,
        category: 'pdf',
        seo: htmlToPDFSEO,
        icon: '🌐',
        modes: ['offline']
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
        modes: ['offline']
    },
    'pdf-to-powerpoint': {
        id: 'pdf-to-powerpoint',
        name: 'PDF to PowerPoint',
        description: 'Convert PDF documents to PowerPoint presentations',
        component: PDFToPowerPoint,
        category: 'pdf',
        seo: pdfToPowerpointSEO,
        icon: '📊',
        modes: ['offline'],
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
        modes: ['offline'],
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
        modes: ['offline']
    },
    'unit-converter': {
        id: 'unit-converter',
        name: 'Unit Converter',
        description: 'Convert between weight, length, temperature, volume, area, speed, and time units',
        component: UnitConverter,
        category: 'utility',
        seo: unitConverterSEO,
        icon: '📏',
        popular: true,
        modes: ['offline', 'online']
    },
    'hash-generator': {
        id: 'hash-generator',
        name: 'Hash Generator',
        description: 'Generate cryptographic hashes using MD5, SHA-256, SHA-512 and more',
        component: HashGenerator,
        category: 'utility',
        seo: hashGeneratorSEO,
        icon: '🔐',
        popular: true,
        modes: ['offline', 'online']
    },
    'jpg-to-pdf': {
        id: 'jpg-to-pdf',
        name: 'JPG to PDF',
        description: 'Convert JPG/JPEG images to PDF documents',
        component: JPGToPDF,
        category: 'image',
        seo: jpgToPDFSEO,
        icon: '📄',
        modes: ['offline']
    },
    'pdf-to-jpg': {
        id: 'pdf-to-jpg',
        name: 'PDF to JPG',
        description: 'Convert PDF pages to JPG/JPEG images',
        component: PDFToJPG,
        category: 'image',
        seo: pdfToJPGSEO,
        icon: '🖼️',
        modes: ['offline']
    },
    'heic-to-jpg': {
        id: 'heic-to-jpg',
        name: 'HEIC to JPG',
        description: 'Convert Apple HEIC/HEIF images to JPG format',
        component: HEICToJPG,
        category: 'image',
        seo: heicToJPGSEO,
        icon: '📱',
        modes: ['offline', 'online']
    },
    'mp3-converter': {
        id: 'mp3-converter',
        name: 'MP3 Converter',
        description: 'Convert any audio file to MP3 format',
        component: MP3Converter,
        category: 'audio',
        seo: mp3ConverterSEO,
        icon: '🎵',
        modes: ['offline', 'online']
    },
    'mp4-to-mp3': {
        id: 'mp4-to-mp3',
        name: 'MP4 to MP3',
        description: 'Extract audio from MP4 videos and convert to MP3',
        component: MP4ToMP3,
        category: 'audio',
        seo: mp4ToMP3SEO,
        icon: '🎬',
        modes: ['offline', 'online']
    },
    'mp4-converter': {
        id: 'mp4-converter',
        name: 'MP4 Converter',
        description: 'Convert any video format to MP4',
        component: MP4Converter,
        category: 'video',
        seo: mp4ConverterSEO,
        icon: '🎬',
        modes: ['offline', 'online']
    },
    'video-to-gif': {
        id: 'video-to-gif',
        name: 'Video to GIF',
        description: 'Convert videos to animated GIF images',
        component: VideoToGIF,
        category: 'video',
        seo: videoToGIFSEO,
        icon: '🎞️',
        modes: ['offline', 'online']
    },
    'mov-to-mp4': {
        id: 'mov-to-mp4',
        name: 'MOV to MP4',
        description: 'Convert Apple QuickTime MOV to MP4 format',
        component: MOVToMP4,
        category: 'video',
        seo: movToMP4SEO,
        icon: '🎥',
        modes: ['offline', 'online']
    },
    'lbs-to-kg': {
        id: 'lbs-to-kg',
        name: 'Lbs to Kg',
        description: 'Convert pounds to kilograms instantly',
        component: LbsToKg,
        category: 'utility',
        seo: lbsToKgSEO,
        icon: '⚖️',
        modes: ['offline']
    },
    'kg-to-lbs': {
        id: 'kg-to-lbs',
        name: 'Kg to Lbs',
        description: 'Convert kilograms to pounds instantly',
        component: KgToLbs,
        category: 'utility',
        seo: kgToLbsSEO,
        icon: '⚖️',
        modes: ['offline']
    },
    'feet-to-meters': {
        id: 'feet-to-meters',
        name: 'Feet to Meters',
        description: 'Convert feet to meters instantly',
        component: FeetToMeters,
        category: 'utility',
        seo: feetToMetersSEO,
        icon: '📏',
        modes: ['offline']
    },
    'pst-to-est': {
        id: 'pst-to-est',
        name: 'PST to EST',
        description: 'Convert Pacific Time to Eastern Time',
        component: PSTToEST,
        category: 'utility',
        seo: pstToEstSEO,
        icon: '🌍',
        modes: ['offline']
    },
    'cst-to-est': {
        id: 'cst-to-est',
        name: 'CST to EST',
        description: 'Convert Central Time to Eastern Time',
        component: CSTToEST,
        category: 'utility',
        seo: cstToEstSEO,
        icon: '🌍',
        modes: ['offline']
    },
    'timezone-converter': {
        id: 'timezone-converter',
        name: 'Time Zone Converter',
        description: 'Convert time between different time zones worldwide',
        component: TimeZoneConverter,
        category: 'utility',
        seo: timezoneConverterSEO,
        icon: '🌍',
        modes: ['offline']
    },
    'epub-to-pdf': {
        id: 'epub-to-pdf',
        name: 'EPUB to PDF',
        description: 'Convert EPUB ebooks to PDF format',
        component: EPUBToPDF,
        category: 'document',
        seo: epubToPdfSEO,
        icon: '📚',
        modes: ['offline']
    },
    'document-converter': {
        id: 'document-converter',
        name: 'Document Converter',
        description: 'Browse document conversion tools and ebook utilities',
        component: DocumentConverter,
        category: 'document',
        seo: documentConverterSEO,
        icon: '📄',
        modes: ['offline', 'online']
    },
    'epub-to-mobi': {
        id: 'epub-to-mobi',
        name: 'EPUB to MOBI',
        description: 'Convert EPUB ebooks to MOBI online when a server-side Kindle runtime is configured',
        component: EPUBToMOBI,
        category: 'document',
        seo: epubToMobiSEO,
        icon: '📚',
        modes: ['online']
    },
    'archive-converter': {
        id: 'archive-converter',
        name: 'Archive Converter',
        description: 'Convert and optimize archive files',
        component: ArchiveConverter,
        category: 'archive',
        seo: archiveConverterSEO,
        icon: '🗜️',
        modes: ['offline']
    },
    'rar-to-zip': {
        id: 'rar-to-zip',
        name: 'RAR to ZIP Converter',
        description: 'Convert supported RAR archives to ZIP online with server extraction',
        component: RARToZip,
        category: 'archive',
        seo: rarToZipSEO,
        icon: '🗜️',
        modes: ['online']
    },
    'rotate-pdf': {
        id: 'rotate-pdf',
        name: 'Rotate PDF',
        description: 'Rotate PDF pages by 90°, 180°, or 270° clockwise',
        component: RotatePdf,
        category: 'pdf',
        seo: rotatePdfSEO,
        icon: '🔄',
        modes: ['offline']
    },
    'watermark-pdf': {
        id: 'watermark-pdf',
        name: 'Watermark PDF',
        description: 'Stamp an image or text over your PDF in seconds',
        component: WatermarkPdf,
        category: 'pdf',
        seo: watermarkPdfSEO,
        icon: '💧',
        modes: ['offline']
    },
    'protect-pdf': {
        id: 'protect-pdf',
        name: 'Protect PDF',
        description: 'Protect PDF files with a password and encrypt documents',
        component: ProtectPdf,
        category: 'pdf',
        seo: protectPdfSEO,
        icon: '🔒',
        modes: ['offline']
    },
    'unlock-pdf': {
        id: 'unlock-pdf',
        name: 'Unlock PDF',
        description: 'Remove PDF password security and unlock protected PDFs',
        component: UnlockPdf,
        category: 'pdf',
        seo: unlockPdfSEO,
        icon: '🔓',
        modes: ['offline']
    },
    'page-numbers': {
        id: 'page-numbers',
        name: 'Page Numbers',
        description: 'Add page numbers into PDFs with customizable positions and typography',
        component: PageNumbers,
        category: 'pdf',
        seo: pageNumbersSEO,
        icon: '#️⃣',
        modes: ['offline']
    },
    'organize-pdf': {
        id: 'organize-pdf',
        name: 'Organize PDF',
        description: 'Sort, reorder, and delete PDF pages at your convenience',
        component: OrganizePdf,
        category: 'pdf',
        seo: organizePdfSEO,
        icon: '📋',
        modes: ['offline']
    },
    'repair-pdf': {
        id: 'repair-pdf',
        name: 'Repair PDF',
        description: 'Repair damaged PDFs and recover data from corrupt files',
        component: RepairPdf,
        category: 'pdf',
        seo: repairPdfSEO,
        icon: '🔧',
        modes: ['offline']
    },
    'crop-pdf': {
        id: 'crop-pdf',
        name: 'Crop PDF',
        description: 'Crop margins and select specific areas of PDF pages',
        component: CropPdf,
        category: 'pdf',
        seo: cropPdfSEO,
        icon: '✂️',
        modes: ['offline']
    },
    'edit-pdf': {
        id: 'edit-pdf',
        name: 'Edit PDF',
        description: 'Add text, images, shapes or annotations to PDF documents',
        component: EditPdf,
        category: 'pdf',
        seo: editPdfSEO,
        icon: '✏️',
        modes: ['offline']
    },
    'sign-pdf': {
        id: 'sign-pdf',
        name: 'Sign PDF',
        description: 'Sign PDF documents with drawn or typed signatures',
        component: SignPdf,
        category: 'pdf',
        seo: signPdfSEO,
        icon: '✍️',
        modes: ['offline']
    },
    'redact-pdf': {
        id: 'redact-pdf',
        name: 'Redact PDF',
        description: 'Permanently remove sensitive information from PDFs',
        component: RedactPdf,
        category: 'pdf',
        seo: redactPdfSEO,
        icon: '🔏',
        modes: ['offline']
    },
    'ocr-pdf': {
        id: 'ocr-pdf',
        name: 'OCR PDF',
        description: 'Convert scanned PDFs into searchable and selectable documents',
        component: OcrPdf,
        category: 'pdf',
        seo: ocrPdfSEO,
        icon: '👁️',
        modes: ['offline']
    },
    'compare-pdf': {
        id: 'compare-pdf',
        name: 'Compare PDF',
        description: 'Show side-by-side comparison and spot changes between PDF versions',
        component: ComparePdf,
        category: 'pdf',
        seo: comparePdfSEO,
        icon: '🔍',
        modes: ['offline']
    },
    'scan-to-pdf': {
        id: 'scan-to-pdf',
        name: 'Scan to PDF',
        description: 'Capture document scans and convert images to PDF',
        component: ScanToPdf,
        category: 'pdf',
        seo: scanToPdfSEO,
        icon: '📷',
        modes: ['offline']
    },
    'translate-pdf': {
        id: 'translate-pdf',
        name: 'Translate PDF',
        description: 'Translate PDF documents while preserving layout and formatting',
        component: TranslatePdf,
        category: 'pdf',
        seo: translatePdfSEO,
        icon: '🌐',
        modes: ['offline']
    }
};

const getEffectiveModes = (tool) => {
    const executorModes = getSupportedModesForToolId(tool.id);
    const executorOptionalToolIds = new Set(['document-converter']);
    const isFileProcessingCategory = ['image', 'pdf', 'audio', 'video', 'document', 'archive'].includes(tool.category);

    if (executorModes) {
        return executorModes;
    }

    if (executorOptionalToolIds.has(tool.id)) {
        return tool.modes;
    }

    if (isFileProcessingCategory && Array.isArray(tool.modes) && tool.modes.includes('offline')) {
        return ['offline'];
    }

    if (Array.isArray(tool.modes) && tool.modes.length > 0) {
        return tool.modes;
    }

    return ['offline'];
};

const enhanceTool = (tool) => ({
    ...tool,
    ...getToolMetadata(tool.id),
    modes: getEffectiveModes(tool),
});

/**
 * Get all tools
 */
export const getAllTools = () => Object.values(tools).map(enhanceTool);

/**
 * Get tool by ID
 */
export const getToolById = (id) => {
    const tool = tools[id];
    return tool ? enhanceTool(tool) : undefined;
};

/**
 * Get tools by category
 */
export const getToolsByCategory = (category) => {
    return Object.values(tools)
        .filter(tool => tool.category === category)
        .map(enhanceTool);
};

/**
 * Get popular tools
 */
export const getPopularTools = () => {
    return Object.values(tools)
        .filter(tool => tool.popular)
        .map(enhanceTool);
};
