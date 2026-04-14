import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'word-to-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(wordToPdfExecutor, mode, toolId);
    return runOffline(input);
}

const wordToPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default wordToPdfExecutor;
