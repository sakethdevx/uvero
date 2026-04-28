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
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
};

async function pandoc(args_str, in_data, in_name, out_ext) {
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
        new wasiShim.File(new Uint8Array(), { readonly: false }),
        stderr_file,
        root,
        new wasiShim.PreopenDirectory('/tmp', new Map()),
    ];

    const wasi = new wasiShim.WASI(args, [], fds, { debug: false });
    const { instance } = await WebAssembly.instantiate(wasm, {
        wasi_snapshot_preview1: wasi.wasiImport,
    });

    wasi.initialize(instance);
    instance.exports.__wasm_call_ctors();

    const memory = instance.exports.memory;
    const memoryView = new Uint8Array(memory.buffer);

    function malloc(size) {
        const ptr = instance.exports.malloc(size);
        if (ptr === 0) throw new Error('malloc failed');
        return ptr;
    }

    function writeString(ptr, str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        memoryView.set(data, ptr);
        return data.length;
    }

    // Build argv
    const argc_ptr = malloc(4);
    memoryView.setUint32(argc_ptr, args.length, true);
    const argv = malloc(4 * (args.length + 1));
    for (let i = 0; i < args.length; ++i) {
        const argPtr = malloc(args[i].length + 1);
        writeString(argPtr, args[i]);
        memoryView.setUint8(argPtr + args[i].length, 0);
        memoryView.setUint32(argv + 4 * i, argPtr, true);
    }
    memoryView.setUint32(argv + 4 * args.length, 0, true);
    const argv_ptr = malloc(4);
    memoryView.setUint32(argv_ptr, argv, true);

    instance.exports.hs_init_with_rtsopts(argc_ptr, argv_ptr);

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
}

const zipFiles = async (output, entries) => {
    const zipFormatted = pandocToFiles(entries);
    const zippedBlob = await makeZip([...zipFormatted, output]);
    return new Uint8Array(await zippedBlob.arrayBuffer());
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

const handleMessage = async (message) => {
    switch (message.type) {
        case 'load': {
            wasm = message.wasm;
            self.postMessage({ type: 'loaded', id: message.id });
            break;
        }
        case 'convert': {
            try {
                const { to: ext, input } = message;
                const file = input.file;
                const to = ext;
                if (to === '.rtf') {
                    throw new Error('Converting into RTF is currently not supported.');
                }
                const fromExt = '.' + (file.name.split('.').pop() || '');
                const args = `-f ${formatToReader(fromExt)} -t ${formatToReader(to)} --extract-media=.`;
                const [result, stderr, isZip] = await pandoc(args, new Uint8Array(await file.arrayBuffer()), file.name, to);
                if (result.length === 0) {
                    return {
                        type: 'error',
                        error: stderr
                            .replaceAll('\\n', '\n')
                            .replaceAll('\\"', '"')
                            .split('"')
                            .slice(1, -1)
                            .join('"'),
                        errorKind: stderr.split(' ')[0],
                    };
                }
                return {
                    type: 'finished',
                    output: result,
                    isZip: isZip,
                };
            } catch (e) {
                console.error(e);
                return { type: 'error', error: e };
            }
        }
    }
};
