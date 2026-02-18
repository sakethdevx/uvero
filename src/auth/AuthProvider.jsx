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

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null)
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
