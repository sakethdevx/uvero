import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'ocr-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(ocrPdfExecutor, mode, toolId);
    return runOffline(input);
}

const ocrPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default ocrPdfExecutor;
