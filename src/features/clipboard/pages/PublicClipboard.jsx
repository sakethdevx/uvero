import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function PublicClipboard() {
    const { code } = useParams()

    const isValidCode = /^[0-9]{4}$/.test(code)

    const [content, setContent] = useState(null)
    const [loading, setLoading] = useState(isValidCode)
    const [error, setError] = useState(isValidCode ? '' : 'Invalid clipboard code')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!isValidCode) return
        let cancelled = false
        async function fetchClipboard() {
            setLoading(true)
            setError('')
            try {
                const resp = await fetch(`/api/clipboard/get/${encodeURIComponent(code)}`)
                const data = await resp.json()
                if (!resp.ok) {
                    throw new Error('Clipboard not found or expired.')
                }
                if (!cancelled) setContent(data.data?.content ?? data.content ?? '')
            } catch (err) {
                if (!cancelled) setError('Clipboard not found or expired.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        fetchClipboard()
        return () => { cancelled = true }
    }, [code, isValidCode])

    function copyToClipboard() {
        navigator.clipboard.writeText(content).catch(() => {})
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden transition-colors duration-500">
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl bg-emerald-500/10" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl bg-cyan-500/10" />
            </div>

            {/* Hero */}
            <section className="relative pt-20 pb-10 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Quick Share Clipboard
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4 text-gray-900 dark:text-white">
                        Clipboard{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
                            #{code}
                        </span>
                    </h1>
                </div>
            </section>

            {/* Content */}
            <div className="relative max-w-2xl mx-auto px-4 pb-24">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-8 text-center">
                        <p className="text-red-600 dark:text-red-400 font-semibold mb-4">{error}</p>
                        <Link
                            to="/clipboard"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
                        >
                            ← Back to Clipboard
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Code badge */}
                        <div className="flex items-center justify-center gap-3">
                            {code.split('').map((digit, i) => (
                                <div key={i} className="w-14 h-16 bg-white dark:bg-gray-900/80 border border-emerald-300 dark:border-emerald-500/30 rounded-xl flex items-center justify-center text-3xl font-black text-emerald-600 dark:text-emerald-400 shadow-md">
                                    {digit}
                                </div>
                            ))}
                        </div>

                        {/* Retrieved content */}
                        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Shared Text</h3>
                                <button
                                    onClick={copyToClipboard}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
                                >
                                    {copied ? (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Copied!</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>Copy All</>
                                    )}
                                </button>
                            </div>
                            <pre className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words font-mono max-h-96 overflow-auto shadow-inner leading-relaxed">
                                {content}
                            </pre>
                        </div>

                        <div className="text-center">
                            <Link
                                to="/clipboard"
                                className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
                            >
                                ← Share your own text
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
