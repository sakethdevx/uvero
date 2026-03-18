import React, { useState } from 'react'
import { signIn, signInWithProvider } from '../auth/authService'
import { useNavigate, useLocation, Link } from 'react-router-dom'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [info, setInfo] = useState(null)
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || (typeof window !== 'undefined' ? localStorage.getItem('postAuthRedirect') : null) || '/'

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const { data, error } = await signIn({ email, password })
        setLoading(false)
        if (error) {
            setError(error.message)
            return
        }
        // clear persisted redirect after navigating
        try { localStorage.removeItem('postAuthRedirect') } catch (e) { }
        navigate(from, { replace: true })
    }

    async function handleProviderSignIn(provider) {
        setLoading(true)
        setError(null)
        const { error } = await signInWithProvider(provider)
        if (error) {
            setError(error.message)
            setLoading(false)
        }
        // Supabase will redirect to the provider, so we don't need to navigate here
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Sign in to Uvero</h1>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {info && <div className="text-gray-700 mb-2">{info}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="login-email" className="block">
                    <span className="text-sm">Email</span>
                    <input id="login-email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
                <label htmlFor="login-password" className="block">
                    <span className="text-sm">Password</span>
                    <input id="login-password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
            <p className="mt-4 text-sm">Need an account? <Link to="/signup" state={location.state} className="text-blue-600">Sign up</Link></p>
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
                        disabled={loading}
                        onClick={() => handleProviderSignIn('discord')}
                        className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.975 14.975 0 0 0 1.293-2.1a.07.07 0 0 0-.038-.098a13.113 13.113 0 0 1-1.872-.892a.072.072 0 0 1-.007-.12a10.149 10.149 0 0 0 .372-.294a.07.07 0 0 1 .073-.01c3.928 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .074.009c.12.098.246.198.373.294a.072.072 0 0 1-.006.12a12.296 12.296 0 0 1-1.873.892a.077.077 0 0 0-.037.099a14.107 14.107 0 0 0 1.294 2.1a.078.078 0 0 0 .084.028a19.963 19.963 0 0 0 6.002-3.03a.079.079 0 0 0 .033-.057c.572-4.974-.96-9.289-4.063-13.623a.061.061 0 0 0-.031-.03zM8.98 15.182c-1.177 0-2.148-1.084-2.148-2.412s.964-2.413 2.148-2.413c1.19 0 2.16 1.09 2.148 2.413c0 1.328-.964 2.412-2.148 2.412zm6.04 0c-1.177 0-2.148-1.084-2.148-2.412s.964-2.413 2.148-2.413c1.19 0 2.16 1.09 2.148 2.413c0 1.328-.960 2.412-2.148 2.412z" />
                        </svg>
                        <span className="font-medium">Continue with Discord</span>
                    </button>
                </div>
            </div>

            <div className="mt-4 flex justify-between items-center text-sm">
                <Link to="/reset-password" className="text-blue-600">Forgot password?</Link>
                <span>Need an account? <Link to="/signup" state={location.state} className="text-blue-600">Sign up</Link></span>
            </div>
        </div>
    )
}
