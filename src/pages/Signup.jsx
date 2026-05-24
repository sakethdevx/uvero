import { Navigate, useLocation } from 'react-router-dom'

/** Legacy route — unified auth lives at /login */
export default function Signup() {
    const location = useLocation()
    return (
        <Navigate
            to="/login"
            replace
            state={{ ...location.state, flow: 'register' }}
        />
    )
}
