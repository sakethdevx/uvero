import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'translate-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(translatePdfExecutor, mode, toolId);
    return runOffline(input);
}

const translatePdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default translatePdfExecutor;
