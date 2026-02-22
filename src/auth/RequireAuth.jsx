import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

// Wrap routes that require auth; allows guest access if explicit prop `allowGuest` is true
export default function RequireAuth({ children, allowGuest = true }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) return null // or a spinner to avoid flicker

    if (!user && !allowGuest) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}
