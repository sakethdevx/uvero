import { run as processorRun } from './offline';

const toolId = 'TOOLID_PLACEHOLDER';

async function run(input) {
    return processorRun(input);
}

const EXECUTOR_PLACEHOLDER = {
    toolId,
    run,
};

export default EXECUTOR_PLACEHOLDER;
