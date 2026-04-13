import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'convert-audio';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(audioConverterExecutor, mode, toolId);
    return runOffline(input);
}

const audioConverterExecutor = {
    toolId,
    supportedModes,
    run,
};

export default audioConverterExecutor;
