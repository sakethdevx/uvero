import { assertModeSupported } from '../../../core/executorUtils';
import videoConverterExecutor from '../video-converter/executor';

const toolId = 'mp4-converter';
const supportedModes = [...videoConverterExecutor.supportedModes];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(mp4ConverterExecutor, mode, toolId);

    return videoConverterExecutor.run({
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
