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
                <label htmlFor="signup-email" className="block">
                    <span className="text-sm">Email</span>
                    <input id="signup-email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
                <label htmlFor="signup-password" className="block">
                    <span className="text-sm">Password</span>
                    <input id="signup-password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
        </div>
    )
}
