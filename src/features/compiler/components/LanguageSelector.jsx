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
        <div className="relative" ref={dropdownRef}>
            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm group"
            >
                <span className="text-lg">{current?.icon || '💻'}</span>
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{current?.name || 'Select Language'}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/20 z-50 overflow-hidden animate-fade-in-down">
                    {/* Search */}
                    <div className="p-3 border-b border-gray-100 dark:border-white/5">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search languages..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-gray-800 dark:text-gray-200 placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Language List */}
                    <div className="max-h-80 overflow-y-auto py-2">
                        {filtered ? (
                            // Search results
                            filtered.length > 0 ? (
                                filtered.map(lang => (
                                    <LangItem key={lang.id} lang={lang} isSelected={lang.id === selectedLanguage} onSelect={selectLanguage} />
                                ))
                            ) : (
                                <div className="px-4 py-6 text-center text-sm text-gray-400">No languages found</div>
                            )
                        ) : (
                            // Grouped by category
                            CATEGORIES.map(cat => (
                                <div key={cat.id}>
                                    <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{cat.name}</div>
                                    {cat.languages.map(lang => (
                                        <LangItem key={lang.id} lang={lang} isSelected={lang.id === selectedLanguage} onSelect={selectLanguage} />
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function LangItem({ lang, isSelected, onSelect }) {
    return (
        <button
            onClick={() => onSelect(lang.id)}
            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-all ${
                isSelected
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
        >
            <span className="text-base w-6 text-center">{lang.icon}</span>
            <span className="text-sm font-medium flex-1">{lang.name}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{lang.extension}</span>
            {isSelected && (
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
            )}
        </button>
    );
}
