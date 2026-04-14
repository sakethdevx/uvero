import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';
import { run as runOnline } from './online';

const toolId = 'resize-image';
const supportedModes = ['offline', 'online'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(imageResizerExecutor, mode, toolId);

    if (mode === 'online') {
        return runOnline(input);
    }

    return runOffline(input);
}

const imageResizerExecutor = {
    toolId,
    supportedModes,
    run,
};

export default imageResizerExecutor;
