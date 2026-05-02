import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEARCH_INDEX } from './searchIndex';

export default function UniversalSearch({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const navigate = useNavigate();

    // Filter results based on query
    const filteredResults = React.useMemo(() => {
        if (!query.trim()) return SEARCH_INDEX;
        
        const lowercaseQuery = query.toLowerCase();
        
        return SEARCH_INDEX.filter((item) => {
            const matchesTitle = item.title.toLowerCase().includes(lowercaseQuery);
            const matchesDesc = item.description.toLowerCase().includes(lowercaseQuery);
            const matchesKeywords = item.keywords.some(k => k.includes(lowercaseQuery));
            return matchesTitle || matchesDesc || matchesKeywords;
        }).sort((a, b) => {
            // Very basic scoring: title match > keyword match > description match
            const aTitle = a.title.toLowerCase().includes(lowercaseQuery) ? 3 : 0;
            const aKw = a.keywords.some(k => k.includes(lowercaseQuery)) ? 2 : 0;
            const aDesc = a.description.toLowerCase().includes(lowercaseQuery) ? 1 : 0;
            const scoreA = Math.max(aTitle, aKw, aDesc);

            const bTitle = b.title.toLowerCase().includes(lowercaseQuery) ? 3 : 0;
            const bKw = b.keywords.some(k => k.includes(lowercaseQuery)) ? 2 : 0;
            const bDesc = b.description.toLowerCase().includes(lowercaseQuery) ? 1 : 0;
            const scoreB = Math.max(bTitle, bKw, bDesc);

            return scoreB - scoreA;
        });
    }, [query]);

    // Group results by category
    const groupedResults = React.useMemo(() => {
        const groups = {};
        filteredResults.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [filteredResults]);

    // Flatten for keyboard navigation
    const flatResults = React.useMemo(() => {
        const flat = [];
        Object.values(groupedResults).forEach(group => flat.push(...group));
        return flat;
    }, [groupedResults]);

    // Reset selection on query change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (flatResults[selectedIndex]) {
                    handleSelect(flatResults[selectedIndex].path);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, flatResults, selectedIndex, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (isOpen && listRef.current) {
            const selectedElement = listRef.current.querySelector('[data-selected="true"]');
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex, isOpen]);

    const handleSelect = (path) => {
        navigate(path);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 pb-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[80vh] sm:max-h-[70vh]">
                
                {/* Search Input */}
                <div className="relative border-b border-gray-200 dark:border-gray-800 shrink-0">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-transparent border-0 pl-12 pr-4 py-4 sm:py-5 text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 outline-none"
                        placeholder="Search apps, tools, and pages..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="hidden sm:inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">ESC</kbd>
                    </div>
                </div>

                {/* Results List */}
                <div 
                    ref={listRef}
                    className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800"
                >
                    {flatResults.length === 0 ? (
                        <div className="py-14 text-center px-4">
                            <div className="text-4xl mb-3 opacity-50">🔍</div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No results found</h3>
                            <p className="text-gray-500 dark:text-gray-400">We couldn't find anything matching "{query}"</p>
                        </div>
                    ) : (
                        Object.entries(groupedResults).map(([category, items], groupIndex) => (
                            <div key={category} className="mb-4 last:mb-0">
                                <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {category}
                                </h3>
                                <ul>
                                    {items.map((item) => {
                                        const globalIndex = flatResults.findIndex(r => r.id === item.id);
                                        const isSelected = selectedIndex === globalIndex;
                                        
                                        return (
                                            <li key={item.id}>
                                                <button
                                                    onClick={() => handleSelect(item.path)}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                    data-selected={isSelected}
                                                    className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-colors outline-none text-left
                                                        ${isSelected 
                                                            ? 'bg-primary-50 dark:bg-primary-500/10' 
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                        }`}
                                                >
                                                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg text-xl shrink-0 transition-colors
                                                        ${isSelected 
                                                            ? 'bg-white dark:bg-gray-800 shadow-sm border border-primary-100 dark:border-primary-500/20' 
                                                            : 'bg-gray-100 dark:bg-gray-800/50 border border-transparent'
                                                        }`}
                                                    >
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`text-sm font-medium truncate transition-colors
                                                            ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}
                                                        >
                                                            {item.title}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <svg className="w-5 h-5 text-primary-500 shrink-0 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="hidden sm:flex shrink-0 items-center justify-between border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 font-sans font-semibold bg-white dark:bg-gray-800">↵</kbd> to select
                        </span>
                        <span className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 font-sans font-semibold bg-white dark:bg-gray-800">↓</kbd>
                            <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 font-sans font-semibold bg-white dark:bg-gray-800">↑</kbd> to navigate
                        </span>
                    </div>
                    <span>Uvero Universal Search</span>
                </div>
            </div>
        </div>
    );
}
