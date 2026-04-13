import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'compress-audio';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(audioCompressorExecutor, mode, toolId);
    return runOffline(input);
}

const audioCompressorExecutor = {
    toolId,
    supportedModes,
    run,
};

export default audioCompressorExecutor;
