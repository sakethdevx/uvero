import * as wasiShim from '@bjorn3/browser_wasi_shim';
import { makeZip } from 'client-zip';

let wasm = null;

self.onmessage = async (e) => {
    const { type, wasm: wasmData, input, to, id } = e.data;

    if (type === 'load' && wasmData) {
        try {
            wasm = wasmData;
            self.postMessage({ type: 'loaded', id });
        } catch (err) {
            self.postMessage({ type: 'error', error: err.message, id });
        }
        return;
    }

    if (type !== 'convert') {
        return;
    }

    try {
        if (!wasm) {
            throw new Error('Pandoc WASM not loaded');
        }

        self.postMessage({ type: 'progress', progress: 10 });

        const file = input.file;
        if (!file) {
            throw new Error('No file provided');
        }

        // Determine output format: use top-level `to` or fallback to input.to
        const toRaw = to || (input && input.to);
        if (!toRaw) {
            throw new Error('Output format not specified');
        }
        const toExt = toRaw.startsWith('.') ? toRaw : `.${toRaw}`;

        // Determine input format from file extension
        const fromExt = '.' + (file.name.split('.').pop()?.toLowerCase() || 'txt');

        // Validate formats
        let fromFormat, toFormat;
        try {
            fromFormat = formatToReader(fromExt);
        } catch (e) {
            throw new Error(`Unsupported input format: ${fromExt}`);
        }
        try {
            toFormat = formatToReader(toExt);
        } catch (e) {
            throw new Error(`Unsupported output format: ${toExt}`);
        }

        self.postMessage({ type: 'progress', progress: 20 });

        const buf = new Uint8Array(await file.arrayBuffer());
        const args = `-f ${fromFormat} -t ${toFormat} --extract-media=.`;

        const [result, stderr, isZip] = await runPandoc(args, buf, file.name, toExt);

        self.postMessage({ type: 'progress', progress: 90 });

        if (result.length === 0) {
            throw new Error(stderr || 'Conversion produced no output');
        }

        self.postMessage({
            type: 'finished',
            output: result,
            isZip,
            id
        });
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.message,
            id
        });
    }
};

