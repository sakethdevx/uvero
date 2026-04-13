import { assertModeSupported } from '../../../core/executorUtils';
import { getPageInfo, run as runOffline } from './offline';

const toolId = 'organize-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(organizePdfExecutor, mode, toolId);
    return runOffline(input);
}

const organizePdfExecutor = {
    toolId,
    supportedModes,
    run,
    getPageInfo,
};

export default organizePdfExecutor;
