import React, { useState } from 'react'
import { signUp } from '../auth/authService'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [info, setInfo] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

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
            navigate('/', { replace: true })
            return
        }

        // Otherwise an email confirmation is required — show a clear message instead of silently redirecting
        setInfo(`A verification email has been sent to ${email}. Please check your inbox and verify your email before signing in.`)
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Create an account</h1>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {info && <div className="text-green-600 mb-2">{info}</div>}
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
            <p className="mt-4 text-sm">Already have an account? <Link to="/login" className="text-blue-600">Sign in</Link></p>
        </div>
    )
}
