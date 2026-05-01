import * as wasiShim from '@bjorn3/browser_wasi_shim';
import { makeZip } from 'client-zip';

let wasm = null;

self.onmessage = async (e) => {
    const message = e.data;
    try {
        const res = await handleMessage(message);
        if (!res) return;
        self.postMessage({
            ...res,
            id: message.id,
        });
    } catch (e) {
        self.postMessage({
            type: 'error',
            error: e,
            id: message.id,
        });
    }
};

const handleMessage = async (message) => {
    switch (message.type) {
        case 'load': {
            if (!message.wasm || !(message.wasm instanceof ArrayBuffer)) {
                throw new Error(`Invalid WASM data: ${typeof message.wasm}`);
            }
            const wasmBytes = new Uint8Array(message.wasm);
            wasm = wasmBytes;
            return { type: 'loaded', id: '0' };
        }
        case 'convert': {
            if (!wasm) {
                return { type: 'error', error: 'Pandoc WASM not loaded' };
            }

            const { to, input } = message;
            const file = input.file;
            const outExt = to;

            const buf = new Uint8Array(await file.arrayBuffer());
            const fromExt = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
            const toExt = to.startsWith('.') ? to : '.' + to;
            const args = `-f ${formatToReader(fromExt)} -t ${formatToReader(toExt)} --extract-media=.`;

            const [result, stderr, zip] = await pandoc(args, buf, file.name, toExt);

            if (result.length === 0) {
                return {
                    type: 'error',
                    error: stderr.replaceAll('\\n', '\n').replaceAll('\\"', '"').split('"').slice(1, -1).join('"'),
                    errorKind: stderr.split(' ')[0],
                };
            }

            return {
                type: 'finished',
                output: result,
                isZip: zip,
            };
        }
        default:
            return { type: 'error', error: `Unknown message type: ${message.type}` };
    }
};

const formatToReader = (format) => {
    let fmt = format;
    if (!fmt.startsWith('.')) fmt = '.' + fmt;
    fmt = fmt.toLowerCase();
    switch (fmt) {
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
        case '.pdf':
            return 'latex';
        case '.rtf':
            return 'rtf';
        case '.rst':
            return 'rst';
        case '.txt':
            return 'markdown'; // plain text as markdown
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
};

async function pandoc(args_str, in_data, in_name, out_ext) {
    if (!wasm) throw new Error('WASM not loaded');
    let stderr = '';
    const args = ['pandoc.wasm', '+RTS', '-H64m', '-RTS'];
    const env = [];
    const in_file = new wasiShim.File(in_data, { readonly: true });
    const out_file = new wasiShim.File(new Uint8Array(), { readonly: false });
    const map = new Map([
        ['in', in_file],
        ['out', out_file],
    ]);
    const root = new wasiShim.PreopenDirectory('/', map);
    const fds = [
        new wasiShim.OpenFile(new wasiShim.File(new Uint8Array(), { readonly: true })),
        wasiShim.ConsoleStdout.lineBuffered((msg) => {
            console.log(`[WASI stdout] ${msg}`);
        }),
        wasiShim.ConsoleStdout.lineBuffered((msg) => {
            console.warn(`[WASI stderr] ${msg}`);
            stderr += msg + '\n';
        }),
        root,
        new wasiShim.PreopenDirectory('/tmp', new Map()),
    ];

    const wasi = new wasiShim.WASI(args, env, fds, { debug: false });
    const { instance } = await WebAssembly.instantiate(wasm, {
        wasi_snapshot_preview1: wasi.wasiImport,
    });

    wasi.initialize(instance);
    instance.exports.__wasm_call_ctors();

    function memory_data_view() {
        return new DataView(instance.exports.memory.buffer);
    }

    const argc_ptr = instance.exports.malloc(4);
    memory_data_view().setUint32(argc_ptr, args.length, true);
    const argv = instance.exports.malloc(4 * (args.length + 1));
    for (let i = 0; i < args.length; ++i) {
        const argPtr = instance.exports.malloc(args[i].length + 1);
        new TextEncoder().encodeInto(
            args[i],
            new Uint8Array(instance.exports.memory.buffer, argPtr, args[i].length)
        );
        memory_data_view().setUint8(argPtr + args[i].length, 0);
        memory_data_view().setUint32(argv + 4 * i, argPtr, true);
    }
    memory_data_view().setUint32(argv + 4 * args.length, 0, true);
    const argv_ptr = instance.exports.malloc(4);
    memory_data_view().setUint32(argv_ptr, argv, true);

    instance.exports.hs_init_with_rtsopts(argc_ptr, argv_ptr);

    const args_ptr = instance.exports.malloc(args_str.length);
    new TextEncoder().encodeInto(
        args_str,
        new Uint8Array(instance.exports.memory.buffer, args_ptr, args_str.length)
    );

    instance.exports.wasm_main(args_ptr, args_str.length);

    const openedPath = root.dir.path_open(0, BigInt(0), 0).fd_obj;
    const dirRet = openedPath.path_lookup('.', 0);
    const dir = dirRet.inode_obj;
    if (dir) {
        const opened = dir.path_open(0, BigInt(0), 0).fd_obj;
        if (opened) {
            const fs = readRecursive(opened);
            const folders = [...fs.entries()].filter((f) => f[0] !== 'in' && f[0] !== 'out');
            if (folders.length > 0) {
                const baseName = in_name.split('.').slice(0, -1).join('.');
                const safeToExt = toExt.startsWith('.') ? toExt : '.' + toExt;
                const file = new File(
                    [new Uint8Array(Array.from(out_file.data))],
                    `${baseName}${safeToExt}`
                );
                const zipped = await zipFiles(file, new Map(folders));
                return [zipped, stderr, true];
            }
        }
    }
    return [out_file.data, stderr, false];
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
        if (value) chunks.push(value);
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