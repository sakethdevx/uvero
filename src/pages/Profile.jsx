import React from 'react'
import { useAuth } from '../auth/AuthContext'
import RequireAuth from '../auth/RequireAuth'
import { signOut } from '../auth/authService'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
    return (
        <RequireAuth allowGuest={false}>
            <ProfileContent />
        </RequireAuth>
    )
}

function ProfileContent() {
    const { user } = useAuth()
    const navigate = useNavigate()

    async function handleSignOut() {
        await signOut()
        navigate('/', { replace: true })
    }

    if (!user) return null

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Your profile</h1>
            <div className="space-y-2">
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>User ID:</strong> {user.id}</div>
            </div>
            <div className="mt-6">
                <button onClick={handleSignOut} className="bg-red-600 text-white px-4 py-2 rounded">Sign out</button>
            </div>
        </div>
    )
}
