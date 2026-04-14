import { Link } from 'react-router-dom';
import { getToolsByCategory } from '../tools';
import { getToolAvailabilityBadge } from '../core/toolMetadata';

const CATEGORY_THEME = {
    image: {
        label: 'Image Tools',
        gradient: 'from-sky-500 via-blue-500 to-cyan-500',
        surface: 'from-sky-50 via-white to-cyan-50 dark:from-sky-500/10 dark:via-gray-950 dark:to-cyan-500/10',
        tint: 'text-sky-700 dark:text-sky-300',
    },
    pdf: {
        label: 'PDF Tools',
        gradient: 'from-rose-500 via-red-500 to-orange-500',
        surface: 'from-rose-50 via-white to-orange-50 dark:from-rose-500/10 dark:via-gray-950 dark:to-orange-500/10',
        tint: 'text-rose-700 dark:text-rose-300',
    },
    audio: {
        label: 'Audio Tools',
        gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
        surface: 'from-violet-50 via-white to-fuchsia-50 dark:from-violet-500/10 dark:via-gray-950 dark:to-fuchsia-500/10',
        tint: 'text-violet-700 dark:text-violet-300',
    },
    video: {
        label: 'Video Tools',
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        surface: 'from-emerald-50 via-white to-teal-50 dark:from-emerald-500/10 dark:via-gray-950 dark:to-teal-500/10',
        tint: 'text-emerald-700 dark:text-emerald-300',
    },
    utility: {
        label: 'Utility Tools',
        gradient: 'from-cyan-500 via-teal-500 to-blue-500',
        surface: 'from-cyan-50 via-white to-blue-50 dark:from-cyan-500/10 dark:via-gray-950 dark:to-blue-500/10',
        tint: 'text-cyan-700 dark:text-cyan-300',
    },
    document: {
        label: 'Document & Ebook',
        gradient: 'from-amber-500 via-orange-500 to-yellow-500',
        surface: 'from-amber-50 via-white to-yellow-50 dark:from-amber-500/10 dark:via-gray-950 dark:to-yellow-500/10',
        tint: 'text-amber-700 dark:text-amber-300',
    },
    archive: {
        label: 'Archive Tools',
        gradient: 'from-slate-500 via-gray-600 to-zinc-700',
        surface: 'from-slate-50 via-white to-gray-50 dark:from-slate-500/10 dark:via-gray-950 dark:to-zinc-500/10',
        tint: 'text-slate-700 dark:text-slate-300',
    },
};

function getTheme(tool) {
    return CATEGORY_THEME[tool.category] || CATEGORY_THEME.utility;
}

function getModeSummary(tool) {
    if (tool.modes.length === 2) {
        return 'Works in offline and online mode';
    }

    if (tool.modes[0] === 'online') {
        return 'Online only';
    }

    return 'Offline only';
}

function getPrivacySummary(tool) {
    if (tool.modes.includes('offline') && tool.modes.includes('online')) {
        return 'Offline mode keeps supported work on-device. Online mode unlocks server-backed paths when needed.';
    }

    if (tool.modes.includes('offline')) {
        return 'This tool is designed to keep processing in your browser for maximum privacy.';
    }

    return 'This tool uses an online runtime and may require server-backed processing for the workflow to complete.';
}

function getExperienceSummary(tool, isOnlineMode) {
    if (tool.availabilityNote) {
        return tool.availabilityNote;
    }

    if (tool.modes.includes('offline') && tool.modes.includes('online')) {
        return isOnlineMode
            ? 'You are in online mode, so server-backed capabilities can be used where the tool supports them.'
            : 'You are in offline mode, so supported processing stays local in the browser.';
    }

    return isOnlineMode
        ? 'This page is currently framed for online processing expectations.'
        : 'This page is currently framed for offline processing expectations.';
}

function buildRelatedTools(tool) {
    return getToolsByCategory(tool.category)
        .filter((candidate) => candidate.id !== tool.id)
        .slice(0, 4);
}

export function buildToolFaqs(tool, isOnlineMode) {
    const modeLabel = isOnlineMode ? 'online' : 'offline';
    const modeSummary = getModeSummary(tool).toLowerCase();
    const limitSummary = tool.limits?.length
        ? tool.limits.join(', ')
        : 'No special limits are highlighted beyond the normal browser or runtime constraints for this workflow.';

    return [
        {
            question: `What does ${tool.name} do?`,
            answer: `${tool.name} helps you ${tool.description.charAt(0).toLowerCase()}${tool.description.slice(1)}.`,
        },
        {
            question: `Does ${tool.name} work in offline or online mode?`,
            answer: `${tool.name} is ${modeSummary}. You are currently viewing it in ${modeLabel} mode.`,
        },
        {
            question: `Is ${tool.name} private to use?`,
            answer: getPrivacySummary(tool),
        },
        {
            question: `Are there any limits or availability notes for ${tool.name}?`,
            answer: `${tool.availabilityNote ? `${tool.availabilityNote} ` : ''}${limitSummary}`,
        },
    ];
}

