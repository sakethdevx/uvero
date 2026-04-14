import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOnline } from './online';

const toolId = 'epub-to-mobi';
const supportedModes = ['online'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(epubToMobiExecutor, mode, toolId);
    return runOnline(input);
}

const epubToMobiExecutor = {
    toolId,
    supportedModes,
    run,
};

export default epubToMobiExecutor;
