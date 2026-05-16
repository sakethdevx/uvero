import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import RequireAuth from '../auth/RequireAuth'
import { signOut } from '../auth/authService'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'
import { checkUsernameAvailability, updateMyUsername } from '../auth/usernameService'
import { USERNAME_HELP_TEXT, isUsernameValid, normalizeUsernameInput } from '../auth/usernameRules'
import ThemeToggle from '../components/ThemeToggle'
import AIPageLayout from '../components/AIPageLayout'

// guest session storage key removed

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
    const [usernameInput, setUsernameInput] = useState('')
    const [savedUsername, setSavedUsername] = useState('')
    const [isEditingUsername, setIsEditingUsername] = useState(false)
    const [usernameLoading, setUsernameLoading] = useState(true)
    const [usernameChecking, setUsernameChecking] = useState(false)
    const [usernameSaving, setUsernameSaving] = useState(false)
    const [usernameMessage, setUsernameMessage] = useState('')
    const [usernameStatus, setUsernameStatus] = useState({
        tone: 'neutral',
        message: 'Choose your username.'
    })



    // guest session handling removed

    useEffect(() => {
        let active = true

        async function loadProfileUsername() {
            if (!user?.id) {
                setUsernameLoading(false)
                return
            }

            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .maybeSingle()

                if (!active) return

                const currentUsername = normalizeUsernameInput(data?.username || '')
                setSavedUsername(currentUsername)
                setUsernameInput(currentUsername)
                setUsernameStatus({
                    tone: 'neutral',
                    message: currentUsername
                        ? `Current username: @${currentUsername}`
                        : 'Choose your username.'
                })
            } catch {
                if (!active) return
                setUsernameStatus({
                    tone: 'invalid',
                    message: 'Could not load username right now.'
                })
            } finally {
                if (active) setUsernameLoading(false)
            }
        }

        loadProfileUsername()

        return () => {
            active = false
        }
    }, [user?.id])

    useEffect(() => {
        if (usernameLoading) return

        const normalized = normalizeUsernameInput(usernameInput)

        if (!normalized) {
            setUsernameStatus({
                tone: 'invalid',
                message: 'Username is required.'
            })
            setUsernameChecking(false)
            return
        }

        const validation = isUsernameValid(normalized)
        if (!validation.valid) {
            setUsernameStatus({
                tone: 'invalid',
                message: validation.message
            })
            setUsernameChecking(false)
            return
        }

        if (validation.username === savedUsername) {
            setUsernameStatus({
                tone: 'neutral',
                message: `Current username: @${savedUsername}`
            })
            setUsernameChecking(false)
            return
        }

        let active = true
        const timer = setTimeout(async () => {
            try {
                setUsernameChecking(true)
                const result = await checkUsernameAvailability(validation.username, user?.access_token)
                if (!active) return

                if (result.available) {
                    setUsernameStatus({
                        tone: 'available',
                        message: 'Username is available.'
                    })
                } else {
                    setUsernameStatus({
                        tone: 'taken',
                        message: result.message || 'Username is already taken.'
                    })
                }
            } catch {
                if (!active) return
                setUsernameStatus({
                    tone: 'invalid',
                    message: 'Could not check availability right now.'
                })
            } finally {
                if (active) setUsernameChecking(false)
            }
        }, 300)

        return () => {
            active = false
            clearTimeout(timer)
        }
    }, [usernameInput, savedUsername, user?.access_token, usernameLoading])

    async function handleSaveUsername(event) {
        event.preventDefault()
        setUsernameMessage('')

        const normalized = normalizeUsernameInput(usernameInput)
        const validation = isUsernameValid(normalized)

        if (!validation.valid) {
            setUsernameStatus({ tone: 'invalid', message: validation.message })
            return
        }

        if (validation.username === savedUsername) {
            setUsernameMessage('No changes to save.')
            return
        }

        setUsernameSaving(true)
        try {
            const availability = await checkUsernameAvailability(validation.username, user?.access_token)
            if (!availability.available) {
                setUsernameStatus({ tone: 'taken', message: availability.message || 'Username is already taken.' })
                return
            }

            const result = await updateMyUsername(validation.username, user?.access_token)
            const nextUsername = normalizeUsernameInput(result?.username || validation.username)
            setSavedUsername(nextUsername)
            setUsernameInput(nextUsername)
            setUsernameStatus({ tone: 'neutral', message: `Current username: @${nextUsername}` })
            try {
                window.localStorage.removeItem('uvero_username_setup_required')
                window.dispatchEvent(new Event('uvero-username-setup-changed'))
            } catch {
                // ignore
            }
            setUsernameMessage('Username updated successfully.')
            setIsEditingUsername(false)
        } catch (err) {
            setUsernameMessage(err.message || 'Failed to update username')
        } finally {
            setUsernameSaving(false)
        }
    }

    const usernameStatusClass =
        usernameStatus.tone === 'available'
            ? 'text-emerald-600 dark:text-emerald-300'
            : usernameStatus.tone === 'taken' || usernameStatus.tone === 'invalid'
                ? 'text-red-600 dark:text-red-300'
                : 'text-gray-500 dark:text-gray-400'

    async function handleSignOut() {
        await signOut()
        navigate('/', { replace: true })
    }

    // guest claim/recover handlers removed

    if (!user) return null

    return (
        <AIPageLayout pattern="calm" maxWidth="max-w-2xl" backTo="/" backLabel="Back to Hub">
            {/* Header */}
            <div className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent dark:text-accent-blue">Identity</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">Your Profile</h1>
            </div>

            <div className="space-y-10">
                {/* User info section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            {user.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-md"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-3xl font-bold border-2 border-white dark:border-gray-800 shadow-md">
                                    {(user.user_metadata?.full_name || user.email || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-950 flex items-center justify-center shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">
                                {user.user_metadata?.full_name || 'Uvero User'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user.user_metadata?.username ? `@${user.user_metadata.username}` : 'No username set'}
                            </p>
                        </div>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Account Details</p>
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

                    {!isEditingUsername ? (
                        <div 
                            onClick={() => setIsEditingUsername(true)}
                            className="group mt-5 cursor-pointer rounded-2xl border border-gray-200/80 bg-white/85 p-5 shadow-sm transition-all hover:border-primary-300 hover:bg-white dark:border-white/[0.08] dark:bg-gray-950/50 dark:hover:border-white/20 dark:hover:bg-gray-950/80"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-500">Username</p>
                                    <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">
                                        {savedUsername ? `@${savedUsername}` : 'Choose your username'}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:group-hover:bg-primary-900/40">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSaveUsername} className="mt-5 rounded-2xl border border-primary-200 bg-primary-50/30 p-5 shadow-md animate-in fade-in slide-in-from-top-4 duration-500 dark:border-primary-500/20 dark:bg-primary-500/5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-black text-gray-900 dark:text-white">Customize Identity</p>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsEditingUsername(false);
                                        setUsernameInput(savedUsername);
                                        setUsernameMessage('');
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{USERNAME_HELP_TEXT}</p>
                            <div className="mt-4">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                                    <input
                                        value={usernameInput}
                                        onChange={e => setUsernameInput(normalizeUsernameInput(e.target.value))}
                                        autoFocus
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        placeholder="yourname"
                                        className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-4 py-3 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                                    />
                                </div>
                                <p className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${usernameStatusClass}`}>
                                    {usernameChecking ? 'Validating…' : usernameStatus.message}
                                </p>
                            </div>
                            <div className="mt-5 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={usernameLoading || usernameSaving || usernameChecking || usernameStatus.tone === 'invalid' || usernameStatus.tone === 'taken' || usernameInput === savedUsername}
                                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary-600 text-white text-sm font-bold px-4 py-3 hover:bg-primary-700 transition-all disabled:opacity-50 disabled:grayscale"
                                >
                                    {usernameSaving ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Syncing…</span>
                                        </div>
                                    ) : 'Apply Change'}
                                </button>
                            </div>
                            {usernameMessage && (
                                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                                    {usernameMessage}
                                </div>
                            )}
                        </form>
                    )}
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-800" />

                {/* Linked Accounts */}
                {user.user_metadata?.providers && user.user_metadata.providers.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Linked Accounts</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {user.user_metadata.providers.map(provider => (
                                <div
                                    key={provider}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.08] text-sm font-medium text-gray-700 dark:text-gray-300 capitalize"
                                >
                                    {provider === 'google' && (
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-1.92 5.36-7.84 5.36-5.12 0-9.28-4.24-9.28-9.52s4.16-9.52 9.28-9.52c2.92 0 4.88 1.2 6 2.28l2.56-2.48C19.24 1.84 16.12 0 12.48 0 5.8 0 0 5.8 0 12.48s5.8 12.48 12.48 12.48c6.96 0 11.6-4.88 11.6-11.8 0-.8-.08-1.4-.2-2.12h-11.4z" />
                                        </svg>
                                    )}
                                    {provider}
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {user.user_metadata?.providers && user.user_metadata.providers.length > 0 && (
                    <div className="h-px bg-gray-200 dark:bg-gray-800" />
                )}

                {/* App Preferences */}
                <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">App Preferences</p>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Appearance</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Customize how Uvero looks on your device.</p>
                            </div>
                            <ThemeToggle />
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs font-medium">Settings are automatically synced to your account</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-800" />

                {/* Sign out */}
                <div>
                    <button
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200/80 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Disconnect Session
                    </button>
                </div>
            </div>
        </AIPageLayout>
    )
}
