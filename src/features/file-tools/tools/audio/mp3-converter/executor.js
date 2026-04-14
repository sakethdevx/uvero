import { assertModeSupported } from '../../../core/executorUtils';
import audioConverterExecutor from '../audio-converter/executor';

const toolId = 'mp3-converter';
const supportedModes = [...audioConverterExecutor.supportedModes];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(mp3ConverterExecutor, mode, toolId);

    return audioConverterExecutor.run({
        ...input,
        options: {
            ...(input.options || {}),
            format: 'mp3',
        },
    });
}

const mp3ConverterExecutor = {
    toolId,
    supportedModes,
    run,
};

export default mp3ConverterExecutor;
