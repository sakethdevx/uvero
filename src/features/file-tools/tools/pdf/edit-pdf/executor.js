import { assertModeSupported } from '../../../core/executorUtils';
import { getPageInfo, run as runOffline } from './offline';

const toolId = 'edit-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(editPdfExecutor, mode, toolId);
    return runOffline(input);
}

const editPdfExecutor = {
    toolId,
    supportedModes,
    run,
    getPageInfo,
};

export default editPdfExecutor;
