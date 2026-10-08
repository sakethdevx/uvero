// Supabase client wrapper
// Uses environment variables for URL and KEY. See .env.example for names.
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const missingConfigurationError = new Error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication.'
)

function createUnavailableQuery() {
    const query = {
        select: () => query,
        insert: () => query,
        update: () => query,
        upsert: () => query,
        delete: () => query,
        eq: () => query,
        maybeSingle: () => Promise.resolve({ data: null, error: missingConfigurationError }),
        then: (resolve, reject) => Promise.resolve({ data: null, error: missingConfigurationError }).then(resolve, reject),
    }
    return query
}

function createUnavailableClient() {
    return {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: missingConfigurationError }),
            getUser: () => Promise.resolve({ data: { user: null }, error: missingConfigurationError }),
            signUp: () => Promise.resolve({ data: null, error: missingConfigurationError }),
            signInWithPassword: () => Promise.resolve({ data: null, error: missingConfigurationError }),
            signOut: () => Promise.resolve({ error: missingConfigurationError }),
            resetPasswordForEmail: () => Promise.resolve({ data: null, error: missingConfigurationError }),
            signInWithOAuth: () => Promise.resolve({ data: null, error: missingConfigurationError }),
            updateUser: () => Promise.resolve({ data: null, error: missingConfigurationError }),
            onAuthStateChange: () => ({
                data: {
                    subscription: {
                        unsubscribe: () => {},
                    },
                },
            }),
        },
        from: () => createUnavailableQuery(),
    }
}

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            detectSessionInUrl: true
        }
    })
    : createUnavailableClient()

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase is not configured. Authentication is disabled until the Vite environment variables are set.')
}
