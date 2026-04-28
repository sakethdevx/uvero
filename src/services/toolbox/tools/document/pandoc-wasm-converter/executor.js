import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'pandoc-wasm-converter';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(pandocWasmConverterExecutor, mode, toolId);
    return runOffline(input);
}

const pandocWasmConverterExecutor = {
    toolId,
    supportedModes,
    run,
};

export default pandocWasmConverterExecutor;
