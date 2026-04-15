import { useMode } from '../context/ModeContext';
import { getToolById } from '../tools';
import { getToolAvailabilityBadge } from '../core/toolMetadata';

const ModeWarning = ({ toolId, shouldVerifyRuntime = false, runtimeStatus = null }) => {
    const { isOnlineMode } = useMode();
    const tool = getToolById(toolId);

    if (!tool || !tool.modes) return null;

    const isAvailable = tool.modes.includes(isOnlineMode ? 'online' : 'offline');
    const isOfflineOnly = tool.modes.length === 1 && tool.modes[0] === 'offline';
    const isOnlineOnly = tool.modes.length === 1 && tool.modes[0] === 'online';
    const availabilityBadge = getToolAvailabilityBadge(tool);
    const hasToolStatusDetails = Boolean(tool.availabilityNote) || (tool.limits?.length ?? 0) > 0;
    const showRuntimeUnavailable = shouldVerifyRuntime && runtimeStatus && !runtimeStatus.isLoading && !runtimeStatus.isAvailable;
    const showRuntimeReady = shouldVerifyRuntime && runtimeStatus && !runtimeStatus.isLoading && runtimeStatus.isAvailable;

    // Tool is available in current mode
    if (isAvailable) {
        if (showRuntimeUnavailable) {
            return (
                <div className="bg-orange-50 dark:bg-orange-500/10 border-l-4 border-orange-500 p-6 rounded-xl mb-6 transition-colors">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">
                                Online runtime unavailable on this deployment
                            </h3>
                            <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
                                {runtimeStatus.note || 'This tool needs a server-side runtime when used in online mode, and that runtime is not ready on this deployment.'}
                            </p>
                            {runtimeStatus.limits?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {runtimeStatus.limits.map((limit) => (
                                        <span
                                            key={limit}
                                            className="inline-flex rounded-full border border-orange-200/80 bg-white/70 px-2.5 py-1 text-xs font-medium text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/5 dark:text-orange-200"
                                        >
                                            {limit}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        // Show info about mode-specific features if any
        if (tool.modes.length > 1 || hasToolStatusDetails || shouldVerifyRuntime) {
            return (
                <div className="bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-xl mb-6 transition-colors">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            {tool.modes.length > 1 && (
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    Currently in <strong>{isOnlineMode ? 'online' : 'offline'}</strong> mode.
                                    {isOnlineMode ? ' Using server-side processing for enhanced capabilities.' : ' All processing happens in your browser for maximum privacy.'}
                                </p>
                            )}
                            {shouldVerifyRuntime && (
                                <div className={tool.modes.length > 1 ? 'mt-3' : ''}>
                                    {runtimeStatus?.isLoading ? (
                                        <p className="text-sm text-blue-800 dark:text-blue-300">
                                            Checking whether the server runtime for this online workflow is ready on this deployment...
                                        </p>
                                    ) : showRuntimeReady && runtimeStatus?.runtime ? (
                                        <p className="text-sm text-blue-800 dark:text-blue-300">
                                            Runtime verified: <strong>{runtimeStatus.runtime}</strong>
                                        </p>
                                    ) : null}
                                </div>
                            )}
                            {hasToolStatusDetails && (
                                <div className={tool.modes.length > 1 ? 'mt-3' : ''}>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {availabilityBadge && (
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${availabilityBadge.className}`}>
                                                {availabilityBadge.label}
                                            </span>
                                        )}
                                        {tool.availabilityNote && (
                                            <p className="text-sm text-blue-800 dark:text-blue-300">{tool.availabilityNote}</p>
                                        )}
                                    </div>
                                    {tool.limits?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {tool.limits.map((limit) => (
                                                <span
                                                    key={limit}
                                                    className="inline-flex rounded-full border border-blue-200/80 bg-white/70 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-200"
                                                >
                                                    {limit}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    }

    // Tool is NOT available in current mode
    return (
        <div className="bg-orange-50 dark:bg-orange-500/10 border-l-4 border-orange-500 p-6 rounded-xl mb-6 transition-colors">
            <div className="flex items-start">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                    <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-2">
                        This tool requires {isOfflineOnly ? 'offline' : 'online'} mode
                    </h3>
                    <p className="text-sm text-orange-800 dark:text-orange-300 mb-3 leading-relaxed">
                        {isOnlineOnly
                            ? 'This tool requires server-side processing and is only available in online mode. Please switch to online mode using the toggle in the header.'
                            : 'This tool only works in offline mode for privacy and security. Please switch to offline mode using the toggle in the header.'}
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-500 font-medium">
                        💡 <strong>Tip:</strong> Use the toggle switch (🔒 Offline / ☁️ Online) in the navigation bar to change modes.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ModeWarning;
