import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'page-numbers';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(pageNumbersExecutor, mode, toolId);
    return runOffline(input);
}

const pageNumbersExecutor = {
    toolId,
    supportedModes,
    run,
};

export default pageNumbersExecutor;
