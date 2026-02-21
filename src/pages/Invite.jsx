import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function InvitePage() {
    const { token } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [status, setStatus] = useState('Joining...')
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!token) {
            setError('Invalid invite token')
            setStatus(null)
            return
        }

        async function join() {
            if (!user) {
                // redirect to login, preserve return path
                navigate('/login', { state: { from: { pathname: `/invite/${token}` } } })
                return
            }
            try {
                setStatus('Joining event...')
                const resp = await fetch('/api/join-event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token || ''}` },
                    body: JSON.stringify({ invite_token: token })
                })
                if (!resp.ok) {
                    const txt = await resp.text()
                    setError(`Failed to join: ${resp.status} ${txt}`)
                    setStatus(null)
                    return
                }
                const d = await resp.json()
                const eventId = d.event_id
                setStatus('Joined! Redirecting...')
                // small delay so user reads the message
                setTimeout(() => {
                    if (eventId) navigate(`/events/${eventId}`)
                    else navigate('/')
                }, 800)
            } catch (e) {
                setError(String(e))
                setStatus(null)
            }
        }

        join()
    }, [token, user])

    return (
        <div className="max-w-md mx-auto p-6 text-center">
            {status && <div className="text-gray-700">{status}</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!status && !error && <div className="text-gray-700">Processing invite...</div>}
        </div>
    )
}
