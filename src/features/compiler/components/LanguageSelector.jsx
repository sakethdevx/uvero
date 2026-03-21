import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGES, CATEGORIES } from '../data/languages';

export default function LanguageSelector({ selectedLanguage, onLanguageChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);

    const current = LANGUAGES.find(l => l.id === selectedLanguage);

    // Filter languages by search
    const filtered = search.trim()
        ? LANGUAGES.filter(l =>
            l.name.toLowerCase().includes(search.toLowerCase()) ||
            l.id.toLowerCase().includes(search.toLowerCase())
        )
        : null;

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (isOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen]);

    // Handle keyboard in search
    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearch('');
        }
    }

    function selectLanguage(langId) {
        onLanguageChange(langId);
        setIsOpen(false);
        setSearch('');
    }

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            {/* Compact Trigger for Status Bar */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200 group ${
                    isOpen 
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/5'
                }`}
            >
                <span className="text-base group-hover:scale-110 transition-transform duration-200">{current?.icon || '💻'}</span>
                <span className="font-bold text-[11px] whitespace-nowrap">{current?.name || 'Select Language'}</span>
                <svg className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full right-0 lg:left-0 mt-3 w-80 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/20 z-50 overflow-hidden animate-pop-in origin-top-right lg:origin-top-left">
                    {/* Search */}
                    <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                        <div className="relative group">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search languages..."
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Language List */}
                    <div className="max-h-[400px] overflow-y-auto py-2 custom-scrollbar">
                        {filtered ? (
                            // Search results
                            filtered.length > 0 ? (
                                <div className="px-2">
                                    {filtered.map(lang => (
                                        <LangItem key={lang.id} lang={lang} isSelected={lang.id === selectedLanguage} onSelect={selectLanguage} />
                                    ))}
                                </div>
                            ) : (
                                <div className="px-4 py-10 text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 mb-3 text-gray-300 dark:text-gray-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No languages found</p>
                                </div>
                            )
                        ) : (
                            // Grouped by category
                            CATEGORIES.map(cat => (
                                <div key={cat.id} className="mb-4 last:mb-2">
                                    <div className="px-5 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] leading-none mb-1">{cat.name}</div>
                                    <div className="px-2">
                                        {cat.languages.map(lang => (
                                            <LangItem key={lang.id} lang={lang} isSelected={lang.id === selectedLanguage} onSelect={selectLanguage} />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pop-in {
                    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-pop-in { animation: pop-in 0.2s cubic-bezier(0, 0, 0.2, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.2); border-radius: 10px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.4); }
            `}</style>
        </div>
    );
}

function LangItem({ lang, isSelected, onSelect }) {
    return (
        <button
            onClick={() => onSelect(lang.id)}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 text-left rounded-xl transition-all group/item ${
                isSelected
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-white'
            }`}
        >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-transform group-hover/item:scale-110 ${
                isSelected ? 'bg-blue-500/20 font-bold' : 'bg-gray-100 dark:bg-white/5'
            }`}>
                {lang.icon}
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold tracking-tight">{lang.name}</p>
                <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{lang.extension}</p>
            </div>
            {isSelected && (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
        </button>
    );
}
