import React, { useState } from 'react'
import { signIn, signInWithProvider } from '../auth/authService'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import AIPageLayout from '../components/AIPageLayout'

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
        <AIPageLayout pattern="focused" maxWidth="max-w-md" centerContent={true} backTo="/" backLabel="Back">
            {/* Header */}
            <div className="text-center sm:text-left mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent dark:text-accent-blue">Neural OS</p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">Sign In</h1>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Authenticate to sync your session.</p>
            </div>

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                </div>
            )}
            {info && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                    {info}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                                <label htmlFor="login-email" className="block">
                                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">Email</span>
                                    <input
                                        id="login-email" name="email" type="email" required
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        autoComplete="username"
                                        className="mt-1.5 w-full rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-gray-900/60 dark:text-white dark:focus:border-primary-500"
                                    />
                                </label>
                                <label htmlFor="login-password" className="block">
                                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">Password</span>
                                    <input
                                        id="login-password" name="password" type="password" required
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        className="mt-1.5 w-full rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-gray-900/60 dark:text-white dark:focus:border-primary-500"
                                    />
                                </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-accent py-3 mt-2"
                >
                    {loading ? 'Authenticating…' : 'Authenticate'}
                </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3 opacity-60">
                <div className="flex-1 border-t border-gray-300 dark:border-white/[0.08]" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">or connect via</span>
                <div className="flex-1 border-t border-gray-300 dark:border-white/[0.08]" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleProviderSignIn('google')}
                    className="flex-1 flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-surface-1 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                    Google
                </button>
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleProviderSignIn('discord')}
                    className="flex-1 flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-surface-1 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                >
                    <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.975 14.975 0 0 0 1.293-2.1a.07.07 0 0 0-.038-.098a13.113 13.113 0 0 1-1.872-.892a.072.072 0 0 1-.007-.12a10.149 10.149 0 0 0 .372-.294a.07.07 0 0 1 .073-.01c3.928 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .074.009c.12.098.246.198.373.294a.072.072 0 0 1-.006.12a12.296 12.296 0 0 1-1.873.892a.077.077 0 0 0-.037.099a14.107 14.107 0 0 0 1.294 2.1a.078.078 0 0 0 .084.028a19.963 19.963 0 0 0 6.002-3.03a.079.079 0 0 0 .033-.057c.572-4.974-.96-9.289-4.063-13.623a.061.061 0 0 0-.031-.03zM8.98 15.182c-1.177 0-2.148-1.084-2.148-2.412s.964-2.413 2.148-2.413c1.19 0 2.16 1.09 2.148 2.413c0 1.328-.964 2.412-2.148 2.412zm6.04 0c-1.177 0-2.148-1.084-2.148-2.412s.964-2.413 2.148-2.413c1.19 0 2.16 1.09 2.148 2.413c0 1.328-.960 2.412-2.148 2.412z" />
                    </svg>
                    Discord
                </button>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm gap-3">
                <Link to="/reset-password" className="text-accent dark:text-accent-blue hover:underline transition-all">Forgot configuration?</Link>
                <span className="text-gray-500 dark:text-gray-400">
                    No profile? <Link to="/signup" state={location.state} className="text-accent dark:text-accent-blue font-bold hover:underline transition-all">Initialize</Link>
                </span>
            </div>
        </AIPageLayout>
    )
}
