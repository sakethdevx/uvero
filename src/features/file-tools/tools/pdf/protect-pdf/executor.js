import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'protect-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(protectPdfExecutor, mode, toolId);
    return runOffline(input);
}

const protectPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default protectPdfExecutor;
