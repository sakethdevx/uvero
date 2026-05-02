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
        <div className="mt-4">
            <div className="glass-panel p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Tool nodes</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">Utility shortcuts</h2>
                </div>
                <span className="suggestion-chip !opacity-100 !animate-none">{tools.length} active</span>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                {/* Sidebar Navigation */}
                <div className="w-full shrink-0 overflow-x-auto pb-1 scrollbar-hide lg:w-56 lg:overflow-x-visible">
                    <nav className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
                        {categories.map((cat) => {
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex items-center rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-500
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
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {CATEGORIES[activeCategory].name}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full font-medium">
                            {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {tools.map((tool) => (
                            <Link
                                key={tool.id}
                                to={`/${tool.id}`}
                                className="group relative rounded-xl border border-gray-200 bg-white/80 p-4 transition-all duration-300 ease-apple hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg hover:shadow-gray-200/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-white/15 dark:hover:shadow-none"
                            >
                                <div className="mb-3 flex items-start justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 transition-transform duration-300 group-hover:scale-105 dark:border-white/[0.08] dark:bg-gray-900">
                                        <span className="text-2xl">{tool.icon}</span>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                                <h4 className="mb-1 text-sm font-bold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400">
                                    {tool.name}
                                </h4>
                                <p className="line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                    {tool.description}
                                </p>
                            </Link>
                        ))}
                    </div>

                    {/* Empty State */}
                    {tools.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 px-4 py-10 text-center dark:border-gray-800 dark:bg-[#111]/50">
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
        </div>
    );
}