const formatToReader = (format) => {
    switch (format) {
        case '.md':
        case '.markdown':
            return 'markdown';
        case '.doc':
        case '.docx':
            return 'docx';
        case '.csv':
            return 'csv';
        case '.tsv':
            return 'tsv';
        case '.docbook':
            return 'docbook';
        case '.epub':
            return 'epub';
        case '.html':
            return 'html';
        case '.json':
            return 'json';
        case '.odt':
            return 'odt';
        case '.rtf':
            return 'rtf';
        case '.rst':
            return 'rst';
        case '.pdf':
            return 'pdf';
        case '.txt':
            return 'markdown'; // plain text as markdown
        case '.tex':
            return 'latex';
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
};

async function runPandoc(args_str, in_data, in_name, out_ext) {
    if (!wasm) throw new Error('WASM not loaded');

    let stderr = '';
    const baseArgs = ['pandoc.wasm', '+RTS', '-H64m', '-RTS'];
    const extraArgs = args_str.split(' ');
    const args = [...baseArgs, ...extraArgs];

    const in_file = new wasiShim.File(in_data, { readonly: true });
    const out_file = new wasiShim.File(new Uint8Array(), { readonly: false });
    const stderr_file = new wasiShim.File(new Uint8Array(), { readonly: false });
    const tmp_file = new wasiShim.File(new Uint8Array(), { readonly: false });

    const map = new Map([
        ['in', in_file],
        ['out', out_file],
        ['tmp', tmp_file],
    ]);
    const root = new wasiShim.PreopenDirectory('/', map);

    const fds = [
        new wasiShim.OpenFile(new wasiShim.File(new Uint8Array(), { readonly: true })),
        new wasiShim.OpenFile(new wasiShim.File(new Uint8Array(), { readonly: false })),
        new wasiShim.OpenFile(stderr_file),
        root,
        new wasiShim.PreopenDirectory('/tmp', new Map()),
    ];

    try {
        const wasi = new wasiShim.WASI(args, [], fds, { debug: false });
        const { instance } = await WebAssembly.instantiate(wasm, {
            wasi_snapshot_preview1: wasi.wasiImport,
        });

        wasi.initialize(instance);
        instance.exports.__wasm_call_ctors();

        const memory = instance.exports.memory;
        let memoryU8 = new Uint8Array(memory.buffer);
        let memoryView = new DataView(memory.buffer);

        function refreshMemory() {
            if (memoryU8.buffer.byteLength === 0) {
                memoryU8 = new Uint8Array(memory.buffer);
                memoryView = new DataView(memory.buffer);
            }
        }

        function malloc(size) {
            const ptr = instance.exports.malloc(size);
            if (ptr === 0) throw new Error('malloc failed');
            refreshMemory();
            return ptr;
        }

        function writeString(ptr, str) {
            refreshMemory();
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            memoryU8.set(data, ptr);
            return data.length;
        }

        const argc_ptr = malloc(4);
        refreshMemory();
        memoryView.setUint32(argc_ptr, args.length, true);
        const argv = malloc(4 * (args.length + 1));
        refreshMemory();
        for (let i = 0; i < args.length; ++i) {
            const argPtr = malloc(args[i].length + 1);
            writeString(argPtr, args[i]);
            refreshMemory();
            memoryU8[argPtr + args[i].length] = 0; // null terminator
            memoryView.setUint32(argv + 4 * i, argPtr, true);
        }
        memoryView.setUint32(argv + 4 * args.length, 0, true);
        const argv_ptr = malloc(4);
        refreshMemory();
        memoryView.setUint32(argv_ptr, argv, true);

        instance.exports.hs_init_with_rtsopts(argc_ptr, argv_ptr);
        refreshMemory();

        const command = extraArgs.join(' ');
        const commandPtr = malloc(command.length);
        writeString(commandPtr, command);
        instance.exports.wasm_main(commandPtr, command.length);

        stderr = new TextDecoder().decode(stderr_file.data);

        const openedPath = root.dir.path_open(0, BigInt(0), 0).fd_obj;
        const dirRet = openedPath.path_lookup('.', 0);
        const dir = dirRet.inode_obj;
        if (dir) {
            const opened = dir.path_open(0, BigInt(0), 0).fd_obj;
            if (opened) {
                const fs = readRecursive(opened);
                const folders = [...fs.entries()].filter(
                    (f) => f[0] !== 'in' && f[0] !== 'out' && f[0] !== 'tmp'
                );
                if (folders.length > 0) {
                    const outFile = new File(
                        [new Uint8Array(Array.from(out_file.data))],
                        `${in_name.split('.').slice(0, -1).join('.')}${out_ext}`
                    );
                    const zipEntries = new Map(folders);
                    const zipped = await zipFiles(outFile, zipEntries);
                    return [zipped, stderr, true];
                }
            }
        }
        return [out_file.data, stderr, false];
    } catch (err) {
        stderr = err.message;
        return [new Uint8Array(), stderr, false];
    }
}

const zipFiles = async (output, entries) => {
    const zipFormatted = pandocToFiles(entries);
    const zipped = makeZip([...zipFormatted, output]);
    const reader = zipped.getReader();
    const chunks = [];
    let done = false;
    while (!done) {
        const { done: d, value } = await reader.read();
        done = d;
        if (value) {
            chunks.push(value);
        }
    }
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
};

const pandocToFiles = (entries, parent = '') => {
    const flattened = [];
    for (const [name, entry] of entries) {
        const fullPath = parent ? `${parent}/${name}` : name;
        if (entry.type === 'folder') {
            flattened.push(...pandocToFiles(entry.entries, fullPath));
        } else {
            const file = new File([new Uint8Array(Array.from(entry.data))], fullPath);
            flattened.push(file);
        }
    }
    return flattened;
};

const readRecursive = (fd) => {
    try {
        const dir = fd.path_lookup('.', 0).inode_obj;
        if (!dir) return new Map();
        const dirEntries = dir.contents;
        return readRecursiveInternal(dirEntries);
    } catch (e) {
        return new Map();
    }
};

const readRecursiveInternal = (contents) => {
    const entries = new Map();
    for (const [name, entry] of contents) {
        if (entry instanceof wasiShim.File) {
            entries.set(name, { data: entry.data, type: 'file' });
        } else {
            entries.set(name, {
                entries: readRecursiveInternal(entry.contents),
                type: 'folder',
            });
        }
    }
    return entries;
};
