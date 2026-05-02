import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getToolsByCategory } from '../tools';

// Category metadata for non-unified-converter tools
const CATEGORIES = {
    'security': {
        id: 'security',
        name: 'Security & Codes',
        description: 'Generate passwords, hashes, and QR codes',
        icon: '🔐',
        gradient: 'from-violet-500 to-purple-600',
        bgGlow: 'bg-violet-500/20 dark:bg-violet-600/30',
        iconBg: 'bg-violet-100 dark:bg-violet-900/40',
        shadow: 'shadow-violet-500/30 dark:shadow-violet-900/40',
        textColor: 'text-violet-600 dark:text-violet-400'
    },
    'measurements': {
        id: 'measurements',
        name: 'Measurements & Time',
        description: 'Convert units, weights, time zones, and more',
        icon: '📏',
        gradient: 'from-blue-500 to-cyan-600',
        bgGlow: 'bg-blue-500/20 dark:bg-blue-600/30',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        shadow: 'shadow-blue-500/30 dark:shadow-blue-900/40',
        textColor: 'text-blue-600 dark:text-blue-400'
    }
};

export default function OtherToolsHub() {
    const [activeCategory, setActiveCategory] = useState('security');

    const categories = Object.values(CATEGORIES);
    const tools = getToolsByCategory(activeCategory);
    const activeCatData = CATEGORIES[activeCategory];

    return (
        <div className="relative mt-24 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-[2.5rem] border border-gray-200/50 dark:border-gray-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
            {/* Ambient Background Blobs */}
            <div className={`absolute top-0 -left-12 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-60 transition-colors duration-1000 ${activeCatData.bgGlow}`}></div>
            <div className={`absolute bottom-0 -right-12 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-60 transition-colors duration-1000 ${activeCatData.bgGlow}`}></div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-semibold rounded-full bg-white/60 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                        <span className="mr-2 text-base">✨</span> Essential Utilities
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                        Explore <span className={`text-transparent bg-clip-text bg-gradient-to-r ${activeCatData.gradient}`}>Other Tools</span>
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed">
                        Handy utilities for everyday tasks. Fast, reliable, and running securely in your browser.
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-16">
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`relative group px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 ease-out overflow-hidden
                                    ${isActive
                                        ? `text-white shadow-lg ${cat.shadow} scale-105`
                                        : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-700/90 hover:text-gray-900 dark:hover:text-white backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md hover:-translate-y-0.5'
                                    }
                                `}
                            >
                                {isActive && (
                                    <span className={`absolute inset-0 w-full h-full bg-gradient-to-r ${cat.gradient} opacity-100 transition-opacity duration-300`}></span>
                                )}
                                <span className="relative flex items-center gap-2 z-10">
                                    <span className="text-lg">{cat.icon}</span>
                                    {cat.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {tools.map((tool) => (
                        <Link
                            key={tool.id}
                            to={`/${tool.id}`}
                            className="group relative flex flex-col justify-between h-full rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/60 dark:border-gray-700/60 p-8 shadow-xl shadow-gray-200/40 dark:shadow-black/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-transparent dark:hover:border-transparent overflow-hidden"
                        >
                            {/* Hover Gradient Border effect via absolute element */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${activeCatData.gradient} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500 rounded-3xl`}></div>
                            
                            <div className="relative z-10">
                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-inner ${activeCatData.iconBg} border border-white/40 dark:border-gray-600/40 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                                    <span className="text-3xl">{tool.icon}</span>
                                </div>
                                
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 dark:group-hover:from-white dark:group-hover:to-gray-300 transition-all">
                                    {tool.name}
                                </h3>
                                
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                                    {tool.description}
                                </p>
                            </div>
                            
                            <div className="relative z-10 mt-auto flex items-center font-bold text-sm tracking-wide">
                                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${activeCatData.gradient}`}>
                                    Open tool
                                </span>
                                <svg 
                                    className={`w-5 h-5 ml-2 ${activeCatData.textColor} transform transition-transform duration-300 group-hover:translate-x-2`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24" 
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Empty State */}
                {tools.length === 0 && (
                    <div className="text-center py-24 px-4 rounded-3xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-700 max-w-2xl mx-auto mt-8 shadow-inner">
                        <div className="text-6xl mb-6 opacity-50 grayscale filter group-hover:grayscale-0 transition-all">🛠️</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No tools found</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Check back later for new {CATEGORIES[activeCategory].name.toLowerCase()} tools.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
