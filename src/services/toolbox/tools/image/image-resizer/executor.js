import { run as processorRun } from './offline';

const toolId = 'resize-image';

async function run(input) {
    return processorRun(input);
}

const imageResizerExecutor = {
    toolId,
    run,
};

export default imageResizerExecutor;
