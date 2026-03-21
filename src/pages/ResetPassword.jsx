import React, { useState } from 'react'
import { resetPassword } from '../auth/authService'

export default function ResetPassword() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(false)

    async function handleRequest(e) {
        e.preventDefault()
        setLoading(true)
        setStatus(null)
        try {
            const { data, error } = await resetPassword(email)
            if (error) {
                setStatus({ type: 'error', message: error.message })
            } else {
                setStatus({ type: 'success', message: 'If an account exists, a password reset email has been sent.' })
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            {/* Background decorations */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-[-8rem] top-20 h-72 w-72 rounded-full bg-primary-500/8 blur-3xl" />
                <div className="absolute right-[-6rem] bottom-20 h-80 w-80 rounded-full bg-blue-500/8 blur-3xl" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
                <div className="w-full max-w-md">
                    <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-primary-50 via-white to-blue-50 p-8 shadow-xl shadow-primary-100/40 dark:border-white/[0.08] dark:from-primary-500/10 dark:via-gray-950 dark:to-blue-500/10 dark:shadow-none">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-300">Uvero</p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white">Reset password</h1>
                        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Enter your email and we&apos;ll send a reset link.</p>

                        {status && (
                            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${status.type === 'error'
                                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                            }`}>
                                {status.message}
                            </div>
                        )}

                        <form onSubmit={handleRequest} className="mt-6 space-y-4">
                            <div className="rounded-2xl border border-gray-200/80 bg-white/85 p-5 shadow-sm dark:border-white/[0.08] dark:bg-gray-950/50">
                                <label className="block">
                                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">Email address</span>
                                    <input
                                        type="email" required
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-gray-900/60 dark:text-white dark:focus:border-primary-500"
                                    />
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-60"
                            >
                                {loading ? 'Sending…' : 'Send reset email'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
