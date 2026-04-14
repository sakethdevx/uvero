import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'archive-converter';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(archiveConverterExecutor, mode, toolId);
    return runOffline(input);
}

const archiveConverterExecutor = {
    toolId,
    supportedModes,
    run,
};

export default archiveConverterExecutor;
