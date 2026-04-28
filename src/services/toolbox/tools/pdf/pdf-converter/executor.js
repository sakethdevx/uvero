import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'convert-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(pdfConverterExecutor, mode, toolId);
    return runOffline(input);
}

const pdfConverterExecutor = {
    toolId,
    supportedModes,
    run,
};

export default pdfConverterExecutor;
