import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { Link } from 'react-router-dom'
import AILoader from '../../../components/AILoader'
import { AIInlinePanel, AIServiceShell, CompactServiceHeader } from '../../../components/AIServiceLayout'

/* ─── Reusable Event Card ─── */
function EventCard({ ev, formatDate, isOwned }) {
    return (
        <Link
            to={`/photodrop/${ev.id}`}
            className={`group relative rounded-xl border border-gray-200/80 bg-gradient-to-br ${isOwned ? 'from-rose-50 via-white to-pink-50 dark:from-rose-500/10 dark:via-gray-950 dark:to-pink-500/10' : 'from-blue-50 via-white to-indigo-50 dark:from-blue-500/10 dark:via-gray-950 dark:to-indigo-500/10'} p-4 shadow-sm dark:border-white/[0.08] dark:shadow-none transition-all hover:-translate-y-0.5 hover:shadow-lg`}
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
            <AIServiceShell maxWidth="max-w-3xl">
                <CompactServiceHeader
                    eyebrow="PhotoDrop"
                    title="Find event photos with AI"
                    description="Sign in to create events, upload photos, and let face matching handle retrieval."
                    actions={(
                        <>
                            <Link to="/login" className="btn-accent text-sm">Sign in</Link>
                            <Link to="/signup" className="suggestion-chip !opacity-100 !animate-none">Create account</Link>
                        </>
                    )}
                />
                <AIInlinePanel>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {['Create event', 'Upload photos', 'Share invite'].map((label) => (
                            <div key={label} className="rounded-xl border border-gray-200 bg-white/70 p-3 text-sm font-semibold text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-200">
                                {label}
                            </div>
                        ))}
                    </div>
                </AIInlinePanel>
            </AIServiceShell>
        )
    }

    /* ═══════════════════════════════════════════
       LOADING STATE
       ═══════════════════════════════════════════ */
    if (loading) {
        return (
            <AIServiceShell maxWidth="max-w-md">
                <AIInlinePanel><AILoader label="Loading your events..." /></AIInlinePanel>
            </AIServiceShell>
        )
    }

    /* ═══════════════════════════════════════════
       LOGGED-IN DASHBOARD
       ═══════════════════════════════════════════ */
    const ownedEvents = events.filter(ev => ev.created_by === user.id)
    const joinedEvents = events.filter(ev => ev.created_by !== user.id)

    return (
        <AIServiceShell>
            <CompactServiceHeader
                eyebrow="PhotoDrop"
                title="Events"
                description="Create events, upload photos, and let AI matching run inside each album."
                actions={(
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="btn-accent text-sm"
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
                )}
            />

            <div className="pb-6">
                {/* Create Event Form */}
                {showForm && (
                    <div className="mb-5">
                        <div className="glass-panel max-w-2xl p-4 shadow-sm sm:p-5">
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
                    <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center dark:border-white/[0.08]">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10">
                            <span className="text-2xl">📸</span>
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
                    <div className="space-y-6">
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
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {joinedEvents.map(ev => (
                                        <EventCard key={ev.id} ev={ev} formatDate={formatDate} isOwned={false} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AIServiceShell>
    )
}
