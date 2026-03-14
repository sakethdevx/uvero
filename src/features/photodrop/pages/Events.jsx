import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { Link } from 'react-router-dom'

/* ─── Reusable Event Card ─── */
function EventCard({ ev, formatDate, isOwned }) {
    const accent = isOwned ? 'rose' : 'blue'
    return (
        <Link
            to={`/photodrop/${ev.id}`}
            className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl dark:hover:shadow-rose-500/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
        >
            {/* Gradient accent bar */}
            <div className={`h-1 bg-gradient-to-r ${isOwned ? 'from-rose-500 via-pink-500 to-purple-600' : 'from-blue-500 via-cyan-500 to-indigo-600'}`} />

            <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${isOwned ? 'from-rose-500 to-purple-600' : 'from-blue-500 to-indigo-600'} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                            <span className="text-white text-lg">{isOwned ? '👑' : '🤝'}</span>
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${isOwned ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                            {isOwned ? 'Owner' : 'Guest'}
                        </span>
                    </div>
                    {ev.event_date && (
                        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                            {formatDate(ev.event_date)}
                        </span>
                    )}
                </div>

                <h3 className={`text-lg font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-1 group-hover:text-${accent}-600 dark:group-hover:text-${accent}-400 transition-colors duration-300`}>
                    {ev.event_name}
                </h3>

                {ev.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                        {ev.description}
                    </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {ev.created_at ? formatDate(ev.created_at) : 'Just now'}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isOwned ? 'text-rose-500' : 'text-blue-500'} group-hover:gap-2 transition-all duration-300`}>
                        Open
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </span>
                </div>
            </div>

            {/* Animated hover gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${isOwned ? 'from-rose-500/5 to-purple-500/5' : 'from-blue-500/5 to-indigo-500/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
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
            <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden transition-colors duration-500">
                {/* ── HERO ── */}
                <section className="relative min-h-[90vh] flex items-center justify-center">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.15),transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.06),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.12),transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.03),transparent_40%)] dark:bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.06),transparent_40%)]" />

                    {/* Floating orbs */}
                    <div className="absolute top-20 left-[10%] w-72 h-72 bg-rose-500/10 rounded-full blur-[100px] animate-blob" />
                    <div className="absolute bottom-20 right-[10%] w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/8 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '4s' }} />

                    {/* Grid pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px'
                    }} />

                    {/* Floating photo frames - decorative */}
                    <div className="absolute top-[15%] right-[8%] w-32 h-40 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm rotate-12 animate-float hidden lg:block shadow-2xl">
                        <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-rose-500/20 to-purple-500/20" />
                        <div className="absolute bottom-3 left-3 right-3 h-2 bg-white/10 rounded-full" />
                    </div>
                    <div className="absolute bottom-[20%] left-[6%] w-28 h-36 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm -rotate-6 animate-float hidden lg:block shadow-2xl" style={{ animationDelay: '1s' }}>
                        <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20" />
                        <div className="absolute bottom-3 left-3 right-3 h-2 bg-white/10 rounded-full" />
                    </div>
                    <div className="absolute top-[40%] right-[18%] w-24 h-28 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm rotate-3 animate-float hidden xl:block shadow-2xl" style={{ animationDelay: '3s' }}>
                        <div className="absolute inset-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20" />
                    </div>

                    {/* Content */}
                    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center z-10">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] backdrop-blur-sm mb-10 animate-fade-in shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse-glow" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wide">Smart Event Photo Sharing</span>
                        </div>

                        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] mb-8 animate-fade-in-up tracking-tight">
                            <span className="block text-gray-900 dark:text-white">Drop the</span>
                            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 dark:from-rose-400 dark:via-pink-400 dark:to-purple-400" style={{ backgroundSize: '200% auto' }}>
                                photo hassle
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up font-light" style={{ animationDelay: '0.15s' }}>
                            Upload event photos. AI finds every face.
                            <br className="hidden sm:block" />
                            Guests find their photos in seconds — not hours.
                        </p>

                        {/* CTA */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                            <Link
                                to="/login"
                                className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-4 px-10 rounded-2xl shadow-2xl shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-1 transition-all duration-300 text-lg overflow-hidden"
                            >
                                <span className="relative z-10">Get Started Free</span>
                                <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </Link>
                            <Link
                                to="/signup"
                                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold py-4 px-8 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/25 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300 shadow-sm"
                            >
                                Create Account
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-10 sm:gap-16 mt-16 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
                            {[
                                { value: 'AI', label: 'Face Detection' },
                                { value: '< 5s', label: 'Photo Matching' },
                                { value: '100%', label: 'Free to Use' },
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-400">{stat.value}</div>
                                    <div className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
                </section>

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
                <section className="relative py-24 sm:py-32">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.08),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.12),transparent_60%)]" />
                    <div className="relative max-w-3xl mx-auto px-4 text-center">
                        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6 text-balance leading-tight">
                            Ready to make event photos
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-400"> effortless</span>?
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 font-light">
                            Create your first event in 10 seconds. Completely free.
                        </p>
                        <Link
                            to="/signup"
                            className="group inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 dark:from-rose-500 dark:to-purple-600 text-white font-bold py-4 px-10 rounded-2xl shadow-2xl shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-1 transition-all duration-300 text-lg"
                        >
                            Start for Free
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
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
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-500">
            {/* Header */}
            <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.1),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.08),transparent_60%)]" />

                <div className="relative max-w-7xl mx-auto px-4 pt-10 pb-10 sm:px-6 lg:px-8 sm:pt-14 sm:pb-14">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                                    <span className="text-xl">📸</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                    Photo<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400">Drop</span>
                                </h1>
                            </div>
                            <p className="text-gray-300 dark:text-gray-400 max-w-md font-light">
                                Create events, upload photos, and let AI do the rest.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="group inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all duration-300 self-start sm:self-auto"
                        >
                            {showForm ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    New Event
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
                {/* Create Event Form */}
                {showForm && (
                    <div className="mb-10 animate-fade-in-down">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 p-6 sm:p-8 max-w-2xl">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                Create New Event
                            </h2>
                            <form onSubmit={createEvent} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-400 mb-1.5">Event Name *</label>
                                    <input
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g. Sarah's Birthday Party"
                                        className="w-full border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:focus:ring-rose-500/10 focus:border-rose-400 transition-all bg-gray-50/50 dark:bg-white/5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-400 mb-1.5">Event Date</label>
                                    <input
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        type="date"
                                        className="w-full border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:focus:ring-rose-500/10 focus:border-rose-400 transition-all bg-gray-50/50 dark:bg-white/5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-400 mb-1.5">Description</label>
                                    <textarea
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        placeholder="What's the occasion?"
                                        rows={3}
                                        className="w-full border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:focus:ring-rose-500/10 focus:border-rose-400 transition-all resize-none bg-gray-50/50 dark:bg-white/5"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-3 px-7 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {creating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Event'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white font-medium py-3 px-4 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
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
                    <div className="text-center py-24">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-rose-50 to-purple-50 dark:from-rose-500/5 dark:to-purple-500/5 flex items-center justify-center border border-rose-100 dark:border-rose-500/20 shadow-lg shadow-rose-100/50 dark:shadow-none">
                            <span className="text-5xl">📸</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No events yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto font-medium">
                            Create your first event and start sharing photos with AI-powered face recognition.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-sm">
                                    <span className="text-white text-sm">👑</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    My Events
                                    <span className="ml-2 text-sm font-normal text-gray-400">({ownedEvents.length})</span>
                                </h2>
                            </div>

                            {ownedEvents.length === 0 ? (
                                <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/5 bg-white/50 dark:bg-white/5">
                                    <p className="text-gray-400 dark:text-gray-500 mb-3">You haven't created any events yet</p>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
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
                                        className="group flex flex-col items-center justify-center min-h-[200px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/5 hover:border-rose-300 dark:hover:border-rose-500/30 bg-white/50 dark:bg-white/5 hover:bg-rose-50/20 dark:hover:bg-rose-500/5 transition-all duration-500 hover:-translate-y-1"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 group-hover:bg-gradient-to-br group-hover:from-rose-100 group-hover:to-purple-100 dark:group-hover:from-rose-500/20 dark:group-hover:to-purple-500/20 flex items-center justify-center mb-3 transition-all duration-500">
                                            <svg className="w-7 h-7 text-gray-400 group-hover:text-rose-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-400 group-hover:text-rose-500 transition-colors">New Event</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Joined Events */}
                        {joinedEvents.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                        <span className="text-white text-sm">🤝</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
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
