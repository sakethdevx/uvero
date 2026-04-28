import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'compress-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(pdfCompressorExecutor, mode, toolId);
    return runOffline(input);
}

const pdfCompressorExecutor = {
    toolId,
    supportedModes,
    run,
};

export default pdfCompressorExecutor;
