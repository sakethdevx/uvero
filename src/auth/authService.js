// Centralized auth service for Supabase
// Exposes helpers used across the app: signIn, signUp, signOut, getUser, requireAuth
import { supabase } from '../lib/supabase/client'

export async function signUp({ email, password }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
}

export async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
}

export async function signOut() {
    return await supabase.auth.signOut()
}

export function getUser() {
    return supabase.auth.getUser()
}

// requireAuth is a helper that throws if no user is present; pages can use it to guard server-side logic
export async function requireAuth() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!data?.user) throw new Error('UNAUTHORIZED')
    return data.user
}

// Scaffold for password reset and future OAuth
export async function resetPassword(email) {
    return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
    })
}

export async function signInWithProvider(provider) {
    return await supabase.auth.signInWithOAuth({ provider })
}
