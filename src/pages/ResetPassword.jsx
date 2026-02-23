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
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Reset your password</h1>
            {status && (
                <div className={status.type === 'error' ? 'text-red-600 mb-2' : 'text-green-600 mb-2'}>{status.message}</div>
            )}
            <form onSubmit={handleRequest} className="space-y-4">
                <label className="block mb-4">
                    <span className="text-sm block mb-1">Email address</span>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
                <button type="submit" disabled={loading} className="bg-yellow-600 text-white px-4 py-2 rounded">
                    {loading ? 'Sending...' : 'Send reset email'}
                </button>
            </form>
        </div>
    )
}
