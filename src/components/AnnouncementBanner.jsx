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
            className={`relative overflow-hidden transition-all duration-300 ease-in-out ${isVisible ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}
        >
            <div className="bg-primary-600 dark:bg-primary-700 border-b border-primary-700 dark:border-primary-600">
                <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <div className="hidden sm:block w-8" />

                        <div className="flex-1 flex items-center justify-center">
                            <div className={`flex items-center gap-2 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                                {current.badge && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
                                        {current.badge}
                                    </span>
                                )}
                                <p className="text-xs font-medium text-white">
                                    {current.message}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {announcements.length > 1 && (
                                <div className="hidden sm:flex items-center gap-1 mr-1">
                                    {announcements.map((_, idx) => (
                                        <div 
                                            key={idx}
                                            className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-3' : 'bg-white/30 w-1'}`}
                                        />
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={handleDismiss}
                                className="p-1 rounded hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                                aria-label="Dismiss announcement"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementBanner;
