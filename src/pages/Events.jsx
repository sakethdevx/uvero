import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Link } from 'react-router-dom'

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

    // Not logged in state
    if (!loading && !user) {
        return (
            <div className="min-h-screen">
                {/* Hero for non-logged-in users */}
                <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/80 via-pink-50/40 to-white">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl animate-blob" />
                        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8 sm:pt-24 sm:pb-28">
                        <div className="text-center max-w-4xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 border border-rose-200/60 rounded-full mb-8 animate-fade-in shadow-sm">
                                <span className="text-rose-500">📸</span>
                                <span className="text-sm font-medium text-gray-600">Smart Event Photo Sharing</span>
                            </div>

                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] animate-fade-in-up text-balance">
                                Share event photos{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600">
                                    effortlessly
                                </span>
                            </h1>

                            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-500 mb-10 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
                                Create events, upload photos, and let guests find their pictures with AI-powered face recognition. Share memories with a simple QR code.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    Sign in to Get Started
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center gap-2 bg-white text-gray-800 font-semibold py-3.5 px-8 rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                    Create Free Account
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features for non-logged-in */}
                <section className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <h2 className="section-heading">How PhotoDrop Works</h2>
                        <p className="section-subheading">Three simple steps to share event memories</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                icon: '🎉',
                                title: 'Create an Event',
                                description: 'Set up your event in seconds. Add a name, date, and description.',
                                gradient: 'from-rose-500 to-pink-600',
                            },
                            {
                                step: '02',
                                icon: '📷',
                                title: 'Upload Photos',
                                description: 'Drag & drop photos. AI automatically detects faces and groups them.',
                                gradient: 'from-pink-500 to-purple-600',
                            },
                            {
                                step: '03',
                                icon: '🔗',
                                title: 'Share & Download',
                                description: 'Share a QR code or link. Guests find their photos instantly by face.',
                                gradient: 'from-purple-500 to-indigo-600',
                            },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="group relative p-8 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center"
                            >
                                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                                    {item.step}
                                </div>
                                <div className="text-5xl mb-5 group-hover:scale-110 transition-transform duration-300">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Feature highlights */}
                <section className="bg-gray-50/50 py-20 sm:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: '🤖', title: 'AI Face Recognition', desc: 'Automatically group photos by person' },
                                { icon: '📱', title: 'QR Code Sharing', desc: 'Guests scan to access event photos' },
                                { icon: '📦', title: 'Bulk Download', desc: 'Download all photos as ZIP in one click' },
                                { icon: '🔒', title: 'Private & Secure', desc: 'Only invited guests can access photos' },
                            ].map((f, i) => (
                                <div key={i} className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                    <div className="text-3xl mb-3">{f.icon}</div>
                                    <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                                    <p className="text-sm text-gray-500">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading your events...</p>
                </div>
            </div>
        )
    }

    // Logged in — main dashboard
    return (
        <div className="min-h-screen">
            {/* Header */}
            <section className="bg-gradient-to-b from-rose-50/60 to-white">
                <div className="max-w-7xl mx-auto px-4 pt-10 pb-6 sm:px-6 lg:px-8 sm:pt-14 sm:pb-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <span className="text-white text-xl">📸</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                                    Photo<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600">Drop</span>
                                </h1>
                            </div>
                            <p className="text-gray-500 max-w-md">
                                Create events, share photos, and let guests find themselves with face recognition.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-300 self-start sm:self-auto"
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
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    New Event
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 pb-20 sm:px-6 lg:px-8">
                {/* Create Event Form */}
                {showForm && (
                    <div className="mb-8 animate-fade-in-down">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 max-w-2xl">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                </span>
                                Create New Event
                            </h2>
                            <form onSubmit={createEvent} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Name *</label>
                                    <input
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g. Sarah's Birthday Party"
                                        className="w-full border border-gray-200 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Date</label>
                                    <input
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        type="date"
                                        className="w-full border border-gray-200 px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                    <textarea
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        placeholder="What's the occasion?"
                                        rows={3}
                                        className="w-full border border-gray-200 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {creating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Create Event
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="text-gray-500 hover:text-gray-700 font-medium py-3 px-4 rounded-xl hover:bg-gray-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Error state */}
                {fetchError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {fetchError}
                    </div>
                )}

                {/* Events Grid */}
                {events.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-50 flex items-center justify-center">
                            <span className="text-4xl">📸</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No events yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            Create your first event and start sharing photos with your guests.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Create Your First Event
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">
                                Your Events
                                <span className="ml-2 text-sm font-normal text-gray-400">({events.length})</span>
                            </h2>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {events.map(ev => (
                                <Link
                                    key={ev.id}
                                    to={`/photodrop/${ev.id}`}
                                    className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                                >
                                    {/* Top gradient strip */}
                                    <div className="h-1.5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600" />

                                    <div className="p-6">
                                        {/* Icon + Date */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                                                🎉
                                            </div>
                                            {ev.event_date && (
                                                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                                                    {formatDate(ev.event_date)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-rose-600 transition-colors line-clamp-1">
                                            {ev.event_name}
                                        </h3>

                                        {/* Description */}
                                        {ev.description && (
                                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                                                {ev.description}
                                            </p>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {ev.created_at ? formatDate(ev.created_at) : 'Recently'}
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-500 group-hover:text-rose-600 transition-colors">
                                                Open
                                                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-purple-50 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
                                </Link>
                            ))}

                            {/* Create new — card */}
                            <button
                                onClick={() => setShowForm(true)}
                                className="group flex flex-col items-center justify-center min-h-[200px] rounded-2xl border-2 border-dashed border-gray-200 hover:border-rose-300 bg-white/50 hover:bg-rose-50/30 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 group-hover:bg-rose-100 flex items-center justify-center mb-3 transition-colors duration-300">
                                    <svg className="w-7 h-7 text-gray-400 group-hover:text-rose-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-400 group-hover:text-rose-500 transition-colors">
                                    New Event
                                </span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
