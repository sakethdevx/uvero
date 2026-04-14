import { useEffect, useMemo, useState } from 'react';
import { getToolMetadata } from './toolMetadata.js';
import {
    createRuntimeVerificationFailure,
    normalizeToolRuntimeStatus,
} from './toolRuntimeStatus.js';

export function useToolRuntimeStatus(toolId) {
    const tool = useMemo(() => getToolMetadata(toolId), [toolId]);
    const [runtimeStatus, setRuntimeStatus] = useState(() =>
        normalizeToolRuntimeStatus(toolId, null)
    );
    const [isLoading, setIsLoading] = useState(true);
    const [hasVerificationFailure, setHasVerificationFailure] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadRuntimeStatus = async () => {
            setIsLoading(true);

            try {
                const response = await fetch('/api/toolbox/runtime-status');
                if (!response.ok) {
                    throw new Error('Failed to load runtime status.');
                }

                const data = await response.json();
                const nextStatus = data.tools?.[toolId];

                if (!nextStatus) {
                    throw new Error(`Runtime status for ${toolId} is missing.`);
                }

                if (!cancelled) {
                    setRuntimeStatus(normalizeToolRuntimeStatus(toolId, nextStatus));
                    setHasVerificationFailure(false);
                }
            } catch {
                if (!cancelled) {
                    setRuntimeStatus(createRuntimeVerificationFailure(toolId));
                    setHasVerificationFailure(true);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadRuntimeStatus();

        return () => {
            cancelled = true;
        };
    }, [tool, toolId]);

    return {
        status: runtimeStatus.status,
        isLoading,
        isAvailable: !isLoading && runtimeStatus.available === true && !hasVerificationFailure,
        hasVerificationFailure,
        note: runtimeStatus.note || tool.availabilityNote,
        limits: runtimeStatus.limits || tool.limits || [],
        runtime: runtimeStatus.runtime || null,
    };
}

export default useToolRuntimeStatus;
