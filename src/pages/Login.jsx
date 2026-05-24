import { useLocation } from 'react-router-dom'
import AuthFlow from '../components/auth/AuthFlow'

export default function Login() {
    const location = useLocation()
    const initialEmail = (location.state?.email || '').trim()

    return <AuthFlow initialStep="email" initialEmail={initialEmail} />
}
