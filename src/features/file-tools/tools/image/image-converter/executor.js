import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline, cleanup as cleanupOffline } from './offline';

const toolId = 'convert-image';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(imageConverterExecutor, mode, toolId);
    return runOffline(input);
}

function cleanup() {
    cleanupOffline();
}

const imageConverterExecutor = {
    toolId,
    supportedModes,
    run,
    cleanup,
};

export default imageConverterExecutor;
