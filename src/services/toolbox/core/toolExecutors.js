/**
 * Tool Executors Registry
 * Maps tool IDs to their execution logic (for offline/online modes).
 * Most simple tools run directly in the component and don't need executors.
 */

export function getToolExecutor(toolId) {
    // For now, no executors are needed. All remaining tools are client-side only.
    return null;
}

export function getSupportedModesForToolId(toolId) {
    return null;
}

export function hasToolExecutor(toolId) {
    return false;
}
