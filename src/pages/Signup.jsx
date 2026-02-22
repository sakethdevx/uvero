import React, { useState } from 'react'
import { signUp, signInWithProvider } from '../auth/authService'
import { useNavigate, Link, useLocation } from 'react-router-dom'

export default function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [info, setInfo] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || (typeof window !== 'undefined' ? localStorage.getItem('postAuthRedirect') : null) || '/'

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const { data, error } = await signUp({ email, password })
        setLoading(false)
        if (error) {
            setError(error.message)
            return
        }
        // If Supabase returned a session the user is signed in immediately
        if (data?.session) {
            try { localStorage.removeItem('postAuthRedirect') } catch (e) { }
            navigate(from, { replace: true })
            return
        }

        // Otherwise an email confirmation is required — show a clear message and prompt user to sign in after verification
        setInfo(`A verification email has been sent to ${email}. Please check your inbox and verify your email. After verifying, return here and click "Sign in" to continue.`)
    }

    async function handleProviderSignIn(provider) {
        setLoading(true)
        setError(null)
        const { error } = await signInWithProvider(provider)
        if (error) {
            setError(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Create an account</h1>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {info && <div className="text-green-600 mb-2">{info}</div>}
            {info && (
                <div className="mt-3">
                    <button
                        type="button"
                        onClick={() => navigate('/login', { state: { from: { pathname: from } } })}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        I verified — Sign in
                    </button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                    <span className="text-sm">Email</span>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
                </label>
                <label className="block">
                    <span className="text-sm">Password</span>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" />
                </label>
                <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
                    {loading ? 'Creating...' : 'Create account'}
                </button>
            </form>
            <p className="mt-4 text-sm">Already have an account? <Link to="/login" state={location.state} className="text-blue-600">Sign in</Link></p>

            <div className="mt-8">
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleProviderSignIn('google')}
                        className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        <span className="font-medium">Continue with Google</span>
                    </button>
                    <button
                        type="button"
                        disabled
                        className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg px-4 py-2.5 opacity-60 cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                        <span className="font-medium">Continue with GitHub</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
