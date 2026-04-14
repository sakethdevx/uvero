import { assertModeSupported } from '../../../core/executorUtils';
import { run as runOffline } from './offline';

const toolId = 'excel-to-pdf';
const supportedModes = ['offline'];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(excelToPdfExecutor, mode, toolId);
    return runOffline(input);
}

const excelToPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default excelToPdfExecutor;
