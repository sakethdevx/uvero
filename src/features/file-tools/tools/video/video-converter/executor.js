import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'convert-video';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(videoConverterExecutor, mode, toolId);
    return runOffline(input);
}

const videoConverterExecutor = {
    toolId,
    supportedModes,
    run,
};

export default videoConverterExecutor;
