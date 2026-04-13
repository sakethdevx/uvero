import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from '../video-converter/offline';

const toolId = 'mp4-converter';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(mp4ConverterExecutor, mode, toolId);

    return runOffline({
        ...input,
        options: {
            ...(input.options || {}),
            outputFormat: 'mp4',
        },
    });
}

const mp4ConverterExecutor = {
    toolId,
    supportedModes,
    run,
};

export default mp4ConverterExecutor;
