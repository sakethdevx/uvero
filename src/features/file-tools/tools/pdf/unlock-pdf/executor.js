import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'unlock-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(unlockPdfExecutor, mode, toolId);
    return runOffline(input);
}

const unlockPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default unlockPdfExecutor;
