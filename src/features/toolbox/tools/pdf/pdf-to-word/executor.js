import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'pdf-to-word';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(pdfToWordExecutor, mode, toolId);
    return runOffline(input);
}

const pdfToWordExecutor = {
    toolId,
    supportedModes,
    run,
};

export default pdfToWordExecutor;
