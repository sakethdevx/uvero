import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'pdf-to-powerpoint';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(pdfToPowerPointExecutor, mode, toolId);
    return runOffline(input);
}

const pdfToPowerPointExecutor = {
    toolId,
    supportedModes,
    run,
};

export default pdfToPowerPointExecutor;
