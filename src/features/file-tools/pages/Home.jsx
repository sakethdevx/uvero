import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPopularTools, getToolsByCategory } from '../tools';
import { useMode } from '../context/ModeContext';
import QuickConverter from '../components/QuickConverter';
import { getToolAvailabilityBadge, isToolAvailableInMode } from '../core/toolMetadata';

/**
 * Home Page
 * Landing page with tool categories and featured tools
 */
export default function Home() {
    const popularTools = getPopularTools();
    const { isOnlineMode } = useMode();
    const [expandedCategory, setExpandedCategory] = useState(null);
    const currentMode = isOnlineMode ? 'online' : 'offline';

    const categories = [
        {
            name: 'Image Tools',
            icon: '🖼️',
            description: 'Compress, convert, resize, and optimize images',
            gradient: 'from-sky-500 to-blue-600',
            bg: 'bg-sky-50 dark:bg-sky-950/30',
            categoryId: 'image',
            borderColor: 'border-sky-100 dark:border-sky-500/20'
        },
        {
            name: 'PDF Tools',
            icon: '📄',
            description: 'Merge, split, compress, and edit PDF files',
            gradient: 'from-rose-500 to-pink-600',
            bg: 'bg-rose-50 dark:bg-rose-950/30',
            categoryId: 'pdf',
            borderColor: 'border-rose-100 dark:border-rose-500/20'
        },
        {
            name: 'Audio Tools',
            icon: '🎵',
            description: 'Convert and compress audio files instantly',
            gradient: 'from-violet-500 to-purple-600',
            bg: 'bg-violet-50 dark:bg-violet-950/30',
            categoryId: 'audio',
            borderColor: 'border-violet-100 dark:border-violet-500/20'
        },
        {
            name: 'Video Tools',
            icon: '🎬',
            description: 'Compress and transform high-quality video',
            gradient: 'from-emerald-500 to-green-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            categoryId: 'video',
            borderColor: 'border-emerald-100 dark:border-emerald-500/20'
        },
        {
            name: 'Utility Tools',
            icon: '🛠️',
            description: 'QR codes, passwords, and unit converters',
            gradient: 'from-cyan-500 to-teal-600',
            bg: 'bg-cyan-50 dark:bg-cyan-950/30',
            categoryId: 'utility',
            borderColor: 'border-cyan-100 dark:border-cyan-500/20'
        },
        {
            name: 'Document & Ebook',
            icon: '📚',
            description: 'Convert ebooks and browse linked document workflows',
            gradient: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            categoryId: 'document',
            borderColor: 'border-amber-100 dark:border-amber-500/20'
        },
        {
            name: 'Archive Tools',
            icon: '🗜️',
            description: 'Archive conversion flows with server-backed extraction where needed',
            gradient: 'from-slate-500 to-gray-700',
            bg: 'bg-slate-50 dark:bg-slate-950/30',
            categoryId: 'archive',
            borderColor: 'border-slate-100 dark:border-slate-500/20'
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[-10rem] top-16 h-96 w-96 rounded-full bg-primary-500/8 blur-3xl" />
                    <div className="absolute right-[-8rem] top-8 h-80 w-80 rounded-full bg-blue-500/8 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
                </div>

                <section className="relative max-w-7xl mx-auto px-4 pt-16 pb-10 sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.85fr]">
                        <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-primary-50 via-white to-blue-50 p-8 shadow-xl shadow-primary-100/40 dark:border-white/[0.08] dark:from-primary-500/10 dark:via-gray-950 dark:to-blue-500/10 dark:shadow-none sm:p-10">
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-300">File Tools</p>
                            <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                                Powerful tools,{' '}
                                <span className="text-primary-600 dark:text-primary-400">clear processing paths.</span>
                            </h1>
                            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
                                Transform images, PDFs, audio, and video with a privacy-first tool suite. Most workflows run on-device, while specialized online paths stay clearly marked whenever a server runtime is involved.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <a href="#quick-convert" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700">
                                    Start with File Tools
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </a>
                                <a href="#categories" className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/80 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]">
                                    Browse All Tools
                                </a>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-gray-200/80 bg-gray-50/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Why choose us</p>
                            <div className="mt-5 space-y-4">
                                {[
                                    { icon: '🛡️', title: 'Privacy First', desc: 'Offline mode keeps supported tools fully on-device.' },
                                    { icon: '💨', title: 'Fast by Default', desc: 'Most conversions skip upload wait times and run locally in your browser.' },
                                    { icon: '☁️', title: 'Clearly Labeled Online Flows', desc: 'A few advanced tools use server-backed runtimes with visible limits and setup notes.' },
                                ].map((f, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/10 text-base">
                                            {f.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-2 pt-3 border-t border-gray-200/80 dark:border-white/[0.08]">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100/80 dark:border-primary-500/20 text-primary-700 dark:text-primary-400 text-xs font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                        Mode-aware processing with clear online/offline boundaries
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Quick Converter Section */}
            <section id="quick-convert" className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-gray-200/80 bg-white p-4 shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none sm:p-6">
                    <QuickConverter />
                </div>
            </section>

            {/* Categories Section */}
            <section id="categories" className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Tools</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Browse by category</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Over 55+ specialized tools crafted for speed and precision.</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categories.map((category, idx) => {
                        const isExpanded = expandedCategory === category.categoryId;
                        const modeAwareTools = getToolsByCategory(category.categoryId)
                            .filter((tool) => isToolAvailableInMode(tool, currentMode));
                        const categoryTools = isExpanded ? modeAwareTools : [];
                        const visibleCount = modeAwareTools.length;

                        return (
                            <div key={idx} className="flex flex-col h-full">
                                <button
                                    onClick={() => setExpandedCategory(isExpanded ? null : category.categoryId)}
                                    className={`relative h-full p-6 rounded-3xl border border-gray-200/80 ${category.bg} shadow-sm transition-shadow hover:shadow-md dark:border-white/[0.08] text-left`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 ${category.bg} rounded-2xl flex items-center justify-center text-2xl shadow-sm border ${category.borderColor}`}>
                                            {category.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-bold text-gray-900 dark:text-white">{category.name}</h3>
                                                <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-full">{visibleCount}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{category.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mt-4">
                                        <span>Explore</span>
                                        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Expanded tools list */}
                                {isExpanded && categoryTools.length > 0 && (
                                    <div className="mt-3 p-5 rounded-3xl border border-gray-200/80 bg-white shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none max-h-80 overflow-y-auto">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {categoryTools.map((tool) => {
                                                const availabilityBadge = getToolAvailabilityBadge(tool);

                                                return (
                                                    <Link
                                                        key={tool.id}
                                                        to={`/${tool.id}`}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-sm text-gray-700 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                                                    >
                                                        <span className="text-lg flex-shrink-0">{tool.icon}</span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="truncate">{tool.name}</span>
                                                                {availabilityBadge && (
                                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${availabilityBadge.className}`}>
                                                                        {availabilityBadge.label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {tool.availabilityNote && (
                                                                <p className="mt-0.5 truncate text-[11px] font-normal text-gray-500 dark:text-gray-400">
                                                                    {tool.availabilityNote}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </Link>
                                                );
                                            })}
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
                <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
                    <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none sm:p-8">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Popular</p>
                        <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Most used tools</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Frequently used by the community for daily file tasks.</p>

                        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {popularTools.slice(0, 9).map((tool) => {
                                const isAvailable = isToolAvailableInMode(tool, currentMode);
                                const availabilityBadge = getToolAvailabilityBadge(tool);
                                return (
                                    <Link
                                        key={tool.id}
                                        to={`/${tool.id}`}
                                        className={`group flex items-start gap-4 p-4 rounded-2xl border border-gray-200/80 bg-gray-50/80 transition-shadow hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.03] ${!isAvailable ? 'opacity-50 grayscale' : ''}`}
                                    >
                                        <div className="w-11 h-11 bg-white dark:bg-gray-900/60 border border-gray-200/80 dark:border-white/[0.08] rounded-xl flex items-center justify-center text-2xl shrink-0">
                                            {tool.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{tool.name}</h3>
                                                {availabilityBadge && (
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${availabilityBadge.className}`}>
                                                        {availabilityBadge.label}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mt-0.5">{tool.description}</p>
                                            {tool.availabilityNote && (
                                                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                                                    {tool.availabilityNote}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Platform Features */}
            <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-gray-200/80 bg-gray-50/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mb-5">Why it works</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: '🛡️', title: 'Privacy Guaranteed', desc: 'Offline-supported tools stay on-device, and online flows are explicitly labeled when they need a server runtime.' },
                            { icon: '💨', title: 'Client-Side Speed', desc: 'Most file tools still avoid upload delays and process locally at native browser speed.' },
                            { icon: '📶', title: 'Offline Where Supported', desc: 'Core browser-based tools keep working offline, while specialized server-backed tools stay clearly marked.' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200/80 dark:border-white/[0.08] flex items-center justify-center text-xl shrink-0 shadow-sm">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA removed */}
        </div>
    );
}
