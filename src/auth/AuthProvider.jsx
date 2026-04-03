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

        async function load() {
            const { data } = await supabase.auth.getSession()
            if (!mounted) return
            // Attach access_token to the user object so components can send it in Authorization header
            const session = data?.session ?? null
            if (session) {
                let newUser = { ...session.user, access_token: session.access_token }
                // Try to load profile username and merge into user_metadata so UI can prefer it
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', newUser.id)
                        .maybeSingle()

                    const profileUsername = profile?.username || null
                    if (profileUsername) {
                        newUser = {
                            ...newUser,
                            user_metadata: {
                                ...(newUser.user_metadata || {}),
                                username: profileUsername
                            }
                        }
                    }
                } catch (err) {
                    // ignore profile fetch errors
                }
                setUser(prev => {
                    if (prev && prev.id === newUser.id && prev.access_token === newUser.access_token) return prev
                    return newUser
                })
            } else {
                setUser(null)
            }
            setLoading(false)
        }

        load()

        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const newUser = session ? { ...session.user, access_token: session.access_token } : null
            // Merge profile username into user metadata when available
            let mergedUser = newUser
            if (newUser) {
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', newUser.id)
                        .maybeSingle()

                    const profileUsername = profile?.username || null
                    if (profileUsername) {
                        mergedUser = {
                            ...newUser,
                            user_metadata: {
                                ...(newUser.user_metadata || {}),
                                username: profileUsername
                            }
                        }
                    }
                } catch (err) {
                    // ignore
                }
            }

            setUser(prev => {
                if (!prev && !mergedUser) return null
                if (prev && mergedUser && prev.id === mergedUser.id && prev.access_token === mergedUser.access_token) return prev
                return mergedUser
            })

            // When a user signs in, call server endpoint to ensure a profiles row exists.
            if (event === 'SIGNED_IN' && session?.access_token) {
                try {
                    const response = await fetch('/api/create-profile', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                            email: newUser?.email,
                            full_name: newUser?.user_metadata?.full_name ?? null,
                            username: newUser?.user_metadata?.username ?? null
                        })
                    })
                    const payload = await response.json().catch(() => ({}))

                    const usernameStatus = payload?.username?.status || ''
                    const needsUsernameSetup =
                        usernameStatus === 'taken' ||
                        usernameStatus === 'invalid' ||
                        usernameStatus === 'not-provided'

                    if (response.ok) {
                        setUsernameSetupRequired(needsUsernameSetup)
                    }
                } catch (err) {
                    console.warn('create-profile request failed', err)
                }
            }
        })

        // Listen for cross-tab session changes (verification link may sign-in in another tab)
        function handleStorage(e) {
            try {
                // supabase stores auth info under keys that include 'supabase.auth' or 'supabase.auth.token'
                if (!e.key) return
                if (e.key.includes('supabase.auth') || e.key.includes('SUPABASE')) {
                    // re-check session state
                    supabase.auth.getSession().then(({ data }) => {
                        const session = data?.session ?? null
                        const refreshedUser = session ? { ...session.user, access_token: session.access_token } : null
                        setUser(refreshedUser)

                        // if user just became signed in, and there is a postAuthRedirect saved,
                        // redirect back to it when currently on auth pages.
                        try {
                            const redirect = localStorage.getItem('postAuthRedirect')
                            const path = window.location.pathname || ''
                            if (refreshedUser && redirect && (path === '/signup' || path === '/login' || path.startsWith('/invite') || path === '/')) {
                                // clear and navigate
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

