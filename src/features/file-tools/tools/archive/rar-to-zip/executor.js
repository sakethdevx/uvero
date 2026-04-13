import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOnline } from './online';

const toolId = 'rar-to-zip';
const supportedModes = ['online'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(rarToZipExecutor, mode, toolId);
    return runOnline(input);
}

const rarToZipExecutor = {
    toolId,
    supportedModes,
    run,
};

export default rarToZipExecutor;
