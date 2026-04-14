import { useParams, Navigate } from 'react-router-dom';
import { getToolById } from '../tools';
import { useEffect } from 'react';
import ModeWarning from '../components/ModeWarning';
import { useMode } from '../context/ModeContext';

/**
 * Generic Tool Page Component
 * Dynamically loads the correct tool based on the route
 */
export default function ToolPage() {
    const { toolId } = useParams();
    const tool = getToolById(toolId);
    const { isOnlineMode } = useMode();
    const mode = isOnlineMode ? 'online' : 'offline';

    // Scroll to top when tool changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [toolId]);

    // Update document metadata for SEO
    useEffect(() => {
        if (tool && tool.seo) {
            document.title = tool.seo.title;

            // Update meta description
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
                metaDescription = document.createElement('meta');
                metaDescription.name = 'description';
                document.head.appendChild(metaDescription);
            }
            metaDescription.content = tool.seo.description;

            // Update Open Graph tags
            let ogTitle = document.querySelector('meta[property="og:title"]');
            if (!ogTitle) {
                ogTitle = document.createElement('meta');
                ogTitle.setAttribute('property', 'og:title');
                document.head.appendChild(ogTitle);
            }
            ogTitle.content = tool.seo.ogTitle || tool.seo.title;

            let ogDescription = document.querySelector('meta[property="og:description"]');
            if (!ogDescription) {
                ogDescription = document.createElement('meta');
                ogDescription.setAttribute('property', 'og:description');
                document.head.appendChild(ogDescription);
            }
            ogDescription.content = tool.seo.ogDescription || tool.seo.description;
        }

        // Cleanup
        return () => {
            document.title = 'Uvero - Free Online File Tools';
        };
    }, [tool]);

    // Tool not found - redirect to home
    if (!tool) {
        return <Navigate to="/" replace />;
    }

    const ToolComponent = tool.component;
    const isAvailable = tool.modes && tool.modes.includes(isOnlineMode ? 'online' : 'offline');

    return (
        <>
            <ModeWarning toolId={toolId} />
            {isAvailable ? (
                <ToolComponent mode={mode} isOnlineMode={isOnlineMode} />
            ) : (
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-12 px-4 transition-colors">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-10 text-center border border-gray-100 dark:border-white/5">
                            <div className="text-7xl mb-6">{tool.icon}</div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{tool.name}</h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{tool.description}</p>
                            <div className="bg-orange-50 dark:bg-orange-500/10 border-2 border-orange-200 dark:border-orange-500/20 rounded-2xl p-8">
                                <p className="text-orange-800 dark:text-orange-400 font-bold mb-4">
                                    Not available in {isOnlineMode ? 'Online' : 'Offline'} mode
                                </p>
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                    Please switch to <strong>{isOnlineMode ? 'offline' : 'online'}</strong> mode using the toggle in the navigation bar.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
