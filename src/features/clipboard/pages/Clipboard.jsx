/* eslint-disable */
import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Clipboard() {
    const navigate = useNavigate()

    /* ── Active tab ── */
    const [activeTab, setActiveTab] = useState('quick') // 'quick' | 'private'

    /* ── Public clipboard state ── */
    const [publicText, setPublicText] = useState('')
    const [publicCode, setPublicCode] = useState(null)
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
                    boardId: publicCode
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

    const PRIVATE_FEATURES = [
        { icon: '🎨', title: 'Syntax Highlighting', desc: '20+ languages supported', color: 'from-yellow-50 to-orange-50 border-orange-100 dark:from-yellow-500/10 dark:to-orange-500/10 dark:border-yellow-500/20' },
        { icon: '📝', title: 'Markdown Preview', desc: 'Live rendering as you type', color: 'from-blue-50 to-cyan-50 border-blue-100 dark:from-blue-500/10 dark:to-cyan-500/10 dark:border-blue-500/20' },
        { icon: '🔑', title: 'Password Lock', desc: 'Restrict access securely', color: 'from-red-50 to-pink-50 border-red-100 dark:from-red-500/10 dark:to-pink-500/10 dark:border-red-500/20' },
        { icon: '🔥', title: 'Burn After Read', desc: 'Self-destruct on first view', color: 'from-orange-50 to-red-50 border-orange-100 dark:from-orange-500/10 dark:to-red-500/10 dark:border-orange-500/20' },
        { icon: '⏳', title: 'Auto-Expire', desc: '1 hour up to 30 days max', color: 'from-purple-50 to-indigo-50 border-purple-100 dark:from-purple-500/10 dark:to-indigo-500/10 dark:border-purple-500/20' },
        { icon: '📱', title: 'QR Code Share', desc: 'Scan to open on any device', color: 'from-green-50 to-emerald-50 border-green-100 dark:from-green-500/10 dark:to-emerald-500/10 dark:border-green-500/20' },
        { icon: '💾', title: 'Auto-Save', desc: 'Never lose your work', color: 'from-cyan-50 to-blue-50 border-cyan-100 dark:from-cyan-500/10 dark:to-blue-500/10 dark:border-cyan-500/20' },
        { icon: '📥', title: 'Download', desc: '.txt / .md / code files', color: 'from-indigo-50 to-violet-50 border-indigo-100 dark:from-indigo-500/10 dark:to-violet-500/10 dark:border-indigo-500/20' },
    ]

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden transition-colors duration-500">
            {/* ── Background Effects ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl transition-all duration-700 ${activeTab === 'quick' ? 'bg-emerald-500/10' : 'bg-purple-500/10'}`} />
                <div className={`absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl transition-all duration-700 ${activeTab === 'quick' ? 'bg-cyan-500/10' : 'bg-indigo-500/10'}`} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            {/* ── Hero ── */}
            <section className="relative pt-20 pb-8 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Instant text sharing · No login required
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4 text-gray-900 dark:text-white">
                        Online{' '}
                        <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Clipboard
                        </span>
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Share text instantly with a 4-digit code, or create private boards with rich features and up to 30-day retention.
                    </p>
                </div>
            </section>

            {/* ── Tab Slider ── */}
            <div className="relative max-w-2xl mx-auto px-4 mb-8">
                <div className="relative flex bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-1.5 shadow-inner">
                    {/* Sliding pill */}
                    <div
                        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl transition-all duration-300 ease-out shadow-md ${
                            activeTab === 'quick'
                                ? 'left-1.5 bg-gradient-to-r from-emerald-500 to-cyan-600'
                                : 'left-[calc(50%+3px)] bg-gradient-to-r from-purple-500 to-indigo-600'
                        }`}
                    />
                    <button
                        onClick={() => setActiveTab('quick')}
                        className={`relative flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-colors duration-200 ${
                            activeTab === 'quick' ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="text-lg">📋</span>
                        <span>Quick Share</span>
                        <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition-colors ${activeTab === 'quick' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>4-digit code</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('private')}
                        className={`relative flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-colors duration-200 ${
                            activeTab === 'private' ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="text-lg">🔒</span>
                        <span>Private Board</span>
                        <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition-colors ${activeTab === 'private' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>named URL</span>
                    </button>
                </div>
            </div>

            {/* ── Content Area ── */}
            <div className="relative max-w-3xl mx-auto px-4 pb-20">

                {/* ══════════ QUICK SHARE TAB ══════════ */}
                <div className={`transition-all duration-300 ${activeTab === 'quick' ? 'block animate-tab-in' : 'hidden'}`}>
                    <div className="space-y-5">

                        {/* Paste Area */}
                        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-sm">📋</div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">Paste &amp; Share</h2>
                                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">Auto-expires in 24h</span>
                            </div>
                            <textarea
                                value={publicText}
                                onChange={e => setPublicText(e.target.value)}
                                placeholder="Paste or type your text here..."
                                className="w-full h-44 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all font-mono"
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                    {publicText.length} chars · {publicText.split(/\s+/).filter(Boolean).length} words
                                </span>
                                <button
                                    onClick={handlePublicSubmit}
                                    disabled={!publicText.trim() || publicLoading}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm"
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
                            <div className="bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:to-cyan-500/10 border border-emerald-500/15 dark:border-emerald-500/25 rounded-2xl p-6 text-center animate-tab-in shadow-inner">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Your 4-digit share code</p>
                                <div className="flex items-center justify-center gap-3 mb-5">
                                    {publicCode.split('').map((digit, i) => (
                                        <div key={i} className="w-14 h-16 bg-white dark:bg-gray-900/80 border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl flex items-center justify-center text-3xl font-black text-emerald-500 dark:text-emerald-400 shadow-lg">
                                            {digit}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(publicCode, setCopiedCode)}
                                    className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${copiedCode ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/10'}`}
                                >
                                    {copiedCode ? (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Copied!</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Copy Code</>
                                    )}
                                </button>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Share this code so others can retrieve your text</p>
                            </div>
                        )}

                        {/* Retrieve Area */}
                        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm">🔍</div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">Retrieve by Code</h2>
                            </div>
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
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {retrieveLoading ? (
                                    <span className="inline-flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Retrieving...</span>
                                ) : 'Retrieve Text'}
                            </button>
                            {retrieveError && <p className="text-sm text-red-400 text-center">{retrieveError}</p>}
                        </div>

                        {/* Retrieved Text */}
                        {retrievedText !== null && (
                            <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-5 animate-tab-in shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Retrieved Text</h3>
                                    <button
                                        onClick={() => copyToClipboard(retrievedText, setCopied)}
                                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'text-blue-500 dark:text-blue-400 hover:bg-blue-500/10'}`}
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
                </div>

                {/* ══════════ PRIVATE BOARD TAB ══════════ */}
                <div className={`transition-all duration-300 ${activeTab === 'private' ? 'block animate-tab-in' : 'hidden'}`}>
                    <div className="space-y-5">

                        {/* Board Name Input */}
                        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm">🔒</div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">Open or Create a Board</h2>
                            </div>
                            <form onSubmit={handleGoToBoard} className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs font-mono select-none">/clipboard/</span>
                                        <input
                                            type="text"
                                            value={boardName}
                                            onChange={e => setBoardName(e.target.value)}
                                            placeholder="my-notes"
                                            className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-[88px] pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all shadow-sm"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!boardName.trim()}
                                        className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 whitespace-nowrap"
                                    >
                                        Open →
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Enter a name to create or open an existing private board. Share the URL to collaborate.</p>
                            </form>
                        </div>

                        {/* Board Settings Overview */}
                        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 dark:from-slate-400 dark:to-gray-500 flex items-center justify-center text-sm">⚙️</div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">Board Options</h2>
                                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">Available inside every board</span>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-3">
                                {/* Password */}
                                <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-white/8 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🔑</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">Password Lock</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">Protect your board with a password. Anyone opening the URL will be asked to enter it.</p>
                                </div>
                                {/* Expiry */}
                                <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-white/8 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">⏳</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">Auto-Expire</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {['Never', '1h', '24h', '7d', '30d'].map(opt => (
                                            <span key={opt} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${opt === '30d' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}>
                                                {opt}{opt === '30d' ? ' ★' : ''}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Max retention: 30 days</p>
                                </div>
                                {/* Burn After Read */}
                                <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-white/8 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🔥</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">Burn After Read</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">Board self-destructs after it is opened once. Perfect for one-time secrets.</p>
                                </div>
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm">✨</div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white">All Features</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {PRIVATE_FEATURES.map((f, i) => (
                                    <div key={i} className={`bg-gradient-to-br ${f.color} border rounded-xl p-3.5 hover:scale-[1.03] hover:shadow-md transition-all cursor-default`}>
                                        <span className="text-xl mb-2 block">{f.icon}</span>
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight mb-0.5">{f.title}</h4>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Bottom Stats ── */}
                <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { val: '10,000', label: 'Code Pool', icon: '🎯' },
                        { val: 'Zero', label: 'Login Required', icon: '🚫' },
                        { val: '∞', label: 'Board Limit', icon: '♾️' },
                        { val: '< 1s', label: 'Access Time', icon: '⚡' },
                    ].map((s, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 text-center hover:scale-[1.02] transition-all shadow-sm">
                            <div className="text-2xl mb-1">{s.icon}</div>
                            <div className="text-xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{s.val}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Inline animation styles */}
            <style>{`
                @keyframes tab-in {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-tab-in { animation: tab-in 0.35s ease-out; }
            `}</style>
        </div>
    )
}
