import React, { useState, useCallback } from 'react';

export default function ShareButton({ onShare }) {
    const [showToast, setShowToast] = useState(false);

    const handleClick = useCallback(() => {
        const url = onShare();
        if (url) {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    }, [onShare]);

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                title="Share this code"
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-all"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
            </button>

            {/* Toast */}
            {showToast && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap animate-toast-in">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-lg shadow-xl">
                        <svg className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Link copied!
                    </div>
                </div>
            )}

            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                .animate-toast-in { animation: toast-in 0.2s ease-out both; }
            `}</style>
        </div>
    );
}
