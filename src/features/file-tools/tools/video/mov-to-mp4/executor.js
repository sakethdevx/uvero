import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from '../video-converter/offline';

const toolId = 'mov-to-mp4';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(movToMp4Executor, mode, toolId);

    return runOffline({
        ...input,
        options: {
            ...(input.options || {}),
            outputFormat: 'mp4',
        },
    });
}

const movToMp4Executor = {
    toolId,
    supportedModes,
    run,
};

export default movToMp4Executor;
