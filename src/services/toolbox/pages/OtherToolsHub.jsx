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
    },
    'measurements': {
        id: 'measurements',
        name: 'Measurements & Time',
        description: 'Convert units, weights, time zones, and more',
        icon: '📏',
    }
};

export default function OtherToolsHub() {
    const [activeCategory, setActiveCategory] = useState('security');

    const categories = Object.values(CATEGORIES);
    const tools = getToolsByCategory(activeCategory);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Header */}
            <div className="mb-12 border-b border-gray-200 dark:border-gray-800 pb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Other Tools
                </h2>
                <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                    Handy utilities for everyday tasks. Fast, reliable, and running securely in your browser.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                    <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1.5 min-w-max lg:min-w-0">
                        {categories.map((cat) => {
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                                        ${isActive 
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <span className="text-lg mr-3 opacity-80">{cat.icon}</span>
                                    {cat.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 w-full min-w-0">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {CATEGORIES[activeCategory].name}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full font-medium">
                            {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {tools.map((tool) => (
                            <Link
                                key={tool.id}
                                to={`/${tool.id}`}
                                className="group relative bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/40 dark:hover:shadow-black/40 hover:border-gray-300 dark:hover:border-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                            >
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 group-hover:scale-110 transition-transform duration-300">
                                        <span className="text-2xl">{tool.icon}</span>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {tool.name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                    {tool.description}
                                </p>
                            </Link>
                        ))}
                    </div>

                    {/* Empty State */}
                    {tools.length === 0 && (
                        <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111]/50">
                            <div className="text-4xl mb-4 opacity-40 grayscale">🛠️</div>
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No tools found</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                We haven't added any {CATEGORIES[activeCategory].name.toLowerCase()} tools yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
