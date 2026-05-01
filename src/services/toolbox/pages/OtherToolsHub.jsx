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
    },
    'measurements': {
        id: 'measurements',
        name: 'Measurements & Time',
        description: 'Convert units, weights, time zones, and more',
        icon: '📏',
        gradient: 'from-blue-500 to-cyan-600',
    }
};

export default function OtherToolsHub() {
    const [activeCategory, setActiveCategory] = useState('security');

    const categories = Object.values(CATEGORIES);
    const tools = getToolsByCategory(activeCategory);

    return (
        <div className="mt-16">
            {/* Section Header */}
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Other Tools
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Handy utilities for everyday tasks. All tools run locally in your browser.
                </p>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                            activeCategory === cat.id
                                ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        <span className="mr-2">{cat.icon}</span>
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <Link
                        key={tool.id}
                        to={`/${tool.id}`}
                        className={`rounded-2xl border border-gray-200/80 bg-white dark:bg-gray-900 p-6 shadow-lg hover:shadow-xl transition-all group hover:scale-[1.02]`}
                    >
                        <div className="text-4xl mb-4">{tool.icon}</div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:underline">
                            {tool.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            {tool.description}
                        </p>
                        <span className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400">
                            Open tool →
                        </span>
                    </Link>
                ))}
            </div>

            {/* Empty State */}
            {tools.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                        No tools available in this category.
                    </p>
                </div>
            )}
        </div>
    );
}