export default function ToolPageShell({ tool, isOnlineMode, children }) {
    const theme = getTheme(tool);
    const availabilityBadge = getToolAvailabilityBadge(tool);
    const relatedTools = buildRelatedTools(tool);
    const faqs = buildToolFaqs(tool, isOnlineMode);
    const detailCards = [
        {
            title: 'Current Mode',
            body: isOnlineMode ? 'Online mode active' : 'Offline mode active',
            detail: getExperienceSummary(tool, isOnlineMode),
        },
        {
            title: 'Privacy & Runtime',
            body: tool.modes.includes('offline') ? 'Privacy-first workflow' : 'Server-backed workflow',
            detail: getPrivacySummary(tool),
        },
    ];

    if (tool.limits?.length > 0) {
        detailCards.push({
            title: 'Important Notes',
            body: tool.limits.join(' • '),
            detail: tool.availabilityNote || 'Keep these format and runtime limits in mind while using this tool.',
        });
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 transition-colors duration-500 dark:bg-gray-950 dark:text-white">
            <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[-8rem] top-8 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl" />
                    <div className="absolute right-[-6rem] top-6 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
                </div>

                <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
                    <div className={`rounded-[1.75rem] border border-gray-200/80 bg-gradient-to-br ${theme.surface} p-5 shadow-xl shadow-gray-100/70 dark:border-white/[0.08] dark:shadow-none sm:p-7`}>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            <Link to="/toolbox" className="hover:text-primary-600 dark:hover:text-primary-300">Toolbox</Link>
                            <span>/</span>
                            <span>{theme.label}</span>
                            <span>/</span>
                            <span className="text-gray-900 dark:text-white">{tool.name}</span>
                        </div>

                        <div className="mt-4">
                            <div className="flex flex-wrap items-start gap-4">
                                <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-2xl text-white shadow-lg shadow-black/10 sm:h-14 sm:w-14 sm:text-3xl`}>
                                    {tool.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${theme.tint}`}>{theme.label}</p>
                                        <span className="inline-flex items-center rounded-full border border-gray-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-gray-200">
                                            {getModeSummary(tool)}
                                        </span>
                                        <span className="inline-flex items-center rounded-full border border-gray-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-gray-200">
                                            {tool.category}
                                        </span>
                                        {availabilityBadge && (
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${availabilityBadge.className}`}>
                                                {availabilityBadge.label}
                                            </span>
                                        )}
                                    </div>

                                    <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-4xl">
                                        {tool.name}
                                    </h1>
                                    <p className="mt-3 max-w-4xl text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
                                        {tool.seo?.description || tool.description}
                                    </p>

                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <a href="#workspace" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
                                            Open Workspace
                                        </a>
                                        <a href="#faq" className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-200 dark:hover:bg-white/[0.08]">
                                            View FAQ
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {detailCards.map((card) => (
                                <div
                                    key={card.title}
                                    className="rounded-[1.25rem] border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-white/[0.08] dark:bg-white/[0.04]"
                                >
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{card.title}</p>
                                    <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white sm:text-[15px]">
                                        {card.body}
                                    </p>
                                    <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                        {card.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <section id="workspace" className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
                {children}
            </section>

            <section id="faq" className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-[2rem] border border-gray-200/80 bg-white p-6 shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">FAQ</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Common questions about {tool.name}</h2>
                    <div className="mt-6 space-y-3">
                        {faqs.map((faq) => (
                            <details
                                key={faq.question}
                                className="group rounded-[1.5rem] border border-gray-200/80 bg-gray-50/70 p-5 open:bg-white dark:border-white/[0.08] dark:bg-white/[0.03] dark:open:bg-white/[0.05]"
                            >
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-gray-900 dark:text-white">
                                    <span>{faq.question}</span>
                                    <span className="text-gray-400 transition-transform group-open:rotate-45">+</span>
                                </summary>
                                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                    {faq.answer}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {relatedTools.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 pb-14 sm:px-6 lg:px-8">
                    <div className="rounded-[2rem] border border-gray-200/80 bg-gray-50/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-8">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Related</p>
                        <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Explore more {theme.label.toLowerCase()}</h2>
                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {relatedTools.map((relatedTool) => (
                                <Link
                                    key={relatedTool.id}
                                    to={`/${relatedTool.id}`}
                                    className="group rounded-[1.5rem] border border-gray-200/80 bg-white p-4 transition-shadow hover:shadow-lg hover:shadow-gray-100/70 dark:border-white/[0.08] dark:bg-gray-900/60 dark:hover:shadow-none"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-2xl dark:bg-white/[0.05]">
                                            {relatedTool.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                                                {relatedTool.name}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                                                {relatedTool.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
