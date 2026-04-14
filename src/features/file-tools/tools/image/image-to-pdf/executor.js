import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'image-to-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(imageToPdfExecutor, mode, toolId);
    return runOffline(input);
}

const imageToPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default imageToPdfExecutor;
