import { getToolAvailabilityBadge } from '../core/toolMetadata';
import { AIBackLink, AIInlinePanel, AIServiceShell, CompactServiceHeader } from '../../../components/AIServiceLayout';

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

function getPrivacySummary(tool) {
    return tool.privacy || 'Client-side processing where supported, with a compact workspace designed for direct tool execution.';
}

export function buildToolFaqs(tool) {
    const limitSummary = tool.limits?.length
        ? tool.limits.join(', ')
        : 'No special limits are highlighted beyond normal browser constraints.';

    return [
        {
            question: `What does ${tool.name} do?`,
            answer: `${tool.name} helps you ${tool.description.charAt(0).toLowerCase()}${tool.description.slice(1)}.`,
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

export default function ToolPageShell({ tool, children }) {
    const theme = getTheme(tool);
    const availabilityBadge = getToolAvailabilityBadge(tool);
    const privacySummary = getPrivacySummary(tool);

    return (
        <AIServiceShell>
            <AIBackLink to="/toolbox">Toolbox</AIBackLink>
            <CompactServiceHeader
                eyebrow={theme.label}
                title={tool.name}
                description={tool.seo?.description || tool.description}
                meta={(
                    <>
                        <span className="suggestion-chip !opacity-100 !animate-none">{tool.icon}<span>{tool.category}</span></span>
                        {availabilityBadge && (
                            <span className={`inline-flex rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${availabilityBadge.className}`}>
                                {availabilityBadge.label}
                            </span>
                        )}
                    </>
                )}
                actions={(
                    <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                        <span className="suggestion-chip !opacity-100 !animate-none whitespace-nowrap">Local workspace</span>
                        <span className="suggestion-chip !opacity-100 !animate-none whitespace-nowrap">{privacySummary}</span>
                    </div>
                )}
            />

            {tool.limits?.length > 0 && (
                <AIInlinePanel className="mb-4 !py-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {tool.limits.map((limit) => (
                            <span key={limit} className="suggestion-chip !opacity-100 !animate-none shrink-0">
                                {limit}
                            </span>
                        ))}
                    </div>
                </AIInlinePanel>
            )}

            <section id="workspace" className="pb-4">
                {children}
            </section>
        </AIServiceShell>
    );
}
