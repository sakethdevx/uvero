import { useEffect, useMemo, useState } from 'react';
import { getToolMetadata } from './toolMetadata';

function createUnavailableStatus(tool, note) {
    return {
        available: false,
        status: tool.availability === 'deployment_required' ? 'deployment_required' : 'limited',
        runtime: null,
        note,
        limits: tool.limits || [],
    };
}

export function useToolRuntimeStatus(toolId) {
    const tool = useMemo(() => getToolMetadata(toolId), [toolId]);
    const [runtimeStatus, setRuntimeStatus] = useState(() =>
        createUnavailableStatus(tool, tool.availabilityNote)
    );
    const [isLoading, setIsLoading] = useState(true);
    const [hasVerificationFailure, setHasVerificationFailure] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadRuntimeStatus = async () => {
            setIsLoading(true);

            try {
                const response = await fetch('/api/file-tools/runtime-status');
                if (!response.ok) {
                    throw new Error('Failed to load runtime status.');
                }

                const data = await response.json();
                const nextStatus = data.tools?.[toolId];

                if (!nextStatus) {
                    throw new Error(`Runtime status for ${toolId} is missing.`);
                }

                if (!cancelled) {
                    setRuntimeStatus({
                        ...nextStatus,
                        note: nextStatus.note || tool.availabilityNote,
                        limits: nextStatus.limits || tool.limits || [],
                    });
                    setHasVerificationFailure(false);
                }
            } catch {
                if (!cancelled) {
                    setRuntimeStatus(
                        createUnavailableStatus(
                            tool,
                            'Unable to verify the server-side runtime on this deployment right now.'
                        )
                    );
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
