import {
	initializeImageMagick,
	MagickFormat,
	MagickImage,
	MagickImageCollection,
	MagickReadSettings,
} from "@imagemagick/magick-wasm";
import { makeZip } from "client-zip";

let magickInitialized = false;

self.postMessage({ type: "ready", id: "0" });

const handleMessage = async (message) => {
	switch (message.type) {
		case "load": {
			try {
				if (!message.wasm || !(message.wasm instanceof ArrayBuffer)) {
					throw new Error(`Invalid WASM data: ${typeof message.wasm}`);
				}
				const wasmBytes = new Uint8Array(message.wasm);
				await initializeImageMagick(wasmBytes);
				magickInitialized = true;
				self.postMessage({ type: "loaded", id: message.id });
			} catch (error) {
				self.postMessage({
					type: "error",
					error: `Failed to load ImageMagick WASM: ${error.message}`,
					id: message.id,
				});
			}
			break;
		}
		case "convert": {
			if (!magickInitialized) {
				self.postMessage({
					type: "error",
					error: "magick-wasm not initialized",
					id: message.id,
				});
				return;
			}

			const { input, to, compression, keepMetadata } = message;
			const file = input.file;
			let toExt = to;
			if (!toExt.startsWith(".")) toExt = `.${toExt}`;
			toExt = toExt.toLowerCase();
			if (toExt === ".jfif") toExt = ".jpeg";

			let fromExt = input.from;
			if (fromExt === ".jfif") fromExt = ".jpeg";
			if (fromExt === ".fit") fromExt = ".fits";

			const buffer = new Uint8Array(await file.arrayBuffer());

			// Handle SVG separately (convert to PNG via Canvas, then WASM)
			if (fromExt === ".svg") {
				try {
					const pngBlob = await svgToPng(file);
					const pngBuffer = new Uint8Array(await pngBlob.arrayBuffer());
					const img = MagickImage.create(
						pngBuffer,
						new MagickReadSettings({ format: MagickFormat.Png })
					);
					const output = await magickConvert(img, toExt, keepMetadata, compression);
					self.postMessage({
						type: "finished",
						output,
						id: message.id,
					});
				} catch (err) {
					self.postMessage({
						type: "error",
						error: `SVG conversion failed: ${err.message}`,
						id: message.id,
					});
				}
				return;
			}

			// Handle animated WebP/GIF conversions
			if (
				(fromExt === ".webp" || fromExt === ".gif") &&
				(toExt === ".gif" || toExt === ".webp")
			) {
				const collection = MagickImageCollection.create(buffer);
				const format = toExt === ".gif" ? MagickFormat.Gif : MagickFormat.WebP;
				const result = await new Promise((resolve) => {
					collection.write(format, (output) => {
						resolve(structuredClone(output));
					});
				});
				collection.dispose();

				self.postMessage({
					type: "finished",
					output: result,
					id: message.id,
				});
				return;
			}

			// For other formats, direct conversion
			const img = MagickImage.create(
				buffer,
				new MagickReadSettings({
					format: fromExt.slice(1).toUpperCase(),
				})
			);

			const output = await magickConvert(img, toExt, keepMetadata, compression);

			self.postMessage({
				type: "finished",
				output,
				id: message.id,
			});
			break;
		}
		default:
			self.postMessage({
				type: "error",
				error: `Unknown message type: ${message.type}`,
				id: message.id,
			});
	}
};

const readToEnd = async (reader) => {
	const chunks = [];
	let done = false;
	while (!done) {
		const { value, done: d } = await reader.read();
		if (value) chunks.push(value);
		done = d;
	}
	const blob = new Blob(chunks, { type: "application/zip" });
	const arrayBuffer = await blob.arrayBuffer();
	return new Uint8Array(arrayBuffer);
};

const magickConvert = async (img, to, keepMetadata, compression) => {
	let fmt = to.slice(1).toUpperCase();
	if (fmt === "JFIF") fmt = "JPEG";

	// ICO size clamp
	if (fmt === "ICO") {
		const max = 256;
		const w = img.width;
		const h = img.height;
		if (w > max || h > max) {
			const scale = max / Math.max(w, h);
			const newW = Math.max(1, Math.round(w * scale));
			const newH = Math.max(1, Math.round(h * scale));
			img.resize(newW, newH);
		}
	}

	return new Promise((resolve, reject) => {
		try {
			if (compression) img.quality = compression;
			if (!keepMetadata) img.strip();

			img.write(fmt, (output) => {
				resolve(structuredClone(output));
			});
		} catch (error) {
			reject(error);
		}
	});
};

const svgToPng = (svgFile) => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.naturalWidth || 512;
			canvas.height = img.naturalHeight || 512;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0);
			canvas.toBlob((blob) => {
				if (blob) resolve(blob);
				else reject(new Error("Failed to convert SVG to PNG"));
			}, "image/png");
		};
		img.onerror = () => reject(new Error("Failed to load SVG image"));
		const url = URL.createObjectURL(svgFile);
		img.src = url;
		img.onloadend = () => URL.revokeObjectURL(url);
	});
};

self.onmessage = (e) => handleMessage(e.data);