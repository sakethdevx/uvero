import { assertModeSupported } from '../../../core/executorUtils';
import imageToPdfExecutor from '../image-to-pdf/executor';

const toolId = 'jpg-to-pdf';
const supportedModes = [...imageToPdfExecutor.supportedModes];

async function run(input) {
    const mode = input.mode || 'offline';
    assertModeSupported(jpgToPdfExecutor, mode, toolId);
    return imageToPdfExecutor.run(input);
}

const jpgToPdfExecutor = {
    toolId,
    supportedModes,
    run,
};

export default jpgToPdfExecutor;
