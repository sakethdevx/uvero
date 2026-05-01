/**
 * Unified File Converter Processor
 * Routes conversions to appropriate backend (ImageMagick WASM, Pandoc WASM, FFmpeg WASM, etc.)
 * Follows VERT pattern: single entry point for all file conversions
 */

// Format registry
const FORMAT_REGISTRY = {
    image: {
        // Input extensions (common ones)
        inputs: [
            'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'ico',
            'avif', 'heic', 'heif', 'jxl', 'tiff', 'tif',
            'psd', 'svg', 'eps',
            'arw', 'cr2', 'dng', 'raf', 'orf', 'pef', 'rw2', 'nef', 'srf', 'crw', 'cr3', 'dcr', 'mrw', 'mef', 'erf', '3fr', 'x3f', 'rsf', 'iiq'
        ],
        // Output formats we support (based on VERT reference)
        outputs: [
            { value: 'jpg', label: 'JPG', desc: 'Photos' },
            { value: 'jpeg', label: 'JPEG', desc: 'Photos' },
            { value: 'png', label: 'PNG', desc: 'Lossless' },
            { value: 'webp', label: 'WebP', desc: 'Modern web' },
            { value: 'gif', label: 'GIF', desc: 'Animated' },
            { value: 'bmp', label: 'BMP', desc: 'Bitmap' },
            { value: 'ico', label: 'ICO', desc: 'Icon' },
            { value: 'avif', label: 'AVIF', desc: 'Next-gen' },
            { value: 'tiff', label: 'TIFF', desc: 'High quality' },
            { value: 'tif', label: 'TIFF', desc: 'High quality' },
            { value: 'psd', label: 'PSD', desc: 'Photoshop' },
            { value: 'svg', label: 'SVG', desc: 'Vector' },
            { value: 'jxl', label: 'JXL', desc: 'JXL' },
            { value: 'heic', label: 'HEIC', desc: 'Apple format' },
            { value: 'jpe', label: 'JPE', desc: 'JPEG variant' },
            { value: 'jfif', label: 'JFIF', desc: 'JPEG format' },
            { value: 'pbm', label: 'PBM', desc: 'Bitmap' },
            { value: 'pgm', label: 'PGM', desc: 'Bitmap' },
            { value: 'ppm', label: 'PPM', desc: 'Bitmap' },
            { value: 'pnm', label: 'PNM', desc: 'Bitmap' },
            { value: 'cur', label: 'CUR', desc: 'Cursor' },
            { value: 'hdr', label: 'HDR', desc: 'High Dynamic Range' },
            { value: 'mat', label: 'MAT', desc: 'Material' },
            { value: 'eps', label: 'EPS', desc: 'Encapsulated PS' },
            // Special operations
            { value: 'crop', label: 'Crop Image', desc: 'Crop to any size or ratio' },
            { value: 'remove-background', label: 'Remove Background', desc: 'AI-powered background removal' },
            // Note: Some formats like HEIC/HEIF, RAW, ANI, ICNS are read-only only
        ],
        // Quality range
        quality: { min: 1, max: 100, default: 92 }
    },
    document: {
        inputs: [
            'docx', 'doc', 'pdf', 'epub', 'odt', 'html', 'md', 'markdown',
            'txt', 'rst', 'csv', 'tsv', 'json', 'docbook'
        ],
        // Output formats from VERT reference (no PDF output)
        outputs: [
            { value: 'docx', label: 'DOCX', desc: 'Word document' },
            { value: 'doc', label: 'DOC', desc: 'Word document' },
            { value: 'md', label: 'Markdown', desc: 'Plain text' },
            { value: 'html', label: 'HTML', desc: 'Web page' },
            { value: 'rtf', label: 'RTF', desc: 'Rich Text' },
            { value: 'csv', label: 'CSV', desc: 'Table data' },
            { value: 'tsv', label: 'TSV', desc: 'Tab-separated' },
            { value: 'json', label: 'JSON', desc: 'Structured data' },
            { value: 'rst', label: 'reStructuredText', desc: 'Doc tool' },
            { value: 'epub', label: 'EPUB', desc: 'Ebook' },
            { value: 'odt', label: 'ODT', desc: 'OpenDocument' },
            { value: 'docbook', label: 'DocBook', desc: 'Technical docs' },
        ],
        quality: null // no quality setting for documents
    },
    audio: {
        inputs: [
            'mp3', 'wav', 'flac', 'ogg', 'mogg', 'oga', 'opus', 'aac', 'alac',
            'm4a', 'caf', 'wma', 'amr', 'ac3', 'aiff', 'aifc', 'aif', 'mp1', 'mp2',
            'mpc', 'dsd', 'dsf', 'dff', 'mqa', 'au', 'm4b', 'voc', 'weba'
        ],
        outputs: [
            { value: 'mp3', label: 'MP3', desc: 'Universal audio' },
            { value: 'wav', label: 'WAV', desc: 'Uncompressed' },
            { value: 'flac', label: 'FLAC', desc: 'Lossless audio' },
            { value: 'ogg', label: 'OGG', desc: 'Open source' },
            { value: 'aac', label: 'AAC', desc: 'Advanced audio' },
            { value: 'm4a', label: 'M4A', desc: 'Apple audio' },
            { value: 'opus', label: 'OPUS', desc: 'Web audio' },
            { value: 'wma', label: 'WMA', desc: 'Windows audio' },
            { value: 'alac', label: 'ALAC', desc: 'Apple lossless' }
        ],
        quality: { default: 'auto' } // could be bitrate
    },
    video: {
        inputs: [
            'mp4', 'mkv', 'mov', 'mts', 'ts', 'm2ts', 'flv', 'f4v', 'm4v',
            '3gp', '3g2', 'wmv', 'webm', 'ogv', 'avi', 'divx', 'mpg', 'mpeg',
            'vob', 'mxf', 'gif'
        ],
        outputs: [
            { value: 'mp4', label: 'MP4', desc: 'Universal video' },
            { value: 'mkv', label: 'MKV', desc: 'Matroska' },
            { value: 'mov', label: 'MOV', desc: 'Apple QuickTime' },
            { value: 'webm', label: 'WebM', desc: 'Web video' },
            { value: 'avi', label: 'AVI', desc: 'Windows video' },
            { value: 'wmv', label: 'WMV', desc: 'Windows Media' },
            { value: 'gif', label: 'GIF', desc: 'Animated GIF' },
            // Audio extraction formats
            { value: 'mp3', label: 'MP3', desc: 'Extract audio' },
            { value: 'wav', label: 'WAV', desc: 'Extract audio' },
            { value: 'flac', label: 'FLAC', desc: 'Extract audio' },
            { value: 'ogg', label: 'OGG', desc: 'Extract audio' },
            { value: 'aac', label: 'AAC', desc: 'Extract audio' },
            { value: 'm4a', label: 'M4A', desc: 'Extract audio' },
            { value: 'opus', label: 'OPUS', desc: 'Extract audio' },
            { value: 'wma', label: 'WMA', desc: 'Extract audio' }
        ],
        quality: { default: 'auto' }
    }
};

