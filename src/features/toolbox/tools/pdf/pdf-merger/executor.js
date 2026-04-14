import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'merge-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(pdfMergerExecutor, mode, toolId);
    return runOffline(input);
}

const pdfMergerExecutor = {
    toolId,
    supportedModes,
    run,
};

export default pdfMergerExecutor;
