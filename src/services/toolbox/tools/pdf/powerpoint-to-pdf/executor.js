import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'powerpoint-to-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(powerPointToPdfExecutor, mode, toolId);
    return runOffline(input);
}

const powerPointToPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default powerPointToPdfExecutor;
