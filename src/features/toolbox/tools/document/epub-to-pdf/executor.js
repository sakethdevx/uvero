import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'epub-to-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(epubToPdfExecutor, mode, toolId);
    return runOffline(input);
}

const epubToPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default epubToPdfExecutor;
