import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'video-to-gif';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(videoToGifExecutor, mode, toolId);
    return runOffline(input);
}

const videoToGifExecutor = {
    toolId,
    supportedModes,
    run,
};

export default videoToGifExecutor;