class UnifiedProcessor {
    constructor() {
        this.imageProc = null;
        this.pandocProc = null;
        this.audioProc = null;
        this.videoProc = null;
        this.bgRemoverProc = null;
        this.cropProc = null;
    }

    async ensureProcessors() {
        if (this.imageProc && this.pandocProc && this.audioProc && this.videoProc && this.bgRemoverProc && this.cropProc) return;

        if (!this.imageProc) {
            try {
                const imageMod = await import('../tools/image/image-wasm-converter/processor');
                this.imageProc = imageMod.default || imageMod;
            } catch (e) {
                console.warn('Image processor not available:', e);
            }
        }

        if (!this.pandocProc) {
            try {
                const pandocMod = await import('../tools/document/pandoc-wasm-converter/processor');
                this.pandocProc = pandocMod.default || pandocMod;
            } catch (e) {
                console.warn('Pandoc processor not available:', e);
            }
        }

        if (!this.audioProc) {
            try {
                const audioMod = await import('../tools/audio/audio-wasm-converter/processor');
                this.audioProc = audioMod.default || audioMod;
            } catch (e) {
                console.warn('Audio processor not available:', e);
            }
        }

        if (!this.videoProc) {
            try {
                const videoMod = await import('../tools/video/video-wasm-converter/processor');
                this.videoProc = videoMod.default || videoMod;
            } catch (e) {
                console.warn('Video processor not available:', e);
            }
        }

        if (!this.bgRemoverProc) {
            try {
                const bgRemoverMod = await import('../tools/image/background-remover/processor');
                this.bgRemoverProc = bgRemoverMod.processor || bgRemoverMod.default || bgRemoverMod;
            } catch (e) {
                console.warn('Background remover processor not available:', e);
            }
        }
        if (!this.cropProc) {
            try {
                const cropMod = await import('../tools/image/image-cropper/processor');
                this.cropProc = cropMod.processor || cropMod.default || cropMod;
            } catch (e) {
                console.warn('Crop processor not available:', e);
            }
        }
    }

