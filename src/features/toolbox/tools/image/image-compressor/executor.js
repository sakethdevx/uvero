import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline, cleanup as cleanupOffline } from './offline';
import { run as runOnline } from './online';

const toolId = 'compress-image';
const supportedModes = ['offline', 'online'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(imageCompressorExecutor, mode, toolId);

    if (mode === 'online') {
        return runOnline(input);
    }

    return runOffline(input);
}

function cleanup() {
    cleanupOffline();
}

const imageCompressorExecutor = {
    toolId,
    supportedModes,
    run,
    cleanup,
};

export default imageCompressorExecutor;
