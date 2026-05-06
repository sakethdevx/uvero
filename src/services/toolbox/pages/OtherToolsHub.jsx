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

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    {/* Sidebar Navigation */}
                    <div className="w-full shrink-0 overflow-x-auto pb-2 scrollbar-hide lg:w-60 lg:overflow-x-visible">
                        <nav className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
                            {categories.map((cat) => {
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex items-center rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.1em] transition-all duration-300 outline-none
                                        ${isActive
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-lg shadow-gray-200/50 dark:shadow-none'
                                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <span className="text-xl mr-3 opacity-90">{cat.icon}</span>
                                        {cat.name}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 w-full min-w-0">
                        <div className="mb-5 flex items-center justify-between px-1">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {CATEGORIES[activeCategory].name}
                                </h3>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                                    {CATEGORIES[activeCategory].description}
                                </p>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/5">
                                {tools.length} active
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3">
                            {tools.map((tool) => (
                                <Link
                                    key={tool.id}
                                    to={`/${tool.id}`}
                                    className="group relative glass-subtle p-3 sm:p-5 rounded-xl sm:rounded-[2rem] border-gray-200 dark:border-white/5 transition-all duration-300 ease-apple hover:-translate-y-1.5 hover:border-primary-500/30 hover:bg-white dark:hover:bg-white/[0.08] hover:shadow-lg hover:shadow-primary-500/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 overflow-hidden"
                                >
                                    {/* Decorative background gradient */}
                                    <div className="absolute -right-6 -top-6 h-20 w-20 sm:-right-10 sm:-top-10 sm:h-32 sm:w-32 rounded-full bg-primary-500/5 blur-3xl transition-all duration-500 group-hover:bg-primary-500/10 group-hover:scale-125"></div>

                                    <div className="relative z-10">
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:rotate-2 group-hover:border-primary-500/20 group-hover:shadow-md group-hover:shadow-primary-500/6">
                                                <span className="text-xl sm:text-2xl">{tool.icon}</span>
                                            </div>
                                            <div className="p-1.5 rounded-full bg-gray-50 dark:bg-white/5 opacity-0 group-hover:opacity-100 transform translate-x-3 group-hover:translate-x-0 transition-all duration-300 delay-75">
                                                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </div>
                                        </div>
                                        <h4 className="mb-1 text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {tool.name}
                                        </h4>
                                        <p className="line-clamp-2 text-[11px] leading-snug text-gray-500 dark:text-gray-400 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                                            {tool.description}
                                        </p>
                                    </div>
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
