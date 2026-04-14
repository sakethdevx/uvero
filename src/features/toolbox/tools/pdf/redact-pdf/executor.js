import { assertModeSupported } from '../../../core/executorUtils';
import { getPageInfo, run as runOffline } from './offline';

const toolId = 'redact-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(redactPdfExecutor, mode, toolId);
    return runOffline(input);
}

const redactPdfExecutor = {
    toolId,
    supportedModes,
    run,
    getPageInfo,
};

export default redactPdfExecutor;
