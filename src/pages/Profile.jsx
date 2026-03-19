import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import RequireAuth from '../auth/RequireAuth'
import { signOut } from '../auth/authService'
import { useNavigate } from 'react-router-dom'
import { splitApiRequest } from '../features/split-expense/api/client'

const GUEST_SESSION_STORAGE_KEY = 'uvero_split_guest_session'

export default function Profile() {
    return (
        <RequireAuth allowGuest={false}>
            <ProfileContent />
        </RequireAuth>
    )
}

function ProfileContent() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [tripSplitLoading, setTripSplitLoading] = useState(false)
    const [tripSplitMessage, setTripSplitMessage] = useState('')
    const [guestSession, setGuestSession] = useState('')

    const [recoverInviteCode, setRecoverInviteCode] = useState('')
    const [recoverCode, setRecoverCode] = useState('')
    const [recoverDisplayName, setRecoverDisplayName] = useState('')

    useEffect(() => {
        if (typeof window === 'undefined') return
        setGuestSession(window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY) || '')
    }, [])

    async function handleSignOut() {
        await signOut()
        navigate('/', { replace: true })
    }

    async function handleClaimGuestData() {
        setTripSplitLoading(true)
        setTripSplitMessage('')

        try {
            const currentGuestSession = typeof window !== 'undefined'
                ? String(window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY) || '').trim()
                : ''

            if (!currentGuestSession) {
                setTripSplitMessage('No guest browser session found to claim.')
                return
            }

            const response = await splitApiRequest('/api/split/claim-guest', {
                method: 'POST',
                user,
                body: {
                    guest_session: currentGuestSession
                }
            })

            const result = response?.data || {}
            const skippedCount = Array.isArray(result.skipped_groups) ? result.skipped_groups.length : 0
            setTripSplitMessage(
                `Claim complete: ${result.claimed_memberships || 0} memberships linked, ${result.merged_groups || 0} merged, ${skippedCount} skipped.`
            )
            setGuestSession(currentGuestSession)
        } catch (err) {
            setTripSplitMessage(err.message || 'Failed to claim guest data')
        } finally {
            setTripSplitLoading(false)
        }
    }

    async function handleRecoverGroup(event) {
        event.preventDefault()
        setTripSplitLoading(true)
        setTripSplitMessage('')

        try {
            const response = await splitApiRequest('/api/split/recover', {
                method: 'POST',
                user,
                body: {
                    invite_code: recoverInviteCode,
                    recovery_code: recoverCode,
                    display_name: recoverDisplayName
                }
            })

            const groupId = response?.data?.group?.id
            const claimedOwner = !!response?.data?.claimed_owner

            if (groupId) {
                setTripSplitMessage(claimedOwner
                    ? 'Recovery complete. Ownership claimed for this group.'
                    : 'Recovery complete. Group linked to your account.')
                navigate(`/split-expense/${groupId}`)
                return
            }

            setTripSplitMessage('Recovery completed, but group route was not returned.')
        } catch (err) {
            setTripSplitMessage(err.message || 'Failed to recover group')
        } finally {
            setTripSplitLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Your profile</h1>
            <div className="space-y-2">
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>User ID:</strong> {user.id}</div>
            </div>

            <div className="mt-8 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">PaySplit account protection</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Link guest browser data to this account, or recover with invite + recovery code.
                </p>

                <div className="mt-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 p-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Claim from this browser</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-all">
                        Guest session: {guestSession || 'not found'}
                    </p>
                    <button
                        onClick={handleClaimGuestData}
                        disabled={tripSplitLoading || !guestSession}
                        className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-semibold px-3 py-2 hover:bg-blue-700 disabled:opacity-60"
                    >
                        {tripSplitLoading ? 'Processing...' : 'Claim Guest Data'}
                    </button>
                </div>

                <form onSubmit={handleRecoverGroup} className="mt-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 p-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Recover by invite + code</p>
                    <div className="mt-3 space-y-2">
                        <input
                            value={recoverInviteCode}
                            onChange={event => setRecoverInviteCode(event.target.value.toUpperCase())}
                            placeholder="Invite code (e.g. TSAB12CD)"
                            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                        <input
                            value={recoverCode}
                            onChange={event => setRecoverCode(event.target.value.toUpperCase())}
                            placeholder="Recovery code"
                            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2 text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                        <input
                            value={recoverDisplayName}
                            onChange={event => setRecoverDisplayName(event.target.value)}
                            placeholder="Display name in group (optional)"
                            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={tripSplitLoading || !recoverInviteCode.trim() || !recoverCode.trim()}
                        className="mt-3 inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white text-sm font-semibold px-3 py-2 hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {tripSplitLoading ? 'Processing...' : 'Recover Group'}
                    </button>
                </form>

                {tripSplitMessage && (
                    <div className="mt-3 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                        {tripSplitMessage}
                    </div>
                )}
            </div>

            <div className="mt-6">
                <button onClick={handleSignOut} className="bg-red-600 text-white px-4 py-2 rounded">Sign out</button>
            </div>
        </div>
    )
}
