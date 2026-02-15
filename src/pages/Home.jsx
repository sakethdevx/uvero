import { Link } from 'react-router-dom';
import { getPopularTools } from '../tools';
import { useMode } from '../context/ModeContext';
import QuickConverter from '../components/QuickConverter';

/**
 * Home Page
 * Landing page with tool categories and featured tools
 */
export default function Home() {
    const popularTools = getPopularTools();
    const { isOnlineMode } = useMode();

    const categories = [
        {
            name: 'Image Tools',
            icon: '🖼️',
            description: 'Compress, convert, resize, crop, and optimize images',
            gradient: 'from-sky-500 to-blue-600',
            bg: 'bg-sky-50',
            link: '/compress-image',
            count: 11
        },
        {
            name: 'PDF Tools',
            icon: '📄',
            description: 'Merge, split, compress, and convert PDF files',
            gradient: 'from-rose-500 to-pink-600',
            bg: 'bg-rose-50',
            link: '/compress-pdf',
            count: 12
        },
        {
            name: 'Audio Tools',
            icon: '🎵',
            description: 'Convert and compress audio files',
            gradient: 'from-violet-500 to-purple-600',
            bg: 'bg-violet-50',
            link: '/compress-audio',
            count: 5
        },
        {
            name: 'Video Tools',
            icon: '🎬',
            description: 'Compress and convert video files',
            gradient: 'from-emerald-500 to-green-600',
            bg: 'bg-emerald-50',
            link: '/compress-video',
            count: 5
        },
        {
            name: 'Document & Ebook',
            icon: '📚',
            description: 'Convert documents and ebooks between formats',
            gradient: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-50',
            link: '/epub-to-pdf',
            count: 3
        },
        {
            name: 'Utility Tools',
            icon: '🛠️',
            description: 'QR codes, passwords, converters, and more',
            gradient: 'from-cyan-500 to-teal-600',
            bg: 'bg-cyan-50',
            link: '/qr-generator',
            count: 8
        }
    ];

    const features = [
        {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
            ),
            title: 'Complete Privacy',
            description: 'All file processing happens in your browser. Your files never leave your device.',
            color: 'from-emerald-500 to-green-600',
            bg: 'bg-emerald-50',
            textColor: 'text-emerald-600',
        },
        {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
            ),
            title: 'Blazing Fast',
            description: 'Optimized algorithms and Web Workers ensure smooth, instant processing.',
            color: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-50',
            textColor: 'text-amber-600',
        },
        {
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                </svg>
            ),
            title: 'Works Offline',
            description: 'Once loaded, tools work without internet. Perfect for on-the-go processing.',
            color: 'from-blue-500 to-indigo-600',
            bg: 'bg-blue-50',
            textColor: 'text-blue-600',
        }
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/80 via-white to-white">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl animate-blob" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-8 sm:px-6 lg:px-8 sm:pt-20 sm:pb-12">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-100/60 border border-primary-200/60 rounded-full mb-6 animate-fade-in">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </span>
                            <span className="text-sm font-medium text-primary-700">100% Browser-Based • No Uploads Required</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight animate-fade-in-up text-balance">
                            File Processing,{' '}
                            <span className="gradient-text">
                                Made Simple
                            </span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 mb-8 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
                            40+ powerful tools to convert, compress, and process your files.
                            Everything runs in your browser — completely private and free.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <a href="#quick-convert" className="btn-primary inline-flex items-center gap-2 text-base">
                                Start Converting
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </a>
                            <a href="#tools" className="btn-secondary inline-flex items-center gap-2 text-base">
                                Browse All Tools
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </a>
                        </div>

                        {/* Trust badges */}
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            {[
                                { icon: '🔒', text: 'Privacy First' },
                                { icon: '⚡', text: 'Lightning Fast' },
                                { icon: '📱', text: 'Works Offline' },
                                { icon: '🆓', text: 'Completely Free' }
                            ].map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 text-gray-500"
                                >
                                    <span className="text-base">{feature.icon}</span>
                                    <span className="font-medium text-sm">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Converter Section */}
            <section id="quick-convert" className="py-4 sm:py-6 scroll-mt-20">
                <QuickConverter />
            </section>

            {/* Categories Section */}
            <section id="tools" className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 scroll-mt-20">
                <div className="text-center mb-12">
                    <h2 className="section-heading">Browse by Category</h2>
                    <p className="section-subheading">Choose a category to explore all available tools</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categories.map((category, idx) => (
                        <Link
                            key={idx}
                            to={category.link}
                            className="group relative p-6 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                        >
                            {/* Hover gradient background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />

                            <div className="relative flex items-start gap-4">
                                <div className={`flex-shrink-0 w-14 h-14 ${category.bg} rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300`}>
                                    {category.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                            {category.name}
                                        </h3>
                                        <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                            {category.count}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {category.description}
                                    </p>
                                </div>
                                <svg className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Popular Tools Section */}
            {popularTools.length > 0 && (
                <section className="bg-gray-50/50 py-16 sm:py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="section-heading">
                                <span className="mr-2">🔥</span>Popular Tools
                            </h2>
                            <p className="section-subheading">The most used tools by our community</p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {popularTools.slice(0, 9).map((tool) => {
                                const isAvailable = tool.modes.includes(isOnlineMode ? 'online' : 'offline');
                                const isOfflineOnly = tool.modes.length === 1 && tool.modes[0] === 'offline';
                                const isOnlineOnly = tool.modes.length === 1 && tool.modes[0] === 'online';
                                const isUpcoming = tool.upcoming === true;

                                return (
                                    <Link
                                        key={tool.id}
                                        to={`/${tool.id}`}
                                        className={`group card card-hover ${!isAvailable && !isUpcoming ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="text-3xl flex-shrink-0 w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                {tool.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                                                        {tool.name}
                                                    </h3>
                                                    {isUpcoming && (
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full whitespace-nowrap">
                                                            Soon
                                                        </span>
                                                    )}
                                                    {!isUpcoming && isOfflineOnly && (
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                                                            Offline
                                                        </span>
                                                    )}
                                                    {!isUpcoming && isOnlineOnly && (
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                                                            Online
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-2">
                                                    {tool.description}
                                                </p>
                                                {!isUpcoming && !isAvailable && (
                                                    <p className="text-xs text-orange-600 mt-2 font-medium">
                                                        Switch to {isOnlineMode ? 'offline' : 'online'} mode to use
                                                    </p>
                                                )}
                                            </div>
                                            <svg
                                                className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1"
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

                        {popularTools.length > 9 && (
                            <div className="text-center mt-8">
                                <a href="#tools" className="btn-secondary inline-flex items-center gap-2 text-sm">
                                    View All {popularTools.length}+ Tools
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Why Choose Us Section */}
            <section className="py-16 sm:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <h2 className="section-heading">Why Choose FileNext?</h2>
                        <p className="section-subheading">Built with privacy, performance, and simplicity in mind</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="relative group text-center p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${feature.bg} ${feature.textColor} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-500 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-blue-600 to-indigo-700" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

                <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-24 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 text-balance">
                        Ready to Get Started?
                    </h2>
                    <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
                        Pick a tool and start processing your files instantly. No sign-up required.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="#tools"
                            className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold py-3.5 px-7 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-xl shadow-black/10 hover:-translate-y-0.5"
                        >
                            Browse All Tools
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </a>
                        <a
                            href="#quick-convert"
                            className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold py-3.5 px-7 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 hover:-translate-y-0.5"
                        >
                            Try Quick Converter
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
