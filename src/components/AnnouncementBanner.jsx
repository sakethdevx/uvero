import React, { useState, useEffect } from 'react';

/**
 * AnnouncementBanner component
 * Displays a sleek, dismissive-able announcement bar with a modern look.
 */
const AnnouncementBanner = ({ message, badge, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        // Delay unmounting for animation
        setTimeout(() => {
            setShouldRender(false);
            if (onDismiss) onDismiss();
        }, 300);
    };

    if (!shouldRender) return null;

    return (
        <div 
            className={`relative overflow-hidden transition-all duration-300 ease-in-out ${isVisible ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}
        >
            <div className="bg-gradient-to-r from-primary-600 via-blue-600 to-indigo-700 dark:from-primary-700 dark:via-blue-800 dark:to-indigo-900 shadow-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex items-center gap-3">
                                {badge && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/20">
                                        {badge}
                                    </span>
                                )}
                                <p className="text-sm font-medium text-white text-center">
                                    <span className="sm:inline">{message}</span>
                                </p>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                            aria-label="Dismiss announcement"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Subtle bottom glow effect */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-300/30 to-transparent" />
        </div>
    );
};

export default AnnouncementBanner;
