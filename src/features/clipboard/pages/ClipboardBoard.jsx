/* eslint-disable */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import QRCode from 'qrcode'

const LANGUAGES = [
    'plaintext', 'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
    'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'sql', 'json',
    'yaml', 'xml', 'markdown', 'bash', 'powershell', 'dockerfile', 'toml'
]

const EXPIRE_OPTIONS = [
    { label: '1 Hour', value: '1h' },
    { label: '24 Hours', value: '24h' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
]

export default function ClipboardBoard() {
    const { boardId } = useParams()

    /* ── State ── */
    const [content, setContent] = useState('')
    const [language, setLanguage] = useState('plaintext')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [isNew, setIsNew] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const [copied, setCopied] = useState(false)
    const [copiedUrl, setCopiedUrl] = useState(false)
    const [viewMode, setViewMode] = useState('edit') // 'edit' | 'preview' | 'split'
    const [darkEditor, setDarkEditor] = useState(true)

    /* ── Settings (visible by default so all options are immediately accessible) ── */
    const [showSettings, setShowSettings] = useState(true)
    const [password, setPassword] = useState('')
    const [burnAfterRead, setBurnAfterRead] = useState(false)
    const [expiresIn, setExpiresIn] = useState('24h')

    /* ── Password prompt ── */
    const [needsPassword, setNeedsPassword] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')
    const [passwordError, setPasswordError] = useState('')

    /* ── QR ── */
    const [qrUrl, setQrUrl] = useState(null)

    /* ── Refs ── */
    const saveTimer = useRef(null)
    const textareaRef = useRef(null)

    /* ── Board URL ── */
    const boardUrl = typeof window !== 'undefined' ? `${window.location.origin}/clipboard/${boardId}` : ''

    /* ── Load board ── */
    const loadBoard = useCallback(async (pwd) => {
        setLoading(true)
        setError('')
        try {
            const url = `/api/clipboard?board=${encodeURIComponent(boardId)}${pwd ? `&password=${encodeURIComponent(pwd)}` : ''}`
            const resp = await fetch(url)
            const data = await resp.json()

            if (resp.status === 403 && data.needsPassword) {
                setNeedsPassword(true)
                setLoading(false)
                return
            }
            if (resp.status === 404) {
                setIsNew(true)
                setContent('')
                setLoading(false)
                return
            }
            if (!resp.ok) throw new Error(data.error || 'Failed to load board')

            setContent(data.data.content || '')
            setLanguage(data.data.language || 'plaintext')
            setBurnAfterRead(data.data.burn_after_read || false)
            setNeedsPassword(false)
            setIsNew(false)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [boardId])

    useEffect(() => { loadBoard() }, [loadBoard])

    /* ── Auto-save (debounced) ── */
    function handleContentChange(newContent) {
        setContent(newContent)
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
            saveBoard(newContent)
        }, 1500)
    }

    /* ── Manual save ── */
    async function saveBoard(text) {
        if (text === undefined) text = content
        setSaving(true)
        try {
            const resp = await fetch('/api/clipboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: text,
                    boardId,
                    type: 'private',
                    language,
                    password: password || undefined,
                    burnAfterRead,
                    expiresIn: expiresIn || undefined,
                })
            })
            const data = await resp.json()
            if (!resp.ok) throw new Error(data.error || 'Save failed')
            setLastSaved(new Date())
            setIsNew(false)
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    /* ── Copy content ── */
    function copyContent() {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function copyUrl() {
        navigator.clipboard.writeText(boardUrl)
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
    }

    /* ── QR Code ── */
    async function generateQR() {
        if (qrUrl) { setQrUrl(null); return }
        try {
            const dataUrl = await QRCode.toDataURL(boardUrl, { width: 256, margin: 2, color: { dark: '#000', light: '#fff' } })
            setQrUrl(dataUrl)
        } catch (e) { console.error('QR generation failed', e) }
    }

    /* ── Download ── */
    function downloadContent() {
        const ext = language === 'markdown' ? '.md' : language === 'json' ? '.json' : language === 'python' ? '.py' : language === 'javascript' ? '.js' : language === 'typescript' ? '.ts' : language === 'html' ? '.html' : language === 'css' ? '.css' : language === 'sql' ? '.sql' : '.txt'
        const blob = new Blob([content], { type: 'text/plain' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${boardId}${ext}`
        a.click()
        URL.revokeObjectURL(a.href)
    }

    /* ── Delete ── */
    async function deleteBoard() {
        if (!window.confirm('Delete this board permanently?')) return
        try {
            await fetch(`/api/clipboard?board=${encodeURIComponent(boardId)}`, { method: 'DELETE' })
            window.location.href = '/clipboard'
        } catch (e) { console.error('Delete failed', e) }
    }

    /* ── Simple markdown renderer ── */
    function renderMarkdown(text) {
        if (!text) return ''
        let html = text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-700/50 px-1.5 py-0.5 rounded text-sm text-emerald-300">$1</code>')
            .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
            .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
            .replace(/\n/g, '<br/>')
        return html
    }

    /* ── Password overlay ── */
    if (needsPassword) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4 transition-colors">
                <div className="max-w-sm w-full bg-gray-50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl p-8 text-center shadow-xl">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 border border-purple-500/20 dark:border-purple-500/30 rounded-2xl flex items-center justify-center text-3xl">🔒</div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Protected Board</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This board is password protected. Enter the password to access it.</p>
                    <input
                        type="password"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') loadBoard(passwordInput) }}
                        placeholder="Enter password"
                        className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-purple-500/50 mb-3 transition-all"
                        autoFocus
                    />
                    {passwordError && <p className="text-sm text-red-500 mb-3">{passwordError}</p>}
                    <button
                        onClick={() => loadBoard(passwordInput)}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all"
                    >
                        Unlock
                    </button>
                    <Link to="/clipboard" className="block mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">← Back to Clipboard</Link>
                </div>
            </div>
        )
    }

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center transition-colors">
                <div className="w-8 h-8 border-2 border-gray-100 dark:border-gray-800 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        )
    }

    /* ── Word/char/line counts ── */
    const charCount = content.length
    const wordCount = content.split(/\s+/).filter(Boolean).length
    const lineCount = content ? content.split('\n').length : 0

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            {/* ── Header ── */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link to="/clipboard" className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold truncate">/{boardId}</h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                {isNew && <span className="text-emerald-400">New board</span>}
                                {saving && <span className="text-yellow-400">Saving...</span>}
                                {lastSaved && !saving && <span>Saved {lastSaved.toLocaleTimeString()}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Language selector */}
                        <select
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-emerald-500/50 max-w-[120px] transition-all"
                        >
                            {LANGUAGES.map(l => <option key={l} value={l} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{l}</option>)}
                        </select>

                        {/* View mode toggle */}
                        <div className="hidden sm:flex bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
                            {['edit', 'preview', 'split'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setViewMode(m)}
                                    className={`px-2.5 py-1.5 text-xs font-semibold transition-all ${viewMode === m ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-inner' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                >
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <button onClick={copyContent} className="p-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all shadow-sm" title="Copy All">
                            {copied ? <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                        </button>

                        <button onClick={copyUrl} className="p-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all shadow-sm" title="Copy URL">
                            {copiedUrl ? <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                        </button>

                        <button onClick={generateQR} className={`p-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg transition-all shadow-sm ${qrUrl ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'}`} title="QR Code">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        </button>

                        <button onClick={downloadContent} className="p-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all shadow-sm" title="Download">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>

                        <button onClick={() => setShowSettings(!showSettings)} className={`p-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg transition-all shadow-sm ${showSettings ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'}`} title="Settings">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                    </div>
                </div>

                {/* QR Code display */}
                {qrUrl && (
                    <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-gray-900/50 py-4 flex items-center justify-center gap-6 shadow-inner">
                        <img src={qrUrl} alt="QR Code" className="w-32 h-32 rounded-xl bg-white p-2 shadow-2xl" />
                        <div className="text-sm">
                            <p className="text-gray-500 dark:text-gray-400 mb-1 font-medium">Scan to access this board</p>
                            <p className="text-xs text-gray-400 dark:text-gray-600 font-mono truncate max-w-[240px]">{boardUrl}</p>
                        </div>
                    </div>
                )}

                {/* Settings panel */}
                {showSettings && (
                    <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-gray-900/50 py-4 px-4 shadow-inner">
                        <div className="max-w-7xl mx-auto grid sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Password Protection</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Leave empty for no password"
                                    className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                                    Expiration <span className="normal-case tracking-normal font-normal text-gray-400 dark:text-gray-500">(max 30 days)</span>
                                </label>
                                <select
                                    value={expiresIn}
                                    onChange={e => setExpiresIn(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 transition-all shadow-sm"
                                >
                                    {EXPIRE_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{o.label}</option>)}
                                </select>
                            </div>
                            <div className="flex items-end gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={burnAfterRead}
                                        onChange={e => setBurnAfterRead(e.target.checked)}
                                        className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500"
                                    />
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-orange-500 transition-colors">🔥 Burn after reading</span>
                                </label>
                                <button
                                    onClick={() => saveBoard()}
                                    className="ml-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* ── Editor ── */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                        {error}
                    </div>
                )}

                <div className={`grid gap-0 ${viewMode === 'split' ? 'grid-cols-2' : ''}`} style={{ minHeight: 'calc(100vh - 180px)' }}>
                    {/* Editor Pane */}
                    {(viewMode === 'edit' || viewMode === 'split') && (
                        <div className={`relative ${viewMode === 'split' ? 'border-r border-gray-100 dark:border-white/5' : ''}`}>
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={e => handleContentChange(e.target.value)}
                                placeholder={isNew ? 'Start typing... Your content will auto-save.' : 'Start typing...'}
                                className={`w-full h-full min-h-[calc(100vh-220px)] p-6 text-sm font-mono resize-none focus:outline-none transition-colors dark:bg-gray-900/30 dark:text-gray-200 dark:placeholder-gray-600 bg-white dark:bg-transparent text-gray-800 placeholder-gray-400`}
                                spellCheck={false}
                            />
                        </div>
                    )}

                    {/* Preview Pane */}
                    {(viewMode === 'preview' || viewMode === 'split') && (
                        <div className="p-6 min-h-[calc(100vh-220px)] overflow-auto bg-gray-50/30 dark:bg-transparent">
                            {language === 'markdown' ? (
                                <div
                                    className="prose dark:prose-invert prose-sm max-w-none text-gray-800 dark:text-gray-200"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                                />
                            ) : (
                                <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                    {content || <span className="text-gray-400 dark:text-gray-600 italic">Nothing here yet...</span>}
                                </pre>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer Stats ── */}
                <div className="sticky bottom-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 py-2.5 px-4 flex items-center justify-between text-[10px] sm:text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-4">
                        <span>{lineCount} lines</span>
                        <span>{wordCount} words</span>
                        <span>{charCount} chars</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400 font-bold">{language}</span>
                        <button onClick={deleteBoard} className="text-red-500/70 hover:text-red-500 transition-colors font-bold uppercase tracking-wider">Delete Board</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