    detectCategory(file) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext) return null;

        if (FORMAT_REGISTRY.image.inputs.includes(ext)) {
            return 'image';
        }
        if (FORMAT_REGISTRY.document.inputs.includes(ext)) {
            return 'document';
        }
        if (FORMAT_REGISTRY.audio.inputs.includes(ext)) {
            return 'audio';
        }
        if (FORMAT_REGISTRY.video.inputs.includes(ext)) {
            return 'video';
        }
        return null;
    }

    getSupportedOutputs(file) {
        const category = this.detectCategory(file);
        if (!category) return [];

        const ext = file.name.split('.').pop()?.toLowerCase();

        // Return only output formats that are different from the input file's extension
        return FORMAT_REGISTRY[category].outputs.filter(
            output => output.value !== ext
        );
    }

    async convert(file, outputFormat, onProgress, options = {}) {
        await this.ensureProcessors();

        const category = this.detectCategory(file);
        if (!category) {
            throw new Error(`Unsupported file type. Please upload an image, audio, video file, or document.`);
        }

        const qualityOpts = FORMAT_REGISTRY[category].quality || {};

        // Special case: Crop image
        if (category === 'image' && outputFormat === 'crop') {
            if (!this.cropProc) {
                try {
                    const cropMod = await import('../tools/image/image-cropper/processor');
                    this.cropProc = cropMod.processor || cropMod.default || cropMod;
                } catch (e) {
                    console.error('Crop processor retry failed:', e);
                    throw new Error('Image cropper could not be loaded. Please refresh and try again.');
                }
            }
            if (!options.cropArea) {
                throw new Error('Crop area is required. Please select a crop region.');
            }
            const result = await this.cropProc.cropImage(file, options.cropArea, onProgress);
            const blob = await fetch(result.url).then(r => r.blob());
            URL.revokeObjectURL(result.url);
            const croppedFile = new File([blob], result.filename, { type: 'image/png' });
            return {
                file: croppedFile,
                originalSize: file.size,
                convertedSize: blob.size,
                format: 'PNG (cropped)',
                operation: 'crop'
            };
        }

        // Special case: Background removal for images
        if (category === 'image' && outputFormat === 'remove-background') {
            if (!this.bgRemoverProc) {
                // bgRemoverProc failed to load – retry once before giving up
                try {
                    const bgRemoverMod = await import('../tools/image/background-remover/processor');
                    this.bgRemoverProc = bgRemoverMod.processor || bgRemoverMod.default || bgRemoverMod;
                } catch (e) {
                    console.error('Background remover retry failed:', e);
                    throw new Error(
                        'Background remover could not be loaded. This may be due to a slow or unstable internet connection (the AI model needs to be downloaded). Please check your connection and try again.'
                    );
                }
            }
            const result = await this.bgRemoverProc.removeBackground(file, 'medium', onProgress);
            // Reshape result to match expected output shape: { file, originalSize, ... }
            return {
                file: result.blob,
                originalSize: file.size,
                convertedSize: result.size,
                width: result.width,
                height: result.height,
                format: 'PNG (transparent)',
                operation: 'remove-background'
            };
        } else if (category === 'image' && this.imageProc) {
            return await this.imageProc.convert(file, outputFormat, qualityOpts.default || 92, true, onProgress);
        } else if (category === 'document' && this.pandocProc) {
            return await this.pandocProc.convert(file, outputFormat, onProgress);
        } else if (category === 'audio' && this.audioProc) {
            return await this.audioProc.convert(file, outputFormat, qualityOpts.default || 'auto', onProgress);
        } else if (category === 'video' && this.videoProc) {
            return await this.videoProc.convert(file, outputFormat, qualityOpts.default || 'auto', onProgress);
        } else {
            throw new Error(`${category} converter not available. Please check your internet connection and refresh.`);
        }
    }
}

const processor = new UnifiedProcessor();

export default processor;
