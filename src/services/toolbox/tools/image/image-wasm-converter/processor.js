/**
 * Image WASM Converter Processor
 * Uses pure ImageMagick WASM, following VERT reference implementation
 */

import magickWasmUrl from '@imagemagick/magick-wasm/magick.wasm?url';
import workerUrl from './worker.js?worker&url';

class ImageWasmConverterProcessor {
	constructor() {
		this.wasm = null;
		this.wasmLoading = null;
	}

	async ensureWasmLoaded() {
		if (this.wasm) return;
		if (!this.wasmLoading) {
			this.wasmLoading = (async () => {
				const response = await fetch(magickWasmUrl);
				if (!response.ok) {
					throw new Error(`Failed to fetch WASM: ${response.status} ${response.statusText}`);
				}
				this.wasm = await response.arrayBuffer();
			})();
		}
		await this.wasmLoading;
	}

	getExtension(filename) {
		const ext = filename.split('.').pop()?.toLowerCase();
		return ext ? `.${ext}` : '';
	}

	async convert(file, outputFormat, quality = 92, keepMetadata = true, onProgress) {
		await this.ensureWasmLoaded();

		let outputExt = outputFormat.toLowerCase();
		if (!outputExt.startsWith('.')) outputExt = `.${outputExt}`;
		if (outputExt === '.jfif') outputExt = '.jpeg';

		const inputExt = this.getExtension(file.name);
		const from = inputExt === '.jfif' ? '.jpeg' : inputExt;

		// Handle SVG separately: convert to PNG via Canvas first
		if (from === '.svg') {
			if (onProgress) onProgress(20);
			const pngBlob = await this.svgToPng(file);
			if (onProgress) onProgress(40);
			const pngFile = new File([pngBlob], file.name.replace(/\.svg$/i, '.png'), { type: 'image/png' });
			// Recursively convert PNG to target format using WASM
			return this.wasmConvert(pngFile, outputExt, quality, keepMetadata, onProgress, true);
		}

		// Direct WASM conversion for all other formats
		return this.wasmConvert(file, outputExt, quality, keepMetadata, onProgress);
	}

	svgToPng(svgFile) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.naturalWidth || 512;
				canvas.height = img.naturalHeight || 512;
				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0);
				canvas.toBlob((blob) => {
					if (blob) resolve(blob);
					else reject(new Error('Failed to convert SVG to PNG'));
				}, 'image/png');
			};
			img.onerror = () => reject(new Error('Failed to load SVG image'));
			const url = URL.createObjectURL(svgFile);
			img.src = url;
			img.onloadend = () => URL.revokeObjectURL(url);
		});
	}

	wasmConvert(file, outputExt, quality, keepMetadata, onProgress, isRecursive = false) {
		return new Promise((resolve, reject) => {
			const worker = new Worker(workerUrl, { type: 'module' });

			const timeout = setTimeout(() => {
				worker.terminate();
				reject(new Error('Conversion timeout after 30s'));
			}, 30000);

			const handleMessage = (e) => {
				const { type, output, error, progress, id } = e.data;

				if (type === 'ready') {
					worker.postMessage({
						type: 'load',
						wasm: this.wasm,
						id: file.name,
					});
				} else if (type === 'loaded') {
					worker.postMessage({
						type: 'convert',
						input: {
							file,
							name: file.name,
							from: this.getExtension(file.name),
							to: outputExt,
						},
						to: outputExt,
						compression: quality,
						keepMetadata,
						id: file.name,
					});
				} else if (type === 'progress') {
					if (onProgress) {
						// Scale progress: 0-50 for initial load, 50-100 for conversion
						if (isRecursive) {
							onProgress(50 + (progress || 0) / 2);
						} else {
							onProgress(progress || 0);
						}
					}
				} else if (type === 'finished') {
					clearTimeout(timeout);
					worker.removeEventListener('message', handleMessage);
					worker.removeEventListener('error', handleError);
					worker.terminate();

					const baseName = file.name.replace(/\.[^/.]+$/, '');
					const ext = outputExt === '.jpg' ? 'jpg' : outputExt.slice(1);
					const newFileName = `${baseName}.${ext}`;
					const blob = new Blob([output], { type: `image/${ext}` });
					const convertedFile = new File([blob], newFileName, { type: blob.type });

					resolve({
						file: convertedFile,
						blob,
						originalSize: file.size,
						convertedSize: blob.size,
						format: outputExt.toUpperCase(),
					});
				} else if (type === 'error') {
					clearTimeout(timeout);
					worker.removeEventListener('message', handleMessage);
					worker.removeEventListener('error', handleError);
					worker.terminate();
					reject(new Error(error || 'WASM conversion failed'));
				}
			};

			const handleError = (error) => {
				clearTimeout(timeout);
				worker.terminate();
				reject(error);
			};

			worker.addEventListener('message', handleMessage);
			worker.addEventListener('error', handleError);
		});
	}

	async preload() {
		await this.ensureWasmLoaded();
	}

	terminate() {
		// Nothing to clean up
	}
}

const processor = new ImageWasmConverterProcessor();

export default {
	convert: (...args) => processor.convert(...args),
	preload: () => processor.preload(),
	terminate: () => {},
};