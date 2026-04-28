import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'

export default function InvitePage() {
    const { token } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [status, setStatus] = useState(null)
    const [error, setError] = useState(null)
    const [inviteInfo, setInviteInfo] = useState(null)

    useEffect(() => {
        if (!token) {
            setError('Invalid invite token')
            return
        }

        async function fetchInfo() {
            try {
                const resp = await fetch(`/api/invite-info?token=${encodeURIComponent(token)}`)
                if (!resp.ok) {
                    const txt = await resp.text()
                    setError(`Invalid invite: ${resp.status} ${txt}`)
                    return
                }
                const d = await resp.json()
                setInviteInfo(d)
            } catch (e) {
                setError(String(e))
            }
        }

        fetchInfo()
    }, [token])

    async function acceptInvite() {
        if (!user) {
            // persist redirect target so email verification flows (external) can still return
            try { localStorage.setItem('postAuthRedirect', `/invite/${token}`) } catch (e) { /* ignore */ }
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
            setTimeout(() => {
                if (eventId) navigate(`/photodrop/${eventId}`)
                else navigate('/')
            }, 700)
        } catch (e) {
            setError(String(e))
            setStatus(null)
        }
    }

    return (
        <div className="max-w-md mx-auto p-6 text-center">
            {inviteInfo ? (
                <div>
                    <h2 className="text-xl font-semibold mb-2">You're invited</h2>
                    <div className="text-gray-700 mb-4">
                        <span className="font-medium">{inviteInfo.event?.event_name || 'Untitled event'}</span>
                        <div className="text-sm text-gray-500 mt-1">Invited by {inviteInfo.inviter?.email || `user ${inviteInfo.inviter?.id || ''}`}</div>
                    </div>
                    {error && <div className="text-red-600 mb-2">{error}</div>}
                    {status && <div className="text-gray-700 mb-2">{status}</div>}
                    <div className="flex gap-3 justify-center">
                        <button onClick={acceptInvite} className="px-4 py-2 bg-blue-600 text-white rounded">Accept Invite</button>
                        <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-100 rounded">Decline</button>
                    </div>
                </div>
            ) : (
                <div>
                    {error ? <div className="text-red-600">{error}</div> : <div className="text-gray-700">Loading invite...</div>}
                </div>
            )}
        </div>
    )
}
