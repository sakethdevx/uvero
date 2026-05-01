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
    }
};

class UnifiedProcessor {
    constructor() {
        this.imageProc = null;
        this.pandocProc = null;
        this.audioProc = null;
    }

    async ensureProcessors() {
        if (this.imageProc && this.pandocProc && this.audioProc) return;

        try {
            // Import dynamically to avoid SSR issues
            const imageMod = await import('../tools/image/image-wasm-converter/processor');
            this.imageProc = imageMod.default || imageMod;
        } catch (e) {
            console.warn('Image processor not available:', e);
        }

        try {
            const pandocMod = await import('../tools/document/pandoc-wasm-converter/processor');
            this.pandocProc = pandocMod.default || pandocMod;
        } catch (e) {
            console.warn('Pandoc processor not available:', e);
        }

        try {
            const audioMod = await import('../tools/audio/audio-wasm-converter/processor');
            this.audioProc = audioMod.default || audioMod;
        } catch (e) {
            console.warn('Audio processor not available:', e);
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
        return null;
    }

    getSupportedOutputs(file) {
        const category = this.detectCategory(file);
        if (!category) return [];
        return FORMAT_REGISTRY[category].outputs;
    }

    async convert(file, outputFormat, onProgress) {
        await this.ensureProcessors();

        const category = this.detectCategory(file);
        if (!category) {
            throw new Error(`Unsupported file type. Please upload an image, audio file, or document.`);
        }

        const options = FORMAT_REGISTRY[category].quality || {};

        if (category === 'image' && this.imageProc) {
            return await this.imageProc.convert(file, outputFormat, options.default || 92, true, onProgress);
        } else if (category === 'document' && this.pandocProc) {
            return await this.pandocProc.convert(file, outputFormat, onProgress);
        } else if (category === 'audio' && this.audioProc) {
            return await this.audioProc.convert(file, outputFormat, options.default || 'auto', onProgress);
        } else {
            throw new Error(`${category} converter not available. Please check your internet connection and refresh.`);
        }
    }
}

const processor = new UnifiedProcessor();

export default processor;
