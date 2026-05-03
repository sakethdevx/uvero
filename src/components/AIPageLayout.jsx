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
        <div className="w-full text-gray-900 transition-colors duration-500 dark:text-white relative flex flex-col">
            {/* Main Content Area */}
            <main className={`relative z-10 w-full mx-auto ${maxWidth} px-4 py-8 sm:px-6 lg:px-8 sm:py-12 flex-1 flex flex-col ${centerContent ? 'justify-center min-h-[calc(100vh-8rem)]' : 'pt-8 sm:pt-12'}`}>
                
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
