import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';
import { run as runOnline } from './online';

const toolId = 'video-to-gif';
const supportedModes = ['offline', 'online'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(videoToGifExecutor, mode, toolId);

    if (mode === 'online') {
        return runOnline(input);
    }

    return runOffline(input);
}

const videoToGifExecutor = {
    toolId,
    supportedModes,
    run,
};

export default videoToGifExecutor;
