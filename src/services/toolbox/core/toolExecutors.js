/**
 * Tool Executors Registry
 * Maps tool IDs to their execution logic.
 * For this simplified toolbox, most tools don't need executors.
 *
 * Format expected by check-toolbox-consistency.mjs:
 *   const toolExecutors = {
 *     'tool-id': executorObject,
 *     ...
 *   };
 *
 * Each executorObject should have:
 *   - toolId: string
 *   - supportedModes: array of 'offline' | 'online'
 *   - run: function(input)
 */

// Currently no tools require executors. All remaining utilities run entirely in the component.
const toolExecutors = {
    // empty for now; add executors here if needed
};

export { toolExecutors };
