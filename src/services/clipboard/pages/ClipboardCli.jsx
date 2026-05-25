import React from 'react'
import { Link } from 'react-router-dom'
import CliCommandList from '../components/CliCommandList'
import { CLI_INSTALL_COMMAND, CLI_PAGE_COMMANDS } from '../cliCommands'
import { AIInlinePanel, AIServiceShell, CompactServiceHeader } from '../../../components/AIServiceLayout'

const quickNotes = [
    'Share text straight from the terminal without opening the browser first.',
    'Read or open a quick-share code when someone sends it to you.',
    'Create and update Live Clipboards (Private) from the CLI when you need named collaboration spaces.',
]

export default function ClipboardCli() {
    return (
        <AIServiceShell maxWidth="max-w-5xl">
            <Link to="/clipboard" className="suggestion-chip mb-3">
                <span>←</span>
                <span>Clipboard</span>
            </Link>
            <CompactServiceHeader
                eyebrow="Uvero CLI"
                title="Terminal clipboard access"
                description="Send, fetch, open, and manage clipboard content directly from your shell."
            />

            <AIInlinePanel className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Installation</p>
                <code className="mt-3 block overflow-x-auto rounded-xl bg-gray-950 px-4 py-3 text-sm text-cyan-200">
                    {CLI_INSTALL_COMMAND}
                </code>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {quickNotes.map(note => (
                        <span key={note} className="suggestion-chip !opacity-100 !animate-none shrink-0">{note}</span>
                    ))}
                </div>
            </AIInlinePanel>

            <section>
                <AIInlinePanel>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Examples</p>
                            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Common CLI commands</h2>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                These examples mirror the browser clipboard flows without changing how the existing web experience works.
                            </p>
                        </div>
                        <Link
                            to="/clipboard"
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-gray-200 dark:hover:bg-white/[0.08]"
                        >
                            Open Clipboard
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    </div>

                    <CliCommandList commands={CLI_PAGE_COMMANDS} className="mt-6" />
                </AIInlinePanel>
            </section>
        </AIServiceShell>
    )
}
