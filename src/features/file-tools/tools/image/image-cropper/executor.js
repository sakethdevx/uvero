import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'crop-image';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(imageCropperExecutor, mode, toolId);
    return runOffline(input);
}

const imageCropperExecutor = {
    toolId,
    supportedModes,
    run,
};

export default imageCropperExecutor;
