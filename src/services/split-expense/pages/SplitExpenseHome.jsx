import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'
import { GUEST_LIMITS, splitApiRequest } from '../api/client'
import AILoader from '../../../components/AILoader'
import { AIInlinePanel, AIServiceShell, CompactServiceHeader } from '../../../components/AIServiceLayout'

function EmptyState({ isGuest }) {
    return (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-white/[0.03] p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No groups yet</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Create your first trip group and start tracking shared expenses instantly.
            </p>
            {isGuest && (
                <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">
                    Guest mode supports {GUEST_LIMITS.maxGroups} groups. Sign in for unlimited groups and advanced split options.
                </p>
            )}
        </div>
    )
}

export default function SplitExpenseHome() {
    const { user, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    useEffect(() => {
        // Only allow signed-in users to use PaySplit. Redirect guests to login.
        if (!authLoading && !user) {
            navigate('/login', { replace: true })
        }
    }, [authLoading, user, navigate])

    const [loadingGroups, setLoadingGroups] = useState(true)
    const [groups, setGroups] = useState([])
    const [error, setError] = useState('')

    const [createLoading, setCreateLoading] = useState(false)
    const [joinLoading, setJoinLoading] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [groupDescription, setGroupDescription] = useState('')
    const [displayName, setDisplayName] = useState('')

    const [joinCode, setJoinCode] = useState('')
    const [joinDisplayName, setJoinDisplayName] = useState('')

    const isGuest = !authLoading && !user

    const loadGroups = useCallback(async () => {
        if (authLoading) return

        setLoadingGroups(true)
        setError('')

        try {
            const response = await splitApiRequest('/api/split/groups', {
                method: 'GET',
                user
            })
            setGroups(response.data || [])
        } catch (err) {
            setError(err.message || 'Failed to load groups')
        } finally {
            setLoadingGroups(false)
        }
    }, [authLoading, user])

    useEffect(() => {
        if (!authLoading) {
            loadGroups()
        }
    }, [authLoading, loadGroups])

    useEffect(() => {
        const join = String(searchParams.get('join') || '').trim().toUpperCase()
        if (join) setJoinCode(join)
    }, [searchParams])

    const guestHint = useMemo(() => {
        if (!isGuest) return null
        return `Guest mode: up to ${GUEST_LIMITS.maxGroups} groups and ${GUEST_LIMITS.maxExpensesPerGroup} expenses per group.`
    }, [isGuest])

    async function handleCreateGroup(event) {
        event.preventDefault()
        if (authLoading) return
        if (!groupName.trim()) return

        setCreateLoading(true)
        setError('')

        try {
            const response = await splitApiRequest('/api/split/groups', {
                method: 'POST',
                user,
                body: {
                    name: groupName,
                    description: groupDescription,
                    currency: 'INR',
                    display_name: displayName
                }
            })

            const createdGroup = response?.data
            if (createdGroup?.id) {
                navigate(`/split-expense/${createdGroup.id}`)
                return
            }

            await loadGroups()
            setGroupName('')
            setGroupDescription('')
        } catch (err) {
            setError(err.message || 'Failed to create group')
        } finally {
            setCreateLoading(false)
        }
    }

    async function handleJoinGroup(event) {
        event.preventDefault()
        if (authLoading) return
        if (!joinCode.trim()) return

        setJoinLoading(true)
        setError('')

        try {
            const response = await splitApiRequest('/api/split/join', {
                method: 'POST',
                user,
                body: {
                    invite_code: joinCode,
                    display_name: joinDisplayName
                }
            })

            const joinedGroupId = response?.data?.group?.id
            if (joinedGroupId) {
                navigate(`/split-expense/${joinedGroupId}`)
                return
            }

            await loadGroups()
        } catch (err) {
            setError(err.message || 'Failed to join group')
        } finally {
            setJoinLoading(false)
            setSearchParams(prev => {
                const next = new URLSearchParams(prev)
                next.delete('join')
                return next
            })
        }
    }

    return (
        <AIServiceShell>
            <CompactServiceHeader
                eyebrow="Split Expense"
                title="Create, join, settle"
                description={isGuest ? guestHint : `Signed in as ${user?.email || 'member'}`}
            />

            <section>
                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="mb-5 grid gap-4 lg:grid-cols-2">
                    <form onSubmit={handleCreateGroup} className="glass-panel p-4 shadow-sm sm:p-5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create a group</h2>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Trips, roommates, parties, and shared plans.</p>

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Group name</label>
                                <input
                                    value={groupName}
                                    onChange={event => setGroupName(event.target.value)}
                                    placeholder="Goa Trip 2026"
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description (optional)</label>
                                <input
                                    value={groupDescription}
                                    onChange={event => setGroupDescription(event.target.value)}
                                    placeholder="Friends trip with stay, food, travel"
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Your display name</label>
                                <input
                                    value={displayName}
                                    onChange={event => setDisplayName(event.target.value)}
                                    placeholder={isGuest ? 'Ex: Saketh' : 'Optional'}
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={createLoading || authLoading}
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {authLoading ? 'Checking session...' : createLoading ? 'Creating...' : 'Create group'}
                            </button>
                        </div>
                    </form>

                    <form onSubmit={handleJoinGroup} className="glass-panel p-4 shadow-sm sm:p-5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Join with invite code</h2>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Paste an invite code and jump into the group.</p>

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Invite code</label>
                                <input
                                    value={joinCode}
                                    onChange={event => setJoinCode(event.target.value.toUpperCase())}
                                    placeholder="TSA1B2C3"
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Your display name</label>
                                <input
                                    value={joinDisplayName}
                                    onChange={event => setJoinDisplayName(event.target.value)}
                                    placeholder={isGuest ? 'Required for guests' : 'Optional'}
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={joinLoading || authLoading}
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-60"
                            >
                                {authLoading ? 'Checking session...' : joinLoading ? 'Joining...' : 'Join group'}
                            </button>

                            {/* Guest recovery removed: PaySplit now requires signed-in users */}
                        </div>
                    </form>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your groups</h2>
                    <button
                        onClick={loadGroups}
                        disabled={authLoading}
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Refresh
                    </button>
                </div>

                {loadingGroups ? (
                    <AIInlinePanel><AILoader mode="shimmer" /></AIInlinePanel>
                ) : groups.length === 0 ? (
                    <EmptyState isGuest={isGuest} />
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {groups.map(group => (
                            <Link
                                key={group.id}
                                to={`/split-expense/${group.id}`}
                                className="group rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-white/[0.08] dark:bg-white/[0.04]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {group.name}
                                        </h3>
                                        <p className="mt-1 text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                            Invite code: {group.invite_code}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-1">
                                        {group.currency}
                                    </span>
                                </div>

                                {group.description && (
                                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                        {group.description}
                                    </p>
                                )}

                                <div className="mt-4 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{group.members_count || 0} members</span>
                                    <span>•</span>
                                    <span>{group.expenses_count || 0} expenses</span>
                                    <span>•</span>
                                    <span className="capitalize">{group.current_member?.role || 'member'}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </AIServiceShell>
    )
}
