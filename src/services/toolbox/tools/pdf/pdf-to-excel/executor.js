import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'pdf-to-excel';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(pdfToExcelExecutor, mode, toolId);
    return runOffline(input);
}

const pdfToExcelExecutor = {
    toolId,
    supportedModes,
    run,
};

export default pdfToExcelExecutor;
