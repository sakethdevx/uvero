import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'remove-background';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(backgroundRemoverExecutor, mode, toolId);
    return runOffline(input);
}

const backgroundRemoverExecutor = {
    toolId,
    supportedModes,
    run,
};

export default backgroundRemoverExecutor;
