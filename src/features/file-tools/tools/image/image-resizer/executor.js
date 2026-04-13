import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'resize-image';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(imageResizerExecutor, mode, toolId);
    return runOffline(input);
}

const imageResizerExecutor = {
    toolId,
    supportedModes,
    run,
};

export default imageResizerExecutor;
