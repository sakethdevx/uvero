import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'compress-video';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(videoCompressorExecutor, mode, toolId);
    return runOffline(input);
}

const videoCompressorExecutor = {
    toolId,
    supportedModes,
    run,
};

export default videoCompressorExecutor;
