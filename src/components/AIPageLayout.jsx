import React from 'react';
import { Link } from 'react-router-dom';

/**
 * AIPageLayout
 * 
 * A unified wrapper for static and authentication pages, integrating them into the
 * Neural OS design system with controlled visual intensity.
 * 
 * @param {string} pattern - 'focused' (auth) or 'calm' (static reading)
 * @param {string} maxWidth - Tailwind max-width class (e.g. 'max-w-md', 'max-w-3xl')
 * @param {boolean} centerContent - true for vertically centered cards (auth)
 * @param {React.ReactNode} backLink - Optional back button node or props
 * @param {string} backTo - Route to go back to (e.g. '/') if passing string instead of node
 * @param {string} backLabel - Label for back button
 */
export default function AIPageLayout({
    children,
    pattern = 'calm',
    maxWidth = 'max-w-3xl',
    centerContent = false,
    backLink,
    backTo,
    backLabel = 'Back'
}) {
    // Generate back link component if simple props are provided
    const renderBackLink = () => {
        if (backLink) return backLink;
        if (backTo) {
            return (
                <Link
                    to={backTo}
                    className="suggestion-chip mb-2 sm:mb-4 inline-flex items-center"
                >
                    <span aria-hidden="true" className="mr-1">←</span>
                    <span>{backLabel}</span>
                </Link>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-surface-0 text-gray-900 transition-colors duration-500 dark:text-white relative overflow-hidden flex flex-col">
            {/* Ambient Background System */}
            <div className="pointer-events-none fixed inset-0 z-0 opacity-60">
                {pattern === 'focused' ? (
                    // Focused (Auth) - subtle radial glow behind the center card
                    <>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[60vh] w-[60vw] rounded-full bg-accent/10 dark:bg-accent/15 blur-[120px]" />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent dark:via-accent/20" />
                        <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-accent/5 dark:from-accent/10 to-transparent" />
                    </>
                ) : (
                    // Calm (Static) - very minimal, calm top gradient
                    <>
                        <div className="absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-accent/5 dark:from-accent/5 to-transparent" />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
                    </>
                )}
            </div>

            {/* Main Content Area */}
            <main className={`relative z-10 w-full mx-auto ${maxWidth} px-4 py-8 sm:px-6 lg:px-8 sm:py-12 flex-1 flex flex-col ${centerContent ? 'justify-center min-h-[calc(100vh-4rem)]' : 'pt-16 sm:pt-24'}`}>
                
                {renderBackLink() && !centerContent && (
                    <div className="mb-4">
                        {renderBackLink()}
                    </div>
                )}

                <div className={`glass-panel w-full p-6 sm:p-10 ${
                    pattern === 'focused' ? 'glass-glow' : 'shadow-sm'
                } animate-state-in relative`}>
                    
                    {renderBackLink() && centerContent && (
                        <div className="mb-6 -mt-2">
                            {renderBackLink()}
                        </div>
                    )}
                    
                    <div className="relative z-10 text-balance">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
