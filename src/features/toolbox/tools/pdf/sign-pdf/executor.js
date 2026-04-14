import { assertModeSupported } from '../../../core/executorUtils';
import { getPageInfo, run as runOffline } from './offline';

const toolId = 'sign-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(signPdfExecutor, mode, toolId);
    return runOffline(input);
}

const signPdfExecutor = {
    toolId,
    supportedModes,
    run,
    getPageInfo,
};

export default signPdfExecutor;
