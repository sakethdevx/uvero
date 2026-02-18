import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Link } from 'react-router-dom'

export default function EventsPage() {
    const { user, loading } = useAuth()
    const [events, setEvents] = useState([])
    const [name, setName] = useState('')
    const [desc, setDesc] = useState('')
    const [date, setDate] = useState('')

    useEffect(() => {
        if (!user) return
        fetch('/api/events', { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
            .then(r => r.json())
            .then(d => setEvents(d.data || []))
    }, [user])

    async function createEvent(e) {
        e.preventDefault()
        const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token || ''}` },
            body: JSON.stringify({ event_name: name, description: desc, event_date: date })
        })
        const json = await res.json()
        if (json.data) setEvents([json.data, ...events])
        setName(''); setDesc(''); setDate('')
    }

    if (loading) return <div>Loading...</div>
    if (!user) return <div>Please sign in to manage events.</div>

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">My Events</h1>
            <form onSubmit={createEvent} className="space-y-3 mb-6">
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="Event name" className="w-full border px-3 py-2" />
                <input value={date} onChange={e => setDate(e.target.value)} type="date" className="border px-3 py-2" />
                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" className="w-full border px-3 py-2" />
                <div><button className="btn-primary">Create Event</button></div>
            </form>

            <div className="grid md:grid-cols-2 gap-4">
                {events.map(ev => (
                    <div key={ev.id} className="p-4 border rounded">
                        <h3 className="font-semibold">{ev.event_name}</h3>
                        <p className="text-sm text-gray-600">{ev.description}</p>
                        <div className="mt-3">
                            <Link to={`/events/${ev.id}`} className="text-blue-600">Open Event</Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
