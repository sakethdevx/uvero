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
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            {/* Background decorations */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-primary-500/8 blur-3xl" />
                <div className="absolute right-[-6rem] top-8 h-80 w-80 rounded-full bg-blue-500/8 blur-3xl" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
            </div>

            <div className="relative max-w-2xl mx-auto px-4 pt-12 pb-20 sm:px-6">
                {/* Header */}
                <div className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-300">Account</p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight">Your Profile</h1>
                </div>

                {/* User info card */}
                <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-primary-50 via-white to-blue-50 p-6 shadow-xl shadow-primary-100/40 dark:border-white/[0.08] dark:from-primary-500/10 dark:via-gray-950 dark:to-blue-500/10 dark:shadow-none">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Signed in as</p>
                    <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 w-16">Email</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 w-16">User ID</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">{user.id}</span>
                        </div>
                    </div>
                </div>

                {/* PaySplit section */}
                <div className="mt-5 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">PaySplit</p>
                    <h2 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">Account protection</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Link guest browser data to this account, or recover with invite + recovery code.
                    </p>

                    {/* Claim from browser */}
                    <div className="mt-5 rounded-2xl border border-gray-200/80 bg-white/85 p-5 shadow-sm dark:border-white/[0.08] dark:bg-gray-950/50">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Claim from this browser</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-all">
                            Guest session: <span className="font-mono">{guestSession || 'not found'}</span>
                        </p>
                        <button
                            onClick={handleClaimGuestData}
                            disabled={tripSplitLoading || !guestSession}
                            className="mt-3 inline-flex items-center justify-center rounded-xl bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-primary-700 transition-colors disabled:opacity-60"
                        >
                            {tripSplitLoading ? 'Processing…' : 'Claim Guest Data'}
                        </button>
                    </div>

                    {/* Recover by code */}
                    <form onSubmit={handleRecoverGroup} className="mt-4 rounded-2xl border border-gray-200/80 bg-white/85 p-5 shadow-sm dark:border-white/[0.08] dark:bg-gray-950/50">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Recover by invite + code</p>
                        <div className="mt-3 space-y-2">
                            {[
                                { value: recoverInviteCode, onChange: e => setRecoverInviteCode(e.target.value.toUpperCase()), placeholder: 'Invite code (e.g. TSAB12CD)' },
                                { value: recoverCode, onChange: e => setRecoverCode(e.target.value.toUpperCase()), placeholder: 'Recovery code', extraClass: 'tracking-wider' },
                                { value: recoverDisplayName, onChange: e => setRecoverDisplayName(e.target.value), placeholder: 'Display name in group (optional)' },
                            ].map((field, i) => (
                                <input
                                    key={i}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder={field.placeholder}
                                    className={`w-full rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-gray-900/60 dark:text-white dark:placeholder-gray-500 ${field.extraClass || ''}`}
                                />
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={tripSplitLoading || !recoverInviteCode.trim() || !recoverCode.trim()}
                            className="mt-3 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-emerald-700 transition-colors disabled:opacity-60"
                        >
                            {tripSplitLoading ? 'Processing…' : 'Recover Group'}
                        </button>
                    </form>

                    {tripSplitMessage && (
                        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                            {tripSplitMessage}
                        </div>
                    )}
                </div>

                {/* Sign out */}
                <div className="mt-5">
                    <button
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200/80 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    )
}
