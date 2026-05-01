import { run as processorRun } from './offline';

const toolId = 'pandoc-wasm-converter';

async function run(input) {
    return processorRun(input);
}

const pandocWasmConverterExecutor = {
    toolId,
    run,
};

export default pandocWasmConverterExecutor;
