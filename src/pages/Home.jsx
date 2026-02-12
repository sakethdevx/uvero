import { Link } from 'react-router-dom';
import { getAllTools, getPopularTools } from '../tools';
import { useMode } from '../context/ModeContext';

/**
 * Home Page
 * Landing page with tool categories and featured tools
 */
export default function Home() {
    const popularTools = getPopularTools();
    const allTools = getAllTools();
    const { isOnlineMode } = useMode();

    const categories = [
        {
            name: 'Image Tools',
            icon: '🖼️',
            description: 'Compress, convert, resize, crop, and optimize images',
            color: 'from-blue-500 to-cyan-500',
            count: 8
        },
        {
            name: 'PDF Tools',
            icon: '📄',
            description: 'Merge, split, compress, and convert PDF files',
            color: 'from-red-500 to-pink-500',
            count: 12
        },
        {
            name: 'Audio Tools',
            icon: '🎵',
            description: 'Convert and compress audio files',
            color: 'from-purple-500 to-indigo-500',
            count: 2
        },
        {
            name: 'Video Tools',
            icon: '🎬',
            description: 'Compress and convert video files',
            color: 'from-green-500 to-emerald-500',
            count: 2
        },
        {
            name: 'Utility Tools',
            icon: '🛠️',
            description: 'QR codes, password generator, and more',
            color: 'from-orange-500 to-red-500',
            count: 2
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-transparent to-blue-50 opacity-70" />

                <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
                            File Processing,
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">
                                Made Simple
                            </span>
                        </h1>

                        <p className="max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 px-4">
                            26 powerful tools to convert, compress, and process your files right in your browser.
                            <span className="block mt-2 font-semibold text-primary-700">
                                No uploads. No data collection. 100% private.
                            </span>
                        </p>

                        {/* Key Features */}
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-12 px-4">
                            {[
                                { icon: '🔒', text: 'Privacy First' },
                                { icon: '⚡', text: 'Lightning Fast' },
                                { icon: '📱', text: 'Works Offline' },
                                { icon: '🆓', text: 'Completely Free' }
                            ].map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white rounded-full shadow-md border border-gray-200"
                                >
                                    <span className="text-xl sm:text-2xl">{feature.icon}</span>
                                    <span className="font-semibold text-sm sm:text-base text-gray-800">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Tools Section */}
            {popularTools.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                        🔥 Popular Tools
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {popularTools.map((tool) => {
                            const isAvailable = tool.modes.includes(isOnlineMode ? 'online' : 'offline');
                            const isOfflineOnly = tool.modes.length === 1 && tool.modes[0] === 'offline';
                            const isOnlineOnly = tool.modes.length === 1 && tool.modes[0] === 'online';
                            const isUpcoming = tool.upcoming === true;

                            return (
                                <Link
                                    key={tool.id}
                                    to={`/${tool.id}`}
                                    className={`group card hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ${!isAvailable && !isUpcoming ? 'opacity-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-4xl">{tool.icon}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                                    {tool.name}
                                                </h3>
                                                {isUpcoming && (
                                                    <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                                                        🚀 Soon
                                                    </span>
                                                )}
                                                {!isUpcoming && isOfflineOnly && (
                                                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                                                        🔒 Offline
                                                    </span>
                                                )}
                                                {!isUpcoming && isOnlineOnly && (
                                                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                                                        ☁️ Online
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-600 text-sm">
                                                {tool.description}
                                            </p>
                                            {!isUpcoming && !isAvailable && (
                                                <p className="text-xs text-orange-600 mt-2 font-medium">
                                                    Switch to {isOnlineMode ? 'offline' : 'online'} mode to use
                                                </p>
                                            )}
                                        </div>
                                        <svg
                                            className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Categories Section */}
            <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    Browse by Category
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {categories.map((category, idx) => (
                        <div
                            key={idx}
                            className="relative p-5 sm:p-6 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-200"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10`} />

                            <div className="relative">
                                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{category.icon}</div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                                    {category.name}
                                </h3>
                                <p className="text-gray-600 text-sm mb-3">
                                    {category.description}
                                </p>
                                <span className="inline-block px-3 py-1 bg-gradient-to-r from-primary-100 to-blue-100 text-primary-700 text-xs font-semibold rounded-full">
                                    {category.count} {category.count === 1 ? 'Tool' : 'Tools'} Available
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trust Section */}
            <div className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Why Choose Us?
                        </h2>
                        <p className="text-lg text-gray-600">
                            Built with privacy, performance, and simplicity in mind
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: (
                                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ),
                                title: 'Complete Privacy',
                                description: 'All file processing happens in your browser. Your files never leave your device, ensuring complete privacy and security.'
                            },
                            {
                                icon: (
                                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                    </svg>
                                ),
                                title: 'Blazing Fast',
                                description: 'Optimized algorithms and Web Workers ensure smooth, fast processing even on low-end devices.'
                            },
                            {
                                icon: (
                                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                                    </svg>
                                ),
                                title: 'Works Offline',
                                description: 'Once loaded, the app works without an internet connection. Perfect for on-the-go file processing.'
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20 sm:px-6 lg:px-8 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Ready to Get Started?
                </h2>
                <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
                    Choose a tool above and start processing your files instantly
                </p>
                <div className="inline-flex gap-4">
                    <Link
                        to="/compress-image"
                        className="btn-primary inline-flex items-center gap-2 text-sm sm:text-base"
                    >
                        Try Image Compressor
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}
