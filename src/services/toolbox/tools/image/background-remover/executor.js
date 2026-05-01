import { run as processorRun } from './offline';

const toolId = 'remove-background';

async function run(input) {
    return processorRun(input);
}

const backgroundRemoverExecutor = {
    toolId,
    run,
};

export default backgroundRemoverExecutor;
