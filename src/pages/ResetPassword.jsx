import React, { useState } from 'react'
import { resetPassword } from '../auth/authService'
import AIPageLayout from '../components/AIPageLayout'

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
        <AIPageLayout pattern="focused" maxWidth="max-w-md" centerContent={true} backTo="/login" backLabel="Back to Login">
            <div className="text-center sm:text-left mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent dark:text-accent-blue">Neural OS</p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">Recover Access</h1>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Enter your identifier to reset credentials.</p>
            </div>

            {status && (
                <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${status.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                }`}>
                    {status.message}
                </div>
            )}

            <form onSubmit={handleRequest} className="space-y-4">
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">Email</span>
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
                    className="w-full btn-accent py-3 mt-2"
                >
                    {loading ? 'Transmitting…' : 'Transmit Reset Link'}
                </button>
            </form>
        </AIPageLayout>
    )
}
