import { assertModeSupported } from '../../../core/executorUtils';
import videoToMp3Executor from '../video-to-mp3/executor';

const toolId = 'mp4-to-mp3';
const supportedModes = [...videoToMp3Executor.supportedModes];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(mp4ToMp3Executor, mode, toolId);
    return videoToMp3Executor.run(input);
}

const mp4ToMp3Executor = {
    toolId,
    supportedModes,
    run,
};

export default mp4ToMp3Executor;
