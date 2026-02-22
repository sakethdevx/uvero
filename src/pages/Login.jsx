import React, { useState } from 'react'
import { signIn } from '../auth/authService'
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

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Sign in to Uvero</h1>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {info && <div className="text-gray-700 mb-2">{info}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                    <span className="text-sm">Email</span>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
                </label>
                <label className="block">
                    <span className="text-sm">Password</span>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" />
                </label>
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
            <p className="mt-4 text-sm">Need an account? <Link to="/signup" state={location.state} className="text-blue-600">Sign up</Link></p>
            <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Or continue with (coming soon)</div>
                <div className="flex gap-2">
                    <button disabled onClick={() => setInfo('OAuth providers will be available soon')} className="flex-1 border rounded px-3 py-2 opacity-60 cursor-not-allowed">Google</button>
                    <button disabled onClick={() => setInfo('OAuth providers will be available soon')} className="flex-1 border rounded px-3 py-2 opacity-60 cursor-not-allowed">GitHub</button>
                </div>
            </div>

            <div className="mt-4 flex justify-between items-center text-sm">
                <Link to="/reset-password" className="text-blue-600">Forgot password?</Link>
                <span>Need an account? <Link to="/signup" state={location.state} className="text-blue-600">Sign up</Link></span>
            </div>
        </div>
    )
}
