/**
 * Tool Metadata
 * Provides metadata about tools for the toolbox.
 * Minimal implementation after consolidation.
 */

// No tools need quick converter eligibility (we use UnifiedConverter instead)
export const QUICK_CONVERTER_ELIGIBLE_TOOL_IDS = [];

// No document converter hub
export const DOCUMENT_CONVERTER_ENTRIES = [];
export const DOCUMENT_CONVERTER_TOOL_IDS = [];

// No tools need online mode offline executor bridge
export const ONLINE_MODE_OFFLINE_EXECUTOR_TOOL_IDS = [];

// No tools require runtime verification
export const RUNTIME_VERIFIED_TOOL_IDS = [];

// No tools require shared metadata
export const TOOLS_REQUIRING_SHARED_METADATA = [];

// Tool-specific metadata overrides
const TOOL_METADATA = {
    // unified-converter: {
    //     availability: 'ready',
    //     availabilityNote: 'Unified file converter for images and documents',
    //     limits: [],
    // },
    // 'background-remover': {
    //     availability: 'ready',
    //     limits: [],
    // },
    // Add other tools if they need special notes
};

/**
 * Get metadata for a tool ID
 */
export function getToolMetadata(toolId) {
    return {
        availability: 'ready',
        availabilityNote: '',
        limits: [],
        quickConverterEligible: QUICK_CONVERTER_ELIGIBLE_TOOL_IDS.includes(toolId),
        ...(TOOL_METADATA[toolId] || {}),
    };
}

export function getDocumentConverterEntries() {
    return DOCUMENT_CONVERTER_ENTRIES.map((entry) => ({ ...entry }));
}

export function requiresRuntimeVerification(toolId) {
    return RUNTIME_VERIFIED_TOOL_IDS.includes(toolId);
}

export function usesOfflineExecutorInOnlineMode(toolId) {
    return ONLINE_MODE_OFFLINE_EXECUTOR_TOOL_IDS.includes(toolId);
}

export function isToolAvailableInMode(tool, mode) {
    return Boolean(tool?.modes?.includes(mode));
}

export function getToolAvailabilityBadge(tool) {
    if (tool.availability === 'deployment_required') {
        return {
            label: 'Setup Required',
            className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        };
    }
    if (tool.availability === 'limited') {
        return {
            label: 'Limited',
            className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
        };
    }
    if (tool.limits?.includes('Hub page only')) {
        return {
            label: 'Hub',
            className: 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300',
        };
    }
    return null;
}
