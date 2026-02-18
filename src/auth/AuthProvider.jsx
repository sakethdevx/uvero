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
            setUser(data?.session?.user ?? null)
            setLoading(false)
        }

        load()

        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)

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
                            email: currentUser?.email,
                            full_name: currentUser?.user_metadata?.full_name ?? null
                        })
                    })
                } catch (err) {
                    console.warn('create-profile request failed', err)
                }
            }
        })

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
