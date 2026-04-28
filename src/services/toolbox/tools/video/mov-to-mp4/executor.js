import { assertModeSupported } from '../../../core/executorUtils';
import videoConverterExecutor from '../video-converter/executor';

const toolId = 'mov-to-mp4';
const supportedModes = [...videoConverterExecutor.supportedModes];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(movToMp4Executor, mode, toolId);

    return videoConverterExecutor.run({
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
