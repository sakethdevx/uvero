import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'image-wasm-converter';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(imageWasmConverterExecutor, mode, toolId);
    return runOffline(input);
}

const imageWasmConverterExecutor = {
    toolId,
    supportedModes,
    run,
};

export default imageWasmConverterExecutor;
