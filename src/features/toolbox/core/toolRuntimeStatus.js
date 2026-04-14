import { getToolMetadata } from './toolMetadata.js';

export function createUnavailableRuntimeStatus(tool, note) {
    return {
        available: false,
        status: tool.availability === 'deployment_required' ? 'deployment_required' : 'limited',
        runtime: null,
        note,
        limits: tool.limits || [],
    };
}

export function createRuntimeVerificationFailure(toolId) {
    const tool = getToolMetadata(toolId);

    return createUnavailableRuntimeStatus(
        tool,
        'Unable to verify the server-side runtime on this deployment right now.'
    );
}

export function normalizeToolRuntimeStatus(toolId, runtimeStatus) {
    const tool = getToolMetadata(toolId);

    if (!runtimeStatus) {
        return createUnavailableRuntimeStatus(tool, tool.availabilityNote);
    }

    return {
        ...runtimeStatus,
        note: runtimeStatus.note || tool.availabilityNote,
        limits: runtimeStatus.limits || tool.limits || [],
    };
}
