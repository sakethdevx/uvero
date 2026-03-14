import React, { useState } from 'react'

function CopyIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
    )
}

export default function CliCommandList({ commands, className = '' }) {
    const [copiedId, setCopiedId] = useState(null)

    async function handleCopy(id, command) {
        try {
            await navigator.clipboard.writeText(command)
            setCopiedId(id)
            window.setTimeout(() => {
                setCopiedId(currentId => (currentId === id ? null : currentId))
            }, 2000)
        } catch (err) {
            console.error('Failed to copy CLI command', err)
        }
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {commands.map(({ id, label, command, description }) => {
                const isCopied = copiedId === id

                return (
                    <div key={id} className="rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-gray-950/40 shadow-sm">
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                {label && <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>}
                                {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
                                <code className="mt-3 block overflow-x-auto rounded-xl bg-gray-950 px-3 py-3 text-sm text-cyan-200">
                                    {command}
                                </code>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCopy(id, command)}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors sm:flex-shrink-0 ${isCopied ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08]'}`}
                            >
                                {isCopied ? <CheckIcon /> : <CopyIcon />}
                                {isCopied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
