/* eslint-disable */
import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Clipboard() {
    const navigate = useNavigate()

    /* ── Public clipboard state ── */
    const [publicText, setPublicText] = useState('')
    const [publicCode, setPublicCode] = useState(null)
    const [retrieveCode, setRetrieveCode] = useState('')
    const [retrievedText, setRetrievedText] = useState(null)
    const [publicLoading, setPublicLoading] = useState(false)
    const [retrieveLoading, setRetrieveLoading] = useState(false)
    const [publicError, setPublicError] = useState('')
    const [retrieveError, setRetrieveError] = useState('')
    const [copied, setCopied] = useState(false)
    const [copiedCode, setCopiedCode] = useState(false)

    /* ── Private clipboard state ── */
    const [boardName, setBoardName] = useState('')

    /* ── Code input refs for 4 digit boxes ── */
    const codeInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]
    const [codeDigits, setCodeDigits] = useState(['', '', '', ''])

    /* ── Public: Submit text ── */
    async function handlePublicSubmit() {
        if (!publicText.trim()) return
        setPublicLoading(true)
        setPublicError('')
        try {
            const resp = await fetch('/api/clipboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: publicText,
                    type: 'public',
                    boardId: publicCode // reuse same code if already assigned
                })
            })
            const data = await resp.json()
            if (!resp.ok) throw new Error(data.error || 'Failed to save')
            setPublicCode(data.data.id)
        } catch (err) {
            setPublicError(err.message)
        } finally {
            setPublicLoading(false)
        }
    }

    /* ── Public: Retrieve text ── */
    async function handleRetrieve() {
        const code = codeDigits.join('')
        if (code.length !== 4) return
        setRetrieveLoading(true)
        setRetrieveError('')
        setRetrievedText(null)
        try {
            const resp = await fetch(`/api/clipboard?code=${encodeURIComponent(code)}`)
            const data = await resp.json()
            if (!resp.ok) throw new Error(data.error || 'Board not found')
            setRetrievedText(data.data.content)
        } catch (err) {
            setRetrieveError(err.message)
        } finally {
            setRetrieveLoading(false)
        }
    }

    /* ── Code input handler ── */
    function handleCodeDigitChange(index, value) {
        if (value.length > 1) value = value.slice(-1)
        if (value && !/^\d$/.test(value)) return
        const newDigits = [...codeDigits]
        newDigits[index] = value
        setCodeDigits(newDigits)
        // Auto-focus next
        if (value && index < 3) {
            codeInputRefs[index + 1].current?.focus()
        }
    }

    function handleCodeKeyDown(index, e) {
        if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
            codeInputRefs[index - 1].current?.focus()
        }
        if (e.key === 'Enter' && codeDigits.join('').length === 4) {
            handleRetrieve()
        }
    }

    function handleCodePaste(e) {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
        const newDigits = ['', '', '', '']
        for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i]
        setCodeDigits(newDigits)
        if (pasted.length === 4) {
            codeInputRefs[3].current?.focus()
        } else if (pasted.length > 0) {
            codeInputRefs[Math.min(pasted.length, 3)].current?.focus()
        }
    }

    /* ── Copy helpers ── */
    function copyToClipboard(text, setter) {
        navigator.clipboard.writeText(text)
        setter(true)
        setTimeout(() => setter(false), 2000)
    }

    /* ── Private: Go to board ── */
    function handleGoToBoard(e) {
        e.preventDefault()
        if (!boardName.trim()) return
        const slug = boardName.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '-').replace(/-+/g, '-').slice(0, 100)
        navigate(`/clipboard/${slug}`)
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden transition-colors duration-500">
            {/* ── Background Effects ── */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            {/* ── Hero ── */}
            <section className="relative pt-20 pb-8 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Instant text sharing
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4 text-gray-900 dark:text-white">
                        Online{' '}
                        <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Clipboard
                        </span>
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-4 leading-relaxed">
                        Share text instantly with a 4-digit code, or create private boards with rich features.
                        No login required.
                    </p>
                </div>
            </section>

            {/* ── Two Modes ── */}
            <div className="relative max-w-6xl mx-auto px-4 pb-20">
                <div className="grid lg:grid-cols-2 gap-8">

                    {/* ══════════ PUBLIC CLIPBOARD ══════════ */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-lg">📋</div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Share</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Paste text, get a 4-digit code</p>
                            </div>
                        </div>

                        {/* Paste Area */}
                        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-5 space-y-4">
                            <textarea
                                value={publicText}
                                onChange={e => setPublicText(e.target.value)}
                                placeholder="Paste or type your text here..."
                                className="w-full h-48 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all font-mono"
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    {publicText.length} chars · {publicText.split(/\s+/).filter(Boolean).length} words
                                </span>
                                <button
                                    onClick={handlePublicSubmit}
                                    disabled={!publicText.trim() || publicLoading}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    {publicLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    )}
                                    {publicCode ? 'Update' : 'Submit'}
                                </button>
                            </div>
                            {publicError && <p className="text-sm text-red-400">{publicError}</p>}
                        </div>

                        {/* Code Display */}
                        {publicCode && (
                            <div className="bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:to-cyan-500/10 border border-emerald-500/10 dark:border-emerald-500/20 rounded-2xl p-6 text-center animate-fade-in shadow-inner">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">Your 4-digit code</p>
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    {publicCode.split('').map((digit, i) => (
                                        <div key={i} className="w-14 h-16 bg-white dark:bg-gray-900/80 border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl flex items-center justify-center text-3xl font-black text-emerald-500 dark:text-emerald-400 shadow-xl shadow-emerald-500/5">
                                            {digit}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(publicCode, setCopiedCode)}
                                    className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                    {copiedCode ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                            Copy Code
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-gray-500 mt-3">Share this code to let others retrieve your text</p>
                            </div>
                        )}

                        {/* Retrieve Area */}
                        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-5 space-y-4">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Retrieve by Code</h3>
                            <div className="flex items-center justify-center gap-3">
                                {[0, 1, 2, 3].map(i => (
                                    <input
                                        key={i}
                                        ref={codeInputRefs[i]}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={codeDigits[i]}
                                        onChange={e => handleCodeDigitChange(i, e.target.value)}
                                        onKeyDown={e => handleCodeKeyDown(i, e)}
                                        onPaste={i === 0 ? handleCodePaste : undefined}
                                        className="w-14 h-16 text-center text-2xl font-black bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all shadow-sm"
                                    />
                                ))}
                            </div>
                            <button
                                onClick={handleRetrieve}
                                disabled={codeDigits.join('').length !== 4 || retrieveLoading}
                                className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-40"
                            >
                                {retrieveLoading ? 'Retrieving...' : 'Retrieve'}
                            </button>
                            {retrieveError && <p className="text-sm text-red-400">{retrieveError}</p>}
                        </div>

                        {/* Retrieved Text */}
                        {retrievedText !== null && (
                            <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-5 animate-fade-in">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Retrieved Text</h3>
                                    <button
                                        onClick={() => copyToClipboard(retrievedText, setCopied)}
                                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold"
                                    >
                                        {copied ? '✓ Copied!' : 'Copy All'}
                                    </button>
                                </div>
                                <pre className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words font-mono max-h-64 overflow-auto shadow-inner leading-relaxed">
                                    {retrievedText}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* ══════════ PRIVATE CLIPBOARD ══════════ */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg">🔒</div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Private Board</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Named boards with rich features</p>
                            </div>
                        </div>

                        {/* Board Name Input */}
                        <form onSubmit={handleGoToBoard} className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Board Name</label>
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">/clipboard/</span>
                                        <input
                                            type="text"
                                            value={boardName}
                                            onChange={e => setBoardName(e.target.value)}
                                            placeholder="my-notes"
                                            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-28 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all shadow-sm"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!boardName.trim()}
                                        className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                                    >
                                        Open →
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">Enter a name to create or open a private board. Share the URL with others to collaborate.</p>
                        </form>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: '🎨', title: 'Syntax Highlighting', desc: '20+ languages', color: 'from-accent-50 to-orange-50 border-orange-100 dark:from-yellow-500/5 dark:to-orange-500/5 dark:border-yellow-500/20' },
                                { icon: '📝', title: 'Markdown Preview', desc: 'Live rendering', color: 'from-blue-50 to-cyan-50 border-blue-100 dark:from-blue-500/5 dark:to-cyan-500/5 dark:border-blue-500/20' },
                                { icon: '🔑', title: 'Password Lock', desc: 'Secure access', color: 'from-red-50 to-pink-50 border-red-100 dark:from-red-500/5 dark:to-pink-500/5 dark:border-red-500/20' },
                                { icon: '🔥', title: 'Burn After Read', desc: 'Self-destruct', color: 'from-orange-50 to-red-50 border-orange-100 dark:from-orange-500/5 dark:to-red-500/5 dark:border-orange-500/20' },
                                { icon: '⏳', title: 'Auto-Expire', desc: '1h to 30 days', color: 'from-purple-50 to-indigo-50 border-purple-100 dark:from-purple-500/5 dark:to-indigo-500/5 dark:border-purple-500/20' },
                                { icon: '📱', title: 'QR Code Share', desc: 'Scan to access', color: 'from-green-50 to-emerald-50 border-green-100 dark:from-green-500/5 dark:to-emerald-500/5 dark:border-green-500/20' },
                                { icon: '💾', title: 'Auto-Save', desc: 'Never lose work', color: 'from-cyan-50 to-blue-50 border-cyan-100 dark:from-cyan-500/5 dark:to-blue-500/5 dark:border-cyan-500/20' },
                                { icon: '📥', title: 'Download', desc: '.txt / .md / code', color: 'from-indigo-50 to-violet-50 border-indigo-100 dark:from-indigo-500/5 dark:to-violet-500/5 dark:border-indigo-500/20' },
                            ].map((f, i) => (
                                <div key={i} className={`bg-gradient-to-br ${f.color} border rounded-xl p-3.5 hover:scale-[1.02] transition-all shadow-sm`}>
                                    <span className="text-xl mb-1 block">{f.icon}</span>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{f.title}</h4>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Bottom Stats ── */}
                <div className="mt-16 flex items-center justify-center gap-8 sm:gap-16">
                    {[
                        { val: '10,000', label: 'Code Pool' },
                        { val: '0', label: 'Login Required' },
                        { val: '∞', label: 'Board Limit' },
                        { val: '< 1s', label: 'Access Time' },
                    ].map((s, i) => (
                        <div key={i} className="text-center">
                            <div className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{s.val}</div>
                            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Inline animation styles */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.4s ease-out; }
            `}</style>
        </div>
    )
}
