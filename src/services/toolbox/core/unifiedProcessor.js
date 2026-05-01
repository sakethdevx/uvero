/**
 * Unified File Converter Processor
 * Routes conversions to appropriate backend (ImageMagick WASM, Pandoc WASM, etc.)
 * Follows VERT pattern: single entry point for all file conversions
 */

// Import existing processors (we'll keep these executors but use their processors directly)
// Note: These imports will be resolved after we keep the necessary processor files
let imageProcessor = null;
let pandocProcessor = null;

try {
    // Dynamic import to avoid breaking if files are moved
    imageProcessor = { convert: async (...args) => { throw new Error('Image processor not initialized'); } };
    pandocProcessor = { convert: async (...args) => { throw new Error('Document processor not initialized'); } };
} catch (e) {
    console.warn('Some processors not available:', e);
}

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
         // Output formats we support
         outputs: [
             { value: 'jpg', label: 'JPG', desc: 'Photos' },
             { value: 'png', label: 'PNG', desc: 'Lossless' },
             { value: 'webp', label: 'WebP', desc: 'Modern web' },
             { value: 'gif', label: 'GIF', desc: 'Animated' },
             { value: 'bmp', label: 'BMP', desc: 'Bitmap' },
             { value: 'ico', label: 'ICO', desc: 'Favicon' },
             { value: 'avif', label: 'AVIF', desc: 'Next-gen' },
             { value: 'heic', label: 'HEIC', desc: 'Apple format' },
             { value: 'tiff', label: 'TIFF', desc: 'High quality' },
             // SVG and PSD output not supported (encoding not available)
         ],
        // Quality range
        quality: { min: 1, max: 100, default: 92 }
    },
    document: {
        inputs: [
            'docx', 'doc', 'pdf', 'epub', 'odt', 'html', 'md', 'markdown',
            'txt', 'rst', 'csv', 'tsv', 'json', 'docbook'
        ],
        outputs: [
            { value: 'pdf', label: 'PDF', desc: 'Portable Document' },
            { value: 'docx', label: 'DOCX', desc: 'Word document' },
            { value: 'html', label: 'HTML', desc: 'Web page' },
            { value: 'epub', label: 'EPUB', desc: 'Ebook' },
            { value: 'odt', label: 'ODT', desc: 'OpenDocument' },
            { value: 'md', label: 'Markdown', desc: 'Plain text' },
            { value: 'txt', label: 'Plain Text', desc: 'Raw text' },
            { value: 'rst', label: 'reStructuredText', desc: 'Doc tool' },
            { value: 'docbook', label: 'DocBook', desc: 'Technical docs' },
            { value: 'csv', label: 'CSV', desc: 'Table data' },
            { value: 'tsv', label: 'TSV', desc: 'Tab-separated' },
            { value: 'json', label: 'JSON', desc: 'Structured data' },
        ],
        quality: null // no quality setting for documents
    }
};

class UnifiedProcessor {
    constructor() {
        this.imageProc = null;
        this.pandocProc = null;
    }

    async ensureProcessors() {
        if (this.imageProc && this.pandocProc) return;

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
            throw new Error(`Unsupported file type. Please upload an image or document.`);
        }

        const options = FORMAT_REGISTRY[category].quality || {};

        try {
            if (category === 'image' && this.imageProc) {
                return await this.imageProc.convert(file, outputFormat, options.default || 92, true, onProgress);
            } else if (category === 'document' && this.pandocProc) {
                return await this.pandocProc.convert(file, outputFormat, null, true, onProgress);
            } else {
                throw new Error(`${category} converter not available. Please check your internet connection and refresh.`);
            }
        } catch (err) {
            throw err;
        }
    }
}

const processor = new UnifiedProcessor();

export default processor;
