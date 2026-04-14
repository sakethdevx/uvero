import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'scan-to-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(scanToPdfExecutor, mode, toolId);
    return runOffline(input);
}

const scanToPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default scanToPdfExecutor;
