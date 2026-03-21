import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { Link } from 'react-router-dom'

/* ─── Reusable Event Card ─── */
function EventCard({ ev, formatDate, isOwned }) {
    return (
        <Link
            to={`/photodrop/${ev.id}`}
            className={`group relative rounded-3xl border border-gray-200/80 bg-gradient-to-br ${isOwned ? 'from-rose-50 via-white to-pink-50 dark:from-rose-500/10 dark:via-gray-950 dark:to-pink-500/10' : 'from-blue-50 via-white to-indigo-50 dark:from-blue-500/10 dark:via-gray-950 dark:to-indigo-500/10'} p-5 shadow-xl shadow-gray-100/40 dark:border-white/[0.08] dark:shadow-none transition-shadow hover:shadow-2xl`}
        >
            <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] uppercase tracking-[0.3em] font-bold px-2.5 py-1 rounded-full ${isOwned ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                    {isOwned ? '👑 Owner' : '🤝 Guest'}
                </span>
                {ev.event_date && (
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100/80 dark:bg-white/[0.05] px-2 py-1 rounded-lg">
                        {formatDate(ev.event_date)}
                    </span>
                )}
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-1">
                {ev.event_name}
            </h3>

            {ev.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    {ev.description}
                </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-200/80 dark:border-white/[0.08]">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {ev.created_at ? formatDate(ev.created_at) : 'Just now'}
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isOwned ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    Open
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            </div>
        </Link>
    )
}

/* ─── Main Page ─── */
export default function EventsPage() {
    const { user, loading } = useAuth()
    const [events, setEvents] = useState([])
    const [name, setName] = useState('')
    const [desc, setDesc] = useState('')
    const [date, setDate] = useState('')
    const [creating, setCreating] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [fetchError, setFetchError] = useState(null)

    useEffect(() => {
        if (!user) return
        fetch('/api/events', { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
            .then(r => r.json())
            .then(d => setEvents(d.data || []))
            .catch(() => setFetchError('Failed to load events'))
    }, [user])

    async function createEvent(e) {
        e.preventDefault()
        setCreating(true)
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token || ''}` },
                body: JSON.stringify({ event_name: name, description: desc, event_date: date })
            })
            const json = await res.json()
            if (json.data) setEvents([json.data, ...events])
            setName(''); setDesc(''); setDate('')
            setShowForm(false)
        } catch (err) {
            console.error('Create event failed', err)
        } finally {
            setCreating(false)
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return null
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        } catch { return dateStr }
    }

    /* ═══════════════════════════════════════════
       NON-LOGGED-IN LANDING PAGE
       ═══════════════════════════════════════════ */
    if (!loading && !user) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
                {/* ── HERO ── */}
                <div className="relative overflow-hidden">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute left-[-10rem] top-16 h-96 w-96 rounded-full bg-rose-500/8 blur-3xl" />
                        <div className="absolute right-[-8rem] top-8 h-80 w-80 rounded-full bg-purple-500/8 blur-3xl" />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
                    </div>

                    <section className="relative max-w-7xl mx-auto px-4 pt-16 pb-10 sm:px-6 lg:px-8">
                        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.85fr]">
                            <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-rose-50 via-white to-purple-50 p-8 shadow-xl shadow-rose-100/40 dark:border-white/[0.08] dark:from-rose-500/10 dark:via-gray-950 dark:to-purple-500/10 dark:shadow-none sm:p-10">
                                <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-600 dark:text-rose-300">PhotoDrop</p>
                                <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                                    Drop the{' '}
                                    <span className="text-rose-600 dark:text-rose-400">photo hassle.</span>
                                </h1>
                                <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
                                    Upload event photos. AI finds every face. Guests find their photos in seconds — not hours.
                                </p>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700">
                                        Get Started Free
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                    <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/80 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]">
                                        Create Account
                                    </Link>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-gray-200/80 bg-gray-50/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mb-5">Why it works</p>
                                <div className="space-y-4">
                                    {[
                                        { icon: '🤖', title: 'AI Face Detection', desc: 'Automatically clusters faces across all photos.' },
                                        { icon: '⚡', title: '< 5s Matching', desc: 'Guests find all their photos in seconds.' },
                                        { icon: '🆓', title: '100% Free', desc: 'No cost, no ads, no limits.' },
                                    ].map((f, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 text-base">{f.icon}</div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{f.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── HOW IT WORKS — Bento Grid ── */}
                <section className="relative py-24 sm:py-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <span className="text-xs font-bold tracking-[0.2em] uppercase text-rose-500 dark:text-rose-400 mb-4 block">How it works</span>
                            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-5">
                                Three steps. Zero friction.
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-lg font-light">
                                From upload to download — the entire workflow is seamless.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-5">
                            {[
                                {
                                    num: '01',
                                    title: 'Create Event',
                                    desc: "Name your event, set a date, and you're ready. Takes under 10 seconds.",
                                    icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ),
                                    cardClasses: 'bg-rose-50/80 dark:bg-gradient-to-br dark:from-rose-500/18 dark:to-pink-500/10 border-rose-100 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-400/35',
                                    iconBg: 'from-rose-500 to-pink-600',
                                },
                                {
                                    num: '02',
                                    title: 'Upload Photos',
                                    desc: 'Drag & drop your photos. Our AI detects and clusters faces automatically.',
                                    icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                        </svg>
                                    ),
                                    cardClasses: 'bg-violet-50/80 dark:bg-gradient-to-br dark:from-violet-500/18 dark:to-purple-500/10 border-violet-100 dark:border-violet-500/20 hover:border-violet-300 dark:hover:border-violet-400/35',
                                    iconBg: 'from-violet-500 to-purple-600',
                                },
                                {
                                    num: '03',
                                    title: 'Share & Find',
                                    desc: 'Share a QR code. Guests tap a face and instantly find all their photos.',
                                    icon: (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                                        </svg>
                                    ),
                                    cardClasses: 'bg-cyan-50/80 dark:bg-gradient-to-br dark:from-cyan-500/18 dark:to-blue-500/10 border-cyan-100 dark:border-cyan-500/20 hover:border-cyan-300 dark:hover:border-cyan-400/35',
                                    iconBg: 'from-cyan-500 to-blue-600',
                                },
                            ].map((step, idx) => (
                                <div
                                    key={idx}
                                    className={`group relative rounded-3xl border p-8 sm:p-10 transition-all duration-500 hover:-translate-y-1 shadow-xl shadow-gray-200/20 dark:shadow-none ${step.cardClasses}`}
                                >
                                    {/* Step number */}
                                    <div className="text-7xl font-black text-gray-900/[0.03] dark:text-white/[0.04] absolute top-4 right-6 select-none">{step.num}</div>

                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.iconBg} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                        {step.icon}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FEATURES — Glass Bento ── */}
                <section className="relative py-24 sm:py-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <span className="text-xs font-bold tracking-[0.2em] uppercase text-purple-600 dark:text-purple-400 mb-4 block">Packed with power</span>
                            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white">
                                Built for real events
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Feature 1 — large */}
                            <div className="lg:col-span-2 group rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-8 sm:p-10 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all duration-500 hover:border-rose-500/20 relative overflow-hidden shadow-sm">
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors duration-500" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white mb-5 shadow-lg">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Face Recognition</h3>
                                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Automatically detects and clusters faces across all uploaded photos. Guests tap their face to see every photo they appear in.</p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="group rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-8 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all duration-500 hover:border-purple-500/20 shadow-sm">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white mb-5 shadow-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">QR Code Sharing</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">One QR code. Guests scan, join, and browse — no app install needed.</p>
                            </div>

                            {/* Feature 3 */}
                            <div className="group rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-8 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all duration-500 hover:border-cyan-500/20 shadow-sm">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-5 shadow-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Bulk Download</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Download all photos as a ZIP, or just the ones of a specific person.</p>
                            </div>

                            {/* Feature 4 */}
                            <div className="group rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-8 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all duration-500 hover:border-emerald-500/20 shadow-sm">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-5 shadow-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Private & Secure</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Invite-only access. Only people you invite can view or download.</p>
                            </div>

                            {/* Feature 5 */}
                            <div className="group rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-8 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all duration-500 hover:border-amber-500/20 shadow-sm">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white mb-5 shadow-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Smart Compression</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Photos are auto-compressed on upload for fast loading without quality loss.</p>
                            </div>

                            {/* Feature 6 — large */}
                            <div className="lg:col-span-2 group rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-8 sm:p-10 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all duration-500 hover:border-blue-500/20 relative overflow-hidden shadow-sm">
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors duration-500" />
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-5 shadow-lg">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Collaborative Events</h3>
                                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">Everyone can upload. The event owner and all guests can contribute photos, building a complete album together from every angle.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── FINAL CTA ── */}
                <section className="max-w-7xl mx-auto px-4 py-12 pb-20 sm:px-6 lg:px-8">
                    <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-600 to-purple-700 p-8 text-center shadow-xl shadow-rose-500/20 sm:p-12">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-200">Get started</p>
                        <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Ready to make event photos effortless?</h2>
                        <p className="mt-3 text-rose-100 max-w-md mx-auto text-sm leading-relaxed">Create your first event in 10 seconds. Completely free.</p>
                        <div className="mt-8">
                            <Link
                                to="/signup"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-rose-700 shadow-sm transition-colors hover:bg-rose-50"
                            >
                                Start for Free
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    /* ═══════════════════════════════════════════
       LOADING STATE
       ═══════════════════════════════════════════ */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 transition-colors">
                <div className="text-center">
                    <div className="w-14 h-14 border-4 border-rose-100 dark:border-rose-900/30 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Loading your events...</p>
                </div>
            </div>
        )
    }

    /* ═══════════════════════════════════════════
       LOGGED-IN DASHBOARD
       ═══════════════════════════════════════════ */
    const ownedEvents = events.filter(ev => ev.created_by === user.id)
    const joinedEvents = events.filter(ev => ev.created_by !== user.id)

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            {/* Header */}
            <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[-10rem] top-8 h-72 w-72 rounded-full bg-rose-500/8 blur-3xl" />
                    <div className="absolute right-[-8rem] top-4 h-64 w-64 rounded-full bg-purple-500/8 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
                </div>
                <section className="relative max-w-7xl mx-auto px-4 pt-10 pb-8 sm:px-6 lg:px-8">
                    <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-rose-50 via-white to-purple-50 p-6 shadow-xl shadow-rose-100/40 dark:border-white/[0.08] dark:from-rose-500/10 dark:via-gray-950 dark:to-purple-500/10 dark:shadow-none sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-600 dark:text-rose-300">PhotoDrop</p>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">Create events, upload photos, and let AI do the rest.</p>
                            </div>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 self-start sm:self-auto shrink-0"
                            >
                                {showForm ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Cancel
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        New Event
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
                {/* Create Event Form */}
                {showForm && (
                    <div className="mb-8">
                        <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none sm:p-8 max-w-2xl">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mb-4">New event</p>
                            <form onSubmit={createEvent} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-400 mb-1.5">Event Name *</label>
                                    <input
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g. Sarah's Birthday Party"
                                        className="w-full border border-gray-200/80 dark:border-white/[0.08] px-4 py-2.5 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/50 dark:bg-white/5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-400 mb-1.5">Event Date</label>
                                    <input
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        type="date"
                                        className="w-full border border-gray-200/80 dark:border-white/[0.08] px-4 py-2.5 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/50 dark:bg-white/5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-400 mb-1.5">Description</label>
                                    <textarea
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        placeholder="What's the occasion?"
                                        rows={3}
                                        className="w-full border border-gray-200/80 dark:border-white/[0.08] px-4 py-2.5 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none bg-gray-50/50 dark:bg-white/5 text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {creating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Creating...
                                            </>
                                        ) : 'Create Event'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Error */}
                {fetchError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{fetchError}</div>
                )}

                {/* Events */}
                {events.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
                            <span className="text-4xl">📸</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No events yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Create your first event and start sharing photos with AI-powered face recognition.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Create Your First Event
                        </button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* My Events */}
                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <span className="text-base">👑</span>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    My Events
                                    <span className="ml-2 text-sm font-normal text-gray-400">({ownedEvents.length})</span>
                                </h2>
                            </div>

                            {ownedEvents.length === 0 ? (
                                <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08]">
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">You haven't created any events yet</p>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create your first event
                                    </button>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {ownedEvents.map(ev => (
                                        <EventCard key={ev.id} ev={ev} formatDate={formatDate} isOwned={true} />
                                    ))}
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="group flex flex-col items-center justify-center min-h-[180px] rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08] hover:border-rose-300 dark:hover:border-rose-500/30 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-rose-50/30 transition-colors"
                                    >
                                        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200/80 dark:border-white/[0.08] flex items-center justify-center mb-2.5 shadow-sm">
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-rose-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-400 group-hover:text-rose-500 transition-colors">New Event</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Joined Events */}
                        {joinedEvents.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-5">
                                    <span className="text-base">🤝</span>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Joined Events
                                        <span className="ml-2 text-sm font-normal text-gray-400">({joinedEvents.length})</span>
                                    </h2>
                                </div>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {joinedEvents.map(ev => (
                                        <EventCard key={ev.id} ev={ev} formatDate={formatDate} isOwned={false} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
