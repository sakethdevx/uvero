import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'html-to-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(htmlToPdfExecutor, mode, toolId);
    return runOffline(input);
}

const htmlToPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default htmlToPdfExecutor;
