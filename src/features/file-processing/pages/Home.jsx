import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPopularTools, getToolsByCategory } from '../tools';
import { useMode } from '../context/ModeContext';
import QuickConverter from '../components/QuickConverter';

/**
 * Home Page
 * Landing page with tool categories and featured tools
 */
export default function Home() {
    const popularTools = getPopularTools();
    const { isOnlineMode, theme } = useMode();
    const [expandedCategory, setExpandedCategory] = useState(null);

    const categories = [
        {
            name: 'Image Tools',
            icon: '🖼️',
            description: 'Compress, convert, resize, and optimize images',
            gradient: 'from-sky-500 to-blue-600',
            bg: 'bg-sky-50 dark:bg-sky-950/30',
            categoryId: 'image',
            count: 11,
            borderColor: 'border-sky-100 dark:border-sky-500/20'
        },
        {
            name: 'PDF Tools',
            icon: '📄',
            description: 'Merge, split, compress, and edit PDF files',
            gradient: 'from-rose-500 to-pink-600',
            bg: 'bg-rose-50 dark:bg-rose-950/30',
            categoryId: 'pdf',
            count: 27,
            borderColor: 'border-rose-100 dark:border-rose-500/20'
        },
        {
            name: 'Audio Tools',
            icon: '🎵',
            description: 'Convert and compress audio files instantly',
            gradient: 'from-violet-500 to-purple-600',
            bg: 'bg-violet-50 dark:bg-violet-950/30',
            categoryId: 'audio',
            count: 5,
            borderColor: 'border-violet-100 dark:border-violet-500/20'
        },
        {
            name: 'Video Tools',
            icon: '🎬',
            description: 'Compress and transform high-quality video',
            gradient: 'from-emerald-500 to-green-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            categoryId: 'video',
            count: 5,
            borderColor: 'border-emerald-100 dark:border-emerald-500/20'
        },
        {
            name: 'Utility Tools',
            icon: '🛠️',
            description: 'QR codes, passwords, and unit converters',
            gradient: 'from-cyan-500 to-teal-600',
            bg: 'bg-cyan-50 dark:bg-cyan-950/30',
            categoryId: 'utility',
            count: 8,
            borderColor: 'border-cyan-100 dark:border-cyan-500/20'
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-500">
            {/* Hero Section */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute top-[20%] -left-[5%] w-[35%] h-[35%] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-700 dark:text-primary-400 text-sm font-medium mb-8 animate-fade-in shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                        </span>
                        100% Client-Side Processing
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 animate-fade-in-up">
                        Powerful Tools, <br />
                        <span className="gradient-text animate-gradient-x">Zero Seconds Upload.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-12 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
                        Transform images, PDFs, audio, and video directly in your browser.
                        Privacy-first processing that works offline.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <a href="#quick-convert" className="btn-primary px-8 py-4 text-lg shadow-2xl shadow-primary-500/20 hover:shadow-primary-500/40">
                            Start Processing
                        </a>
                        <a href="#categories" className="btn-secondary px-8 py-4 text-lg dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10">
                            Browse All Tools
                        </a>
                    </div>
                </div>
            </section>

            {/* Quick Converter Section */}
            <section id="quick-convert" className="relative z-10 -mt-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="bg-white dark:bg-gray-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden p-3 sm:p-6 lg:p-8">
                    <QuickConverter />
                </div>
            </section>

            {/* Categories Section */}
            <section id="categories" className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Browse by Category
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Over 55+ specialized tools crafted for speed and precision.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold cursor-default">
                        <span>{popularTools.length}+ Tools available</span>
                        <div className="w-8 h-[2px] bg-primary-600 dark:bg-primary-400" />
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category, idx) => {
                        const isExpanded = expandedCategory === category.categoryId;
                        const categoryTools = isExpanded ? getToolsByCategory(category.categoryId) : [];

                        return (
                            <div key={idx} className="flex flex-col h-full group">
                                <button
                                    onClick={() => setExpandedCategory(isExpanded ? null : category.categoryId)}
                                    className={`relative h-full p-8 rounded-3xl bg-white dark:bg-gray-900 border ${category.borderColor} hover:border-transparent dark:hover:border-transparent transition-all duration-500 text-left overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2`}
                                >
                                    {/* Hover gradient background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.07] transition-opacity duration-500`} />

                                    <div className="relative flex flex-col items-start gap-6 h-full">
                                        <div className={`w-14 h-14 ${category.bg} rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
                                            {category.icon}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {category.name}
                                                </h3>
                                                <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-full">
                                                    {category.count}
                                                </span>
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                                                {category.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mt-4">
                                            <span>Explore {category.name}</span>
                                            <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'group-hover:translate-x-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded tools list */}
                                {isExpanded && categoryTools.length > 0 && (
                                    <div className="mt-4 p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-3xl shadow-xl animate-fade-in-down max-h-80 overflow-y-auto">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {categoryTools.map((tool) => (
                                                <Link
                                                    key={tool.id}
                                                    to={`/${tool.id}`}
                                                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-sm text-gray-700 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all font-medium border border-transparent hover:border-gray-100 dark:hover:border-white/5"
                                                >
                                                    <span className="text-lg flex-shrink-0">{tool.icon}</span>
                                                    <span className="truncate">{tool.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Popular Tools Section */}
            {popularTools.length > 0 && (
                <section className="bg-gray-50/50 dark:bg-gray-900/30 py-24 transition-colors">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                Most Popular Tools
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                Frequently used by the community for daily file tasks.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {popularTools.slice(0, 9).map((tool) => {
                                const isAvailable = tool.modes.includes(isOnlineMode ? 'online' : 'offline');
                                return (
                                    <Link
                                        key={tool.id}
                                        to={`/${tool.id}`}
                                        className={`group relative p-6 rounded-[2rem] bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/5 hover:border-primary-500/30 dark:hover:border-primary-500/30 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden ${!isAvailable ? 'opacity-50 grayscale' : ''}`}
                                    >
                                        <div className="flex items-start gap-5">
                                            <div className="w-14 h-14 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                {tool.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    {tool.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                    {tool.description}
                                                </p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-300 dark:text-gray-700 group-hover:bg-primary-500 group-hover:border-primary-500 group-hover:text-white transition-all duration-300">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Platform Features */}
            <section className="py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: '🛡️',
                                title: 'Privacy Guaranteed',
                                desc: 'Files are processed in-memory and never storage. Your data remains yours.'
                            },
                            {
                                icon: '💨',
                                title: 'Client-Side Speed',
                                desc: 'Skip the wait times of uploading large files. Process everything locally at native speed.'
                            },
                            {
                                icon: '📶',
                                title: 'Works Offline',
                                desc: 'Once loaded, use all browser-based tools without any internet connection.'
                            }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-[2rem] bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-4xl mb-6 shadow-sm">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Redesigned CTA */}
            <div className="max-w-7xl mx-auto px-4 pb-20 sm:px-6 lg:px-8">
                <div className="relative rounded-[3rem] overflow-hidden bg-gray-900 p-12 sm:p-20 text-center shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-blue-600/20 to-purple-600/20 pointer-events-none" />
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
                            Start working with your files today.
                        </h2>
                        <p className="text-xl text-gray-300 mb-10">
                            No account required. Open source and free forever.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href="#quick-convert" className="btn-primary w-full sm:w-auto px-10 py-4 text-lg">
                                Get Started
                            </a>
                            <Link to="/privacy" className="btn-secondary w-full sm:w-auto px-10 py-4 text-lg text-white border-white/20 hover:bg-white/10">
                                Privacy Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
