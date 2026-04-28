import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'crop-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(cropPdfExecutor, mode, toolId);
    return runOffline(input);
}

const cropPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default cropPdfExecutor;
