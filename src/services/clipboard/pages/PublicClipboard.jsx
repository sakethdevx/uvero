import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const CODE_REGEX = /^[0-9]{4}$/

export default function PublicClipboard() {
    const { code } = useParams()
    const [content, setContent] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    const isValidCode = CODE_REGEX.test(code)

    useEffect(() => {
        if (!isValidCode) return
        setLoading(true)
        setError('')
        setContent(null)
        fetch(`/api/clipboard?code=${encodeURIComponent(code)}`)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.error || 'Clipboard not found')
                setContent(data.data.content)
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [code, isValidCode])

    function copyContent() {
        if (content == null) return
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }).catch(() => {})
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl bg-emerald-500/10" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl bg-cyan-500/10" />
            </div>

            <div className="relative max-w-2xl mx-auto px-4 pt-20 pb-24">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Quick Share Clipboard
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3 text-gray-900 dark:text-white">
                        Clipboard <span className="text-emerald-600 dark:text-emerald-400">#{code}</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Public quick-share clipboard</p>
                </div>

                {/* Content area */}
                <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    {!isValidCode && (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">⚠️</div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">Invalid Code</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                The code <span className="font-mono font-bold">{code}</span> is not a valid 4-digit clipboard code.
                            </p>
                        </div>
                    )}

                    {isValidCode && loading && (
                        <div className="flex items-center justify-center gap-3 py-12">
                            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                            <span className="text-gray-500 dark:text-gray-400">Loading clipboard…</span>
                        </div>
                    )}

                    {isValidCode && !loading && error && (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">Clipboard Not Found</p>
                            <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {isValidCode && !loading && content != null && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Content</span>
                                <button
                                    onClick={copyContent}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
                                >
                                    {copied ? (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Copied!</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>Copy</>
                                    )}
                                </button>
                            </div>
                            <pre className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-900 dark:text-gray-200 font-mono whitespace-pre-wrap break-words min-h-[8rem]">
                                {content}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Back link */}
                <div className="mt-6 text-center">
                    <Link
                        to="/clipboard"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        Back to Clipboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
