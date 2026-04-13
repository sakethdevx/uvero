import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'pdf-to-pdfa';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(pdfToPdfaExecutor, mode, toolId);
    return runOffline(input);
}

const pdfToPdfaExecutor = {
    toolId,
    supportedModes,
    run,
};

export default pdfToPdfaExecutor;
