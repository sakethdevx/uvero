// Centralized auth service for Supabase
// Exposes helpers used across the app: signIn, signUp, signOut, getUser, requireAuth
import { supabase } from '../lib/supabase/client'

export async function signUp({ email, password, username }) {
    const normalizedUsername = String(username || '').trim().toLowerCase()
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: normalizedUsername ? { username: normalizedUsername } : undefined
        }
    })
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

export async function updateUserSettings(userId, settings) {
    const { data, error } = await supabase
        .from('profiles')
        .update({ settings })
        .eq('id', userId)
    return { data, error }
}

export async function getUserSettings(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', userId)
        .maybeSingle()
    return { data, error }
}
