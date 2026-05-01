import { FFmpeg } from '@ffmpeg/ffmpeg';

class VideoWasmConverterProcessor {
    constructor() {
        this.ffmpegInstances = new Map();
    }

    // eslint-disable-next-line no-unused-vars
    async convert(file, outputFormat, quality = null, onProgress = null) {
        // ... quality is kept as optional arg for unified processor API uniformity
        let outputExt = outputFormat.toLowerCase();
        if (!outputExt.startsWith('.')) outputExt = `.${outputExt}`;

        const ffmpeg = new FFmpeg();
        const id = Math.random().toString(36).substr(2, 9);
        this.ffmpegInstances.set(id, ffmpeg);

        try {
            if (onProgress) {
                ffmpeg.on('progress', ({ progress }) => {
                    // scale progress 0 to 100
                    let percent = Math.round(progress * 100);
                    // Prevent it from reporting 100% repeatedly or staying stuck
                    if (percent > 100) percent = 100;
                    onProgress(percent);
                });
            }

            const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
            await ffmpeg.load({
                coreURL: `${baseURL}/ffmpeg-core.js`,
                wasmURL: `${baseURL}/ffmpeg-core.wasm`,
            });

            // Write input file to virtual FS
            const data = await file.arrayBuffer();
            await ffmpeg.writeFile('input', new Uint8Array(data));

            // Build Conversion command
            const command = await this.buildConversionCommand(file.name, outputExt);

            // Execute FFmpeg
            await ffmpeg.exec(command);

            // Read output from virtual FS
            const outputData = await ffmpeg.readFile('output' + outputExt);

            // Clean up
            ffmpeg.terminate();
            this.ffmpegInstances.delete(id);

            const inputBaseName = file.name.split('.').slice(0, -1).join('.');
            const outputFileName = inputBaseName + outputExt;

            const blob = new Blob([outputData.buffer], { type: 'video/' + outputExt.replace('.', '') });

            return {
                file: new File([blob], outputFileName, { type: blob.type })
            };
        } catch (error) {
            ffmpeg.terminate();
            this.ffmpegInstances.delete(id);
            throw error;
        }
    }

    getCodecs(ext) {
        switch (ext) {
            case ".mp4":
            case ".mkv":
            case ".mov":
            case ".mts":
            case ".ts":
            case ".m2ts":
            case ".flv":
            case ".f4v":
            case ".m4v":
            case ".3gp":
            case ".3g2":
                return { video: "libx264", audio: "aac" };
            case ".wmv":
                return { video: "wmv2", audio: "wmav2" };
            case ".webm":
            case ".ogv":
                return {
                    video: ext === ".webm" ? "libvpx" : "libtheora",
                    audio: "libvorbis",
                };
            case ".avi":
            case ".divx":
                return { video: "mpeg4", audio: "libmp3lame" };
            case ".mpg":
            case ".mpeg":
            case ".vob":
                return { video: "mpeg2video", audio: "mp2" };
            case ".mxf":
                return { video: "mpeg2video", audio: "pcm_s16le" };
            case ".gif":
                return { video: "gif", audio: null };
            default:
                return { video: "libx264", audio: "aac" };
        }
    }

    getToArgs(ext) {
        const codecs = this.getCodecs(ext);
        const args = ["-c:v", codecs.video];

        switch (codecs.video) {
            case "libx264": {
                args.push(
                    "-preset", "ultrafast",
                    "-crf", "23"
                );
                break;
            }
            case "mpeg2video": {
                if (ext === ".mxf") args.push("-ar", "48000");
                break;
            }
        }

        if (codecs.audio) {
            args.push("-c:a", codecs.audio);
            if (codecs.audio === "aac") args.push("-strict", "experimental");
        }

        return args;
    }

    async buildConversionCommand(inputName, outputExt) {
        const codecArgs = this.getToArgs(outputExt);

        let extraArgs = [];
        // Optional quality configuration can be added here

        return [
            '-i', 'input',
            ...codecArgs,
            ...extraArgs,
            'output' + outputExt
        ];
    }
}

export default new VideoWasmConverterProcessor();