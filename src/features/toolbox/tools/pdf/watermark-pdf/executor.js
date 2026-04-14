import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'watermark-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(watermarkPdfExecutor, mode, toolId);
    return runOffline(input);
}

const watermarkPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default watermarkPdfExecutor;
