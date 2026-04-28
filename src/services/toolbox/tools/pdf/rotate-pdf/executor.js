import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'rotate-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(rotatePdfExecutor, mode, toolId);
    return runOffline(input);
}

const rotatePdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default rotatePdfExecutor;
