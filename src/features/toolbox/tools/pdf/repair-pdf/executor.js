import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'repair-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(repairPdfExecutor, mode, toolId);
    return runOffline(input);
}

const repairPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default repairPdfExecutor;
