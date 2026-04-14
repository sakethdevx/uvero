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
    const currentMode = isOnlineMode ? 'online' : 'offline';
    const categoryDefinitions = [
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

    const [activeCategory, setActiveCategory] = useState(categoryDefinitions[0].categoryId);

    const categories = categoryDefinitions.map((category) => {
        const allTools = getToolsByCategory(category.categoryId);
        const modeAwareTools = allTools.filter((tool) => isToolAvailableInMode(tool, currentMode));

        return {
            ...category,
            allTools,
            modeAwareTools,
            visibleCount: modeAwareTools.length,
            totalCount: allTools.length,
        };
    });

    const selectedCategory = categories.find((category) => category.categoryId === activeCategory) || categories[0];
    const selectedCategoryTools = selectedCategory.modeAwareTools;
    const selectedCategoryPopularTools = selectedCategoryTools.filter((tool) => tool.popular).slice(0, 3);

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
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-300">Uvero Toolbox</p>
                            <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                                Powerful tools,{' '}
                                <span className="text-primary-600 dark:text-primary-400">clear processing paths.</span>
                            </h1>
                            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
                                Transform images, PDFs, audio, and video with a privacy-first tool suite. Most workflows run on-device, while specialized online paths stay clearly marked whenever a server runtime is involved.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <a href="#quick-convert" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700">
                                    Start with Toolbox
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
                <div className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Tools</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Browse by category</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                            <span className="h-2 w-2 rounded-full bg-primary-500" />
                            {isOnlineMode ? 'Online mode' : 'Offline mode'}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-gray-200/80 bg-white px-3 py-1.5 text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300">
                            63+ specialized tools
                        </span>
                        <span className="inline-flex items-center rounded-full border border-gray-200/80 bg-white px-3 py-1.5 text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300">
                            {selectedCategory.visibleCount} available in {selectedCategory.name}
                        </span>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                        Pick a lane on the left and get a focused tool board on the right. The list stays mode-aware, so you only see tools available in your current processing mode.
                    </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="rounded-[2rem] border border-gray-200/80 bg-gray-50/80 p-3 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                        <div className="rounded-[1.5rem] border border-white/80 bg-white/70 p-4 backdrop-blur dark:border-white/[0.08] dark:bg-gray-950/40">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Category Rail</p>
                            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                Switch categories without opening dropdowns. The board updates instantly with the tools available in your current mode.
                            </p>
                        </div>

                        <div className="mt-3 space-y-2">
                            {categories.map((category) => {
                                const isActive = category.categoryId === selectedCategory.categoryId;
                                const previewNames = category.modeAwareTools.slice(0, 3).map((tool) => tool.name).join(' · ');

                                return (
                                    <button
                                        key={category.categoryId}
                                        onClick={() => setActiveCategory(category.categoryId)}
                                        className={`group w-full rounded-[1.75rem] border p-4 text-left transition-all ${
                                            isActive
                                                ? 'border-transparent bg-white shadow-lg shadow-gray-200/70 dark:bg-gray-900/80 dark:shadow-none'
                                                : 'border-transparent bg-transparent hover:border-gray-200/80 hover:bg-white/70 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${category.borderColor} ${category.bg} text-2xl shadow-sm`}>
                                                {category.icon}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">{category.name}</h3>
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                        isActive
                                                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300'
                                                            : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                                                    }`}>
                                                        {category.visibleCount}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                                    {category.description}
                                                </p>
                                                <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                                                    {previewNames || `No tools available in ${isOnlineMode ? 'online' : 'offline'} mode.`}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none">
                        <div className={`relative overflow-hidden border-b border-gray-200/80 bg-gradient-to-br ${selectedCategory.gradient} p-6 text-white dark:border-white/[0.08] sm:p-8`}>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_40%)]" />
                            <div className="relative">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="max-w-2xl">
                                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-3xl backdrop-blur">
                                            {selectedCategory.icon}
                                        </div>
                                        <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-white/75">Focused Board</p>
                                        <h3 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{selectedCategory.name}</h3>
                                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
                                            {selectedCategory.description}
                                        </p>
                                    </div>

                                    <div className="grid min-w-[220px] grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Available now</p>
                                            <p className="mt-2 text-2xl font-black">{selectedCategory.visibleCount}</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Category total</p>
                                            <p className="mt-2 text-2xl font-black">{selectedCategory.totalCount}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedCategoryPopularTools.length > 0 && (
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {selectedCategoryPopularTools.map((tool) => (
                                            <span
                                                key={tool.id}
                                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur"
                                            >
                                                <span>{tool.icon}</span>
                                                <span>{tool.name}</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Tools in view</p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Open any tool directly from this board. Availability badges still reflect runtime requirements.
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300">
                                    <span className={`h-2 w-2 rounded-full ${isOnlineMode ? 'bg-blue-500' : 'bg-primary-500'}`} />
                                    Showing {isOnlineMode ? 'online-ready' : 'offline-ready'} tools
                                </div>
                            </div>

                            {selectedCategoryTools.length > 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {selectedCategoryTools.map((tool) => {
                                        const availabilityBadge = getToolAvailabilityBadge(tool);

                                        return (
                                            <Link
                                                key={tool.id}
                                                to={`/${tool.id}`}
                                                className="group rounded-[1.5rem] border border-gray-200/80 bg-gray-50/80 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:bg-white hover:shadow-lg hover:shadow-gray-100/70 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-primary-500/30 dark:hover:bg-white/[0.05] dark:hover:shadow-none"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200/80 bg-white text-2xl shadow-sm dark:border-white/[0.08] dark:bg-gray-900/60">
                                                        {tool.icon}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="text-sm font-bold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                                                                {tool.name}
                                                            </h4>
                                                            {availabilityBadge && (
                                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${availabilityBadge.className}`}>
                                                                    {availabilityBadge.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                                            {tool.description}
                                                        </p>
                                                        {tool.availabilityNote && (
                                                            <p className="mt-2 line-clamp-2 text-[11px] text-gray-500 dark:text-gray-400">
                                                                {tool.availabilityNote}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-[1.75rem] border border-dashed border-gray-200/80 bg-gray-50/80 p-8 text-center dark:border-white/[0.08] dark:bg-white/[0.03]">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">No tools available in this mode</p>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        Switch to {isOnlineMode ? 'offline' : 'online'} mode to explore additional {selectedCategory.name.toLowerCase()} workflows.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
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
                            { icon: '💨', title: 'Client-Side Speed', desc: 'Most toolbox workflows still avoid upload delays and process locally at native browser speed.' },
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
