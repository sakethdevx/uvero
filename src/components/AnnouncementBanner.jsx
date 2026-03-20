import React, { useState, useEffect } from 'react';

/**
 * AnnouncementBanner component
 * Displays multiple announcements with auto-rotation.
 */
const AnnouncementBanner = ({ announcements = [], onDismiss, rotationInterval = 5000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (announcements.length <= 1 || !isVisible) return;

        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % announcements.length);
                setIsTransitioning(false);
            }, 500); // Wait for fade out
        }, rotationInterval);

        return () => clearInterval(interval);
    }, [announcements.length, isVisible, rotationInterval]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            setShouldRender(false);
            if (onDismiss) onDismiss();
        }, 300);
    };

    if (!shouldRender || announcements.length === 0) return null;

    const current = announcements[currentIndex];

    return (
        <div 
            className={`relative overflow-hidden transition-all duration-500 ease-in-out ${isVisible ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}
        >
            <div className="bg-gradient-to-r from-primary-600 via-blue-600 to-indigo-700 dark:from-primary-700 dark:via-blue-800 dark:to-indigo-900 shadow-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        {/* Empty spacer for centering */}
                        <div className="hidden sm:block w-10" />

                        <div className="flex-1 flex items-center justify-center">
                            <div className={`flex items-center gap-3 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                                {current.badge && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/20">
                                        {current.badge}
                                    </span>
                                )}
                                <p className="text-sm font-medium text-white text-center">
                                    <span className="sm:inline">{current.message}</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {announcements.length > 1 && (
                                <div className="hidden sm:flex items-center gap-1.5 mr-2">
                                    {announcements.map((_, idx) => (
                                        <div 
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-3' : 'bg-white/30'}`}
                                        />
                                    ))}
                                </div>
                            )}
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
            </div>
            
            {/* Subtle bottom glow effect */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-300/30 to-transparent" />
        </div>
    );
};

export default AnnouncementBanner;
