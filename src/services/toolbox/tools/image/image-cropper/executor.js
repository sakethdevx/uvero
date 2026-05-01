import { run as processorRun } from './offline';

const toolId = 'crop-image';

async function run(input) {
    return processorRun(input);
}

const imageCropperExecutor = {
    toolId,
    run,
};

export default imageCropperExecutor;
