import { assertModeSupported } from '../../../core/executorUtils';
import { getPageInfo, run as runOffline } from './offline';

const toolId = 'split-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(pdfSplitterExecutor, mode, toolId);
    return runOffline(input);
}

const pdfSplitterExecutor = {
    toolId,
    supportedModes,
    run,
    getPageInfo,
};

export default pdfSplitterExecutor;
