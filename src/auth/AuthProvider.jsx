import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { AuthContext } from './AuthContext'

const USERNAME_SETUP_REQUIRED_STORAGE_KEY = 'uvero_username_setup_required'

function setUsernameSetupRequired(value) {
    try {
        if (value) {
            window.localStorage.setItem(USERNAME_SETUP_REQUIRED_STORAGE_KEY, '1')
        } else {
            window.localStorage.removeItem(USERNAME_SETUP_REQUIRED_STORAGE_KEY)
        }
        window.dispatchEvent(new Event('uvero-username-setup-changed'))
    } catch {
        // ignore
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        let currentSessionToken = undefined // Track current token to prevent stale overwrites

        const handleSession = async (session, event) => {
            const token = session?.access_token || null
            currentSessionToken = token // Latest event wins

            if (!session) {
                if (mounted) {
                    setUser(null)
                    setLoading(false)
                }
                return
            }

            let newUser = { ...session.user, access_token: session.access_token }
            
            // Try to load full profile and merge into user_metadata
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, avatar_url, providers, full_name')
                    .eq('id', newUser.id)
                    .maybeSingle()

                if (profile) {
                    newUser = {
                        ...newUser,
                        user_metadata: {
                            ...(newUser.user_metadata || {}),
                            username: profile.username || newUser.user_metadata?.username,
                            avatar_url: profile.avatar_url || newUser.user_metadata?.avatar_url,
                            providers: profile.providers || [],
                            full_name: profile.full_name || newUser.user_metadata?.full_name
                        }
                    }
                }
            } catch (err) {
                console.warn('Profile sync failed:', err)
            }

            // ONLY update React state if this session is still the current active one
            if (mounted && currentSessionToken === token) {
                setUser(prev => {
                    if (prev && prev.id === newUser.id && prev.access_token === newUser.access_token) return prev
                    return newUser
                })
                setLoading(false)
            }
        }

        // 1. Initial Load
        supabase.auth.getSession().then(({ data }) => {
            // Only process if onAuthStateChange hasn't already fired
            if (currentSessionToken === undefined) {
                handleSession(data?.session, 'INITIAL_SESSION')
            }
        }).catch(() => {
            if (mounted && currentSessionToken === undefined) {
                setLoading(false)
            }
        })

        // 2. State Change Listener
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            handleSession(session, event)

            // When a user signs in, call server endpoint to ensure a profiles row exists.
            if (event === 'SIGNED_IN' && session?.access_token) {
                fetch('/api/create-profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        email: session.user?.email,
                        full_name: session.user?.user_metadata?.full_name ?? null,
                        username: session.user?.user_metadata?.username ?? null
                    })
                })
                .then(res => {
                    if (res.ok) {
                        res.json().then(payload => {
                            const usernameStatus = payload?.username?.status || ''
                            const needsUsernameSetup =
                                usernameStatus === 'taken' ||
                                usernameStatus === 'invalid' ||
                                usernameStatus === 'not-provided'
                            setUsernameSetupRequired(needsUsernameSetup)
                        }).catch(() => {})
                    }
                })
                .catch(err => console.warn('create-profile request failed', err))
            }
        })

        // Listen for cross-tab session changes
        function handleStorage(e) {
            try {
                if (!e.key) return
                if (e.key.includes('supabase.auth') || e.key.includes('SUPABASE')) {
                    supabase.auth.getSession().then(({ data }) => {
                        const session = data?.session ?? null
                        handleSession(session, 'STORAGE_CHANGE')

                        // if user just became signed in, handle redirect
                        try {
                            const redirect = localStorage.getItem('postAuthRedirect')
                            const path = window.location.pathname || ''
                            if (session && redirect && (path === '/signup' || path === '/login' || path === '/')) {
                                localStorage.removeItem('postAuthRedirect')
                                window.location.href = redirect
                            }
                        } catch {
                            // ignore
                        }
                    }).catch(() => { /* ignore */ })
                }
            } catch {
                // ignore
            }
        }

        window.addEventListener('storage', handleStorage)

        return () => {
            mounted = false
            listener?.subscription?.unsubscribe()
        }
    }, [])

    const value = { user, loading }
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
