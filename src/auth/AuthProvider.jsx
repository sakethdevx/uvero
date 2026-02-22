import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'

const AuthContext = createContext()

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
                const newUser = { ...session.user, access_token: session.access_token }
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
            setUser(prev => {
                if (!prev && !newUser) return null
                if (prev && newUser && prev.id === newUser.id && prev.access_token === newUser.access_token) return prev
                return newUser
            })

            // When a user signs in, call server endpoint to ensure a profiles row exists.
            if (event === 'SIGNED_IN' && session?.access_token) {
                try {
                    await fetch('/api/create-profile', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                            email: newUser?.email,
                            full_name: newUser?.user_metadata?.full_name ?? null
                        })
                    })
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
                        } catch (err) {
                            // ignore
                        }
                    }).catch(() => { /* ignore */ })
                }
            } catch (err) {
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

export function useAuth() {
    return useContext(AuthContext)
}
