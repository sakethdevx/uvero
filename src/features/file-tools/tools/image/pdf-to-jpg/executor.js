import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'pdf-to-jpg';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(pdfToJpgExecutor, mode, toolId);
    return runOffline(input);
}

const pdfToJpgExecutor = {
    toolId,
    supportedModes,
    run,
};

export default pdfToJpgExecutor;
