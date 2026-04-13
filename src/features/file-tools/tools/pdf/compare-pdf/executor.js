import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'compare-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(comparePdfExecutor, mode, toolId);
    return runOffline(input);
}

const comparePdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default comparePdfExecutor;
