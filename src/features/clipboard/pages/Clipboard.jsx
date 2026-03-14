import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CliCommandList from '../components/CliCommandList'
import { CLI_INSTALL_COMMAND, getQuickShareCliCommands } from '../cliCommands'

const PRIVATE_FEATURES = [
    { icon: '🎨', title: 'Syntax Highlighting', desc: '20+ languages supported', classes: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
    { icon: '📝', title: 'Markdown Preview', desc: 'Live rendering with split view', classes: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
    { icon: '🔑', title: 'Password Lock', desc: 'Protect with a password', classes: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' },
    { icon: '🔥', title: 'Burn After Read', desc: 'Self-destruct after opening', classes: 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20' },
    { icon: '⏳', title: 'Auto-Expire', desc: '1 hour up to 30 days max', classes: 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20' },
    { icon: '📱', title: 'QR Code Share', desc: 'Instant scan to access', classes: 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20' },
    { icon: '💾', title: 'Auto-Save', desc: 'Real-time, never lose work', classes: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20' },
    { icon: '📥', title: 'Download', desc: 'Export as .txt, .md, or code', classes: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' },
]

export default function Clipboard() {
    const navigate = useNavigate()

    /* ── Active mode: 'quick' | 'private' ── */
    const [activeMode, setActiveMode] = useState('quick')

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
    const [copiedLink, setCopiedLink] = useState(false)

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

    const quickShareCliCommands = publicCode ? getQuickShareCliCommands(publicCode) : []

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden transition-colors duration-500">
            {/* ── Background Effects (colour shifts with active mode) ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl transition-all duration-700 ${activeMode === 'quick' ? 'bg-emerald-500/10' : 'bg-purple-500/10'}`} />
                <div className={`absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl transition-all duration-700 ${activeMode === 'quick' ? 'bg-cyan-500/10' : 'bg-indigo-500/10'}`} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
            </div>

            {/* ── Hero ── */}
            <section className="relative pt-20 pb-10 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Instant text sharing · No login required
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4 text-gray-900 dark:text-white">
                        Online{' '}
                        <span className={`bg-clip-text text-transparent transition-all duration-700 ${activeMode === 'quick' ? 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500' : 'bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-500'}`}>
                            Clipboard
                        </span>
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
                        Share text instantly with a 4-digit code, or create named private boards with rich features.
                    </p>
                </div>
            </section>

            {/* ── Mode Slider ── */}
            <div className="relative flex justify-center px-4 mb-10">
                <div className="relative inline-flex bg-gray-100 dark:bg-gray-900/70 border border-gray-200 dark:border-white/10 rounded-2xl p-1.5 shadow-inner">
                    {/* Animated sliding pill */}
                    <div
                        className="absolute top-1.5 bottom-1.5 rounded-xl shadow-lg transition-all duration-300 ease-in-out"
                        style={{
                            width: 'calc(50% - 3px)',
                            left: '6px',
                            transform: activeMode === 'quick' ? 'translateX(0)' : 'translateX(calc(100% + 3px))',
                            background: activeMode === 'quick'
                                ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                                : 'linear-gradient(135deg, #a855f7, #6366f1)',
                        }}
                    />
                    <button
                        onClick={() => setActiveMode('quick')}
                        className={`relative flex items-center gap-2 px-6 sm:px-10 py-3 rounded-xl text-sm sm:text-base font-bold z-10 transition-colors duration-300 select-none ${activeMode === 'quick' ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        <span className="text-base">⚡</span>
                        <span>Quick Share</span>
                    </button>
                    <button
                        onClick={() => setActiveMode('private')}
                        className={`relative flex items-center gap-2 px-6 sm:px-10 py-3 rounded-xl text-sm sm:text-base font-bold z-10 transition-colors duration-300 select-none ${activeMode === 'private' ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        <span className="text-base">🔒</span>
                        <span>Private Board</span>
                    </button>
                </div>
            </div>

            {/* ── Panels ── */}
            <div className="relative max-w-2xl mx-auto px-4 pb-24">

                {/* ════ QUICK SHARE PANEL ════ */}
                {activeMode === 'quick' && (
                    <div className="space-y-5 animate-panel-in">
                        {/* Section header */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20">📋</div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Share</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Paste text → get a 4-digit code → share instantly</p>
                            </div>
                        </div>

                        {/* Paste area */}
                        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm">
                            <textarea
                                value={publicText}
                                onChange={e => setPublicText(e.target.value)}
                                placeholder="Paste or type your text here..."
                                className="w-full h-44 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all font-mono"
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {publicText.length} chars · {publicText.split(/\s+/).filter(Boolean).length} words
                                </span>
                                <button
                                    onClick={handlePublicSubmit}
                                    disabled={!publicText.trim() || publicLoading}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    {publicLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    )}
                                    {publicCode ? 'Update' : 'Submit'}
                                </button>
                            </div>
                            {publicError && <p className="text-sm text-red-500 dark:text-red-400">{publicError}</p>}
                        </div>

                        {/* Code display */}
                        {publicCode && (
                            <div className="space-y-4 animate-panel-in">
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 text-center">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Your Share Code</p>
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        {publicCode.split('').map((digit, i) => (
                                            <div key={i} className="w-14 h-16 bg-white dark:bg-gray-900/80 border border-emerald-300 dark:border-emerald-500/30 rounded-xl flex items-center justify-center text-3xl font-black text-emerald-600 dark:text-emerald-400 shadow-md">
                                                {digit}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <button
                                            onClick={() => copyToClipboard(publicCode, setCopiedCode)}
                                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
                                        >
                                            {copiedCode ? (
                                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Copied!</>
                                            ) : (
                                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>Copy Code</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(`${window.location.origin}/c/${publicCode}`, setCopiedLink)}
                                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
                                        >
                                            {copiedLink ? (
                                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Copied!</>
                                            ) : (
                                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>Copy Link</>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{window.location.origin}/c/{publicCode}</p>
                                </div>

                                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/90 dark:bg-white/[0.04] p-5 text-left shadow-sm">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">Use from Terminal</p>
                                            <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">Access this clipboard from the Uvero CLI</h3>
                                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                                You can also access this clipboard directly from your terminal using the Uvero CLI.
                                            </p>
                                        </div>
                                        <Link
                                            to="/cli"
                                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-gray-200 dark:hover:bg-white/[0.08]"
                                        >
                                            CLI Guide
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                        </Link>
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-gray-950/40 p-4 shadow-sm">
                                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Install</p>
                                        <code className="mt-3 block overflow-x-auto rounded-xl bg-gray-950 px-3 py-3 text-sm text-cyan-200">
                                            {CLI_INSTALL_COMMAND}
                                        </code>
                                    </div>

                                    <div className="mt-4">
                                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Examples</p>
                                        <CliCommandList commands={quickShareCliCommands} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Retrieve area */}
                        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Retrieve by Code</h3>
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
                                        className="w-14 h-16 text-center text-2xl font-black bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all shadow-sm"
                                    />
                                ))}
                            </div>
                            <button
                                onClick={handleRetrieve}
                                disabled={codeDigits.join('').length !== 4 || retrieveLoading}
                                className="w-full py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {retrieveLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                        Retrieving...
                                    </span>
                                ) : 'Retrieve →'}
                            </button>
                            {retrieveError && <p className="text-sm text-red-500 dark:text-red-400">{retrieveError}</p>}
                        </div>

                        {/* Retrieved text */}
                        {retrievedText !== null && (
                            <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 animate-panel-in shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Retrieved Text</h3>
                                    <button
                                        onClick={() => copyToClipboard(retrievedText, setCopied)}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
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
                )}

                {/* ════ PRIVATE BOARD PANEL ════ */}
                {activeMode === 'private' && (
                    <div className="space-y-5 animate-panel-in">
                        {/* Section header */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-purple-500/20">🔒</div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Private Board</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Named boards with full editing &amp; sharing features</p>
                            </div>
                        </div>

                        {/* Board name input */}
                        <form onSubmit={handleGoToBoard} className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">Board Name</label>
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-medium select-none">/clipboard/</span>
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
                                        className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                    >
                                        Open →
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Enter a name to create or open a board. Share the URL with others to collaborate.
                            </p>
                        </form>

                        {/* Quick stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl p-3 text-center">
                                <div className="text-2xl mb-1">⏳</div>
                                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Max Retention</div>
                                <div className="text-sm font-black text-purple-600 dark:text-purple-400 mt-0.5">30 Days</div>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3 text-center">
                                <div className="text-2xl mb-1">🔓</div>
                                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Login Required</div>
                                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">None</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3 text-center">
                                <div className="text-2xl mb-1">♾️</div>
                                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Board Limit</div>
                                <div className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">Unlimited</div>
                            </div>
                        </div>

                        {/* Features grid */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Board Features</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {PRIVATE_FEATURES.map((f, i) => (
                                    <div key={i} className={`${f.classes} border rounded-xl p-4 hover:scale-[1.02] active:scale-[0.99] transition-all shadow-sm cursor-default`}>
                                        <span className="text-2xl mb-2.5 block">{f.icon}</span>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{f.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium leading-snug">{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Stats bar ── */}
                <div className="mt-16 flex items-center justify-center gap-8 sm:gap-14 flex-wrap">
                    {[
                        { val: '10,000', label: 'Code Pool' },
                        { val: '0', label: 'Login Required' },
                        { val: '∞', label: 'Board Limit' },
                        { val: '< 1s', label: 'Access Time' },
                    ].map((s, i) => (
                        <div key={i} className="text-center">
                            <div className={`text-2xl font-black bg-clip-text text-transparent ${activeMode === 'quick' ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-gradient-to-r from-purple-400 to-indigo-400'}`}>{s.val}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Animation keyframes */}
            <style>{`
                @keyframes panel-in {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-panel-in { animation: panel-in 0.35s ease-out both; }
            `}</style>
        </div>
    )
}
