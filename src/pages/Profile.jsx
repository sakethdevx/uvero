import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import RequireAuth from '../auth/RequireAuth'
import { signOut } from '../auth/authService'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/client'
import { checkUsernameAvailability, interpretUsernameAvailability, updateMyUsername } from '../auth/usernameService'
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
    const [copiedField, setCopiedField] = useState('')

    const handleCopy = (text, fieldName) => {
        try {
            navigator.clipboard.writeText(text)
            setCopiedField(fieldName)
            setTimeout(() => setCopiedField(''), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

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
        const checkedFor = validation.username
        const timer = setTimeout(async () => {
            try {
                setUsernameChecking(true)
                const result = await checkUsernameAvailability(checkedFor, user?.access_token)
                if (!active || checkedFor !== normalizeUsernameInput(usernameInput)) return
                setUsernameStatus(interpretUsernameAvailability(result))
            } catch {
                if (!active || checkedFor !== normalizeUsernameInput(usernameInput)) return
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
        <AIPageLayout pattern="calm" maxWidth="max-w-4xl" backTo="/" backLabel="Back to Hub">
            {/* Header */}
            <div className="mb-8 animate-fade-in-down">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent dark:text-accent-blue">Identity</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">Your Profile</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-start">
                
                {/* Left Column: User Profile Identity Card */}
                <div className="col-span-1 md:col-span-5 space-y-6 animate-panel-in">
                    <div className="glass-subtle p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
                        {/* Decorative background blur bubbles */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-accent/10 dark:bg-accent-blue/5 filter blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary-500/10 dark:bg-primary-500/5 filter blur-3xl pointer-events-none" />

                        {/* Avatar container */}
                        <div className="relative group">
                            {user.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-gray-800 shadow-md transition-transform group-hover:scale-105 duration-300"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-3xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-4xl font-bold border-4 border-white dark:border-gray-800 shadow-md transition-transform group-hover:scale-105 duration-300">
                                    {(user.user_metadata?.full_name || user.email || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-950 flex items-center justify-center shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            </div>
                        </div>

                        {/* User Display Name */}
                        <h2 className="mt-4 text-xl font-black text-gray-900 dark:text-white tracking-tight">
                            {user.user_metadata?.full_name || 'Uvero User'}
                        </h2>

                        {/* Username handle display */}
                        <div className="mt-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100 dark:bg-primary-950/40 dark:text-primary-400 dark:border-primary-900/40">
                                <span className="opacity-60 text-[10px] font-bold">@</span>
                                {savedUsername || 'no-username'}
                            </span>
                        </div>

                        {/* Username inline edit button */}
                        {!isEditingUsername ? (
                            <button 
                                onClick={() => setIsEditingUsername(true)}
                                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-white hover:border-accent hover:text-accent dark:border-white/[0.08] dark:bg-gray-950/50 dark:text-gray-300 dark:hover:bg-gray-950 dark:hover:border-accent-blue dark:hover:text-accent-blue transition-all duration-200 shadow-sm"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Customize ID
                            </button>
                        ) : (
                            <form onSubmit={handleSaveUsername} className="w-full mt-6 text-left border-t border-gray-100 dark:border-white/[0.06] pt-5 animate-in fade-in slide-in-from-top-3 duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">New Handle</p>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setIsEditingUsername(false);
                                            setUsernameInput(savedUsername);
                                            setUsernameMessage('');
                                        }}
                                        className="text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">@</span>
                                    <input
                                        value={usernameInput}
                                        onChange={e => setUsernameInput(normalizeUsernameInput(e.target.value))}
                                        autoFocus
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        placeholder="username"
                                        className="w-full rounded-xl border border-gray-200 bg-white/80 pl-8 pr-3 py-2.5 text-sm text-gray-900 transition-all focus:border-accent focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent/5 dark:border-white/10 dark:bg-gray-900/60 dark:text-white dark:focus:border-accent-blue dark:focus:ring-accent-blue/5"
                                    />
                                </div>
                                <p className={`mt-2 text-[9px] font-bold uppercase tracking-wider leading-relaxed ${usernameStatusClass}`}>
                                    {usernameChecking ? 'Checking availability…' : usernameStatus.message}
                                </p>

                                <button
                                    type="submit"
                                    disabled={usernameLoading || usernameSaving || usernameChecking || usernameStatus.tone === 'invalid' || usernameStatus.tone === 'taken' || usernameInput === savedUsername}
                                    className="mt-4 w-full inline-flex items-center justify-center rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wider py-3 hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-accent/10"
                                >
                                    {usernameSaving ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Updating…</span>
                                        </div>
                                    ) : 'Apply Handle'}
                                </button>
                                
                                {usernameMessage && (
                                    <div className="mt-3 rounded-xl border border-blue-200/60 bg-blue-50/50 px-3 py-2.5 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                                        {usernameMessage}
                                    </div>
                                )}
                            </form>
                        )}
                    </div>

                    {/* Disconnect Session Button */}
                    <div className="pt-2">
                        <button
                            onClick={handleSignOut}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200/80 bg-red-50/30 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:border-red-500/30 transition-all shadow-sm"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Disconnect Session
                        </button>
                    </div>
                </div>

                {/* Right Column: User Settings & Preferences */}
                <div className="col-span-1 md:col-span-7 space-y-6 md:space-y-8 animate-panel-in [animation-delay:100ms]">
                    
                    {/* Account Details Panel */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Account Details</p>
                        {/* Email Card */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/40 dark:border-white/[0.04] dark:bg-white/[0.02] hover:border-gray-200 dark:hover:border-white/[0.08] transition-all">
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Email Address</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-0.5" title={user.email}>{user.email}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCopy(user.email, 'email')}
                                className="ml-3 p-1.5 rounded-lg text-gray-400 hover:text-accent dark:text-gray-500 dark:hover:text-accent-blue hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                                aria-label="Copy Email"
                            >
                                {copiedField === 'email' ? (
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Linked Accounts Panel */}
                    {user.user_metadata?.providers && user.user_metadata.providers.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Connected Accounts</p>
                            <div className="flex flex-wrap gap-3">
                                {user.user_metadata.providers.map(provider => (
                                    <div
                                        key={provider}
                                        className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/40 dark:border-white/[0.04] dark:bg-white/[0.02] text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-white/[0.08] transition-all"
                                    >
                                        {provider === 'google' && (
                                            <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-1.92 5.36-7.84 5.36-5.12 0-9.28-4.24-9.28-9.52s4.16-9.52 9.28-9.52c2.92 0 4.88 1.2 6 2.28l2.56-2.48C19.24 1.84 16.12 0 12.48 0 5.8 0 0 5.8 0 12.48s5.8 12.48 12.48 12.48c6.96 0 11.6-4.88 11.6-11.8 0-.8-.08-1.4-.2-2.12h-11.4z" />
                                            </svg>
                                        )}
                                        {provider === 'github' && (
                                            <svg className="w-4 h-4 text-gray-800 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                            </svg>
                                        )}
                                        <span className="capitalize">{provider}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* App Preferences Panel */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">App Preferences</p>
                        <div className="space-y-4">
                            {/* Theme Toggle Card */}
                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/40 dark:border-white/[0.04] dark:bg-white/[0.02] hover:border-gray-200 dark:hover:border-white/[0.08] transition-all">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Appearance</h3>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Customize theme styling on this device.</p>
                                </div>
                                <ThemeToggle />
                            </div>
                            
                            {/* Auto Sync Message */}
                            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50/40 border border-emerald-100/60 text-emerald-800 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:text-emerald-400">
                                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-[11px] font-semibold leading-normal">Preferences and settings automatically sync to your profile</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Added extra padding at the bottom of the content container on mobile to prevent overlapping with BottomNav */}
            <div className="h-16 md:hidden" />
        </AIPageLayout>
    )
}
