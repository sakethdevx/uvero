import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';
import { run as runOnline } from './online';

const toolId = 'convert-audio';
const supportedModes = ['offline', 'online'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(audioConverterExecutor, mode, toolId);

    if (mode === 'online') {
        return runOnline(input);
    }

    return runOffline(input);
}

const audioConverterExecutor = {
    toolId,
    supportedModes,
    run,
};

export default audioConverterExecutor;
