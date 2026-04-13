import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'watermark';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(watermarkExecutor, mode, toolId);
    return runOffline(input);
}

const watermarkExecutor = {
    toolId,
    supportedModes,
    run,
};

export default watermarkExecutor;
