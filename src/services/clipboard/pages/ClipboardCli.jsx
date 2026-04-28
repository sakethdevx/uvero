import React from 'react'
import { Link } from 'react-router-dom'
import CliCommandList from '../components/CliCommandList'
import { CLI_INSTALL_COMMAND, CLI_PAGE_COMMANDS } from '../cliCommands'

const quickNotes = [
    'Share text straight from the terminal without opening the browser first.',
    'Read or open a quick-share code when someone sends it to you.',
    'Create and update private boards from the CLI when you need named collaboration spaces.',
]

export default function ClipboardCli() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="absolute right-[-6rem] top-12 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                </div>

                <section className="relative max-w-5xl mx-auto px-4 pt-16 pb-10 sm:px-6 lg:px-8">
                    <Link
                        to="/clipboard"
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        Back to Clipboard
                    </Link>

                    <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
                        <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-xl shadow-emerald-100/40 dark:border-white/[0.08] dark:from-emerald-500/10 dark:via-gray-950 dark:to-cyan-500/10 dark:shadow-none">
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">Uvero CLI</p>
                            <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                                Terminal access for the online clipboard
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
                                Install the official CLI once, then send, fetch, open, and manage Uvero clipboard content directly from your shell.
                            </p>

                            <div className="mt-8 rounded-2xl border border-gray-200/80 bg-white/85 p-5 shadow-sm dark:border-white/[0.08] dark:bg-gray-950/50">
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Installation</p>
                                <code className="mt-3 block overflow-x-auto rounded-xl bg-gray-950 px-4 py-3 text-sm text-cyan-200">
                                    {CLI_INSTALL_COMMAND}
                                </code>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-gray-200/80 bg-gray-50/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">What you can do</p>
                            <div className="mt-5 space-y-4">
                                {quickNotes.map(note => (
                                    <div key={note} className="flex items-start gap-3">
                                        <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{note}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <section className="max-w-5xl mx-auto px-4 pb-20 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none sm:p-8">
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
                </div>
            </section>
        </div>
    )
}
