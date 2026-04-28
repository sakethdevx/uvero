import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'gif-maker';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(gifMakerExecutor, mode, toolId);
    return runOffline(input);
}

const gifMakerExecutor = {
    toolId,
    supportedModes,
    run,
};

export default gifMakerExecutor;
