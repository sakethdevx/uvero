import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signIn, signUp, signInWithProvider } from '../../auth/authService'
import { checkEmailRegistered } from '../../auth/emailLookupService'
import { checkUsernameAvailability, interpretUsernameAvailability } from '../../auth/usernameService'
import { USERNAME_HELP_TEXT, isUsernameValid, normalizeUsernameInput } from '../../auth/usernameRules'
import AIPageLayout from '../AIPageLayout'
import AuthSocialButtons from './AuthSocialButtons'
import { authInputClass, authLabelClass } from './authInputClass'

const LAST_EMAIL_KEY = 'uvero_last_auth_email'

function readLastEmail() {
    try {
        return window.localStorage.getItem(LAST_EMAIL_KEY) || ''
    } catch {
        return ''
    }
}

function rememberEmail(email) {
    try {
        window.localStorage.setItem(LAST_EMAIL_KEY, email.trim().toLowerCase())
    } catch { /* ignore */ }
}

function EmailChip({ email, onChange }) {
    return (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Email</p>
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{email}</p>
            </div>
            <button
                type="button"
                onClick={onChange}
                className="shrink-0 text-xs font-semibold text-accent dark:text-accent-blue hover:underline"
            >
                Change
            </button>
        </div>
    )
}

function AuthDivider() {
    return (
        <div className="my-6 flex items-center gap-3 opacity-60">
            <div className="flex-1 border-t border-gray-300 dark:border-white/[0.08]" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300 dark:border-white/[0.08]" />
        </div>
    )
}

export default function AuthFlow({
    initialStep = 'email',
    initialEmail = '',
}) {
    const [step, setStep] = useState(initialStep)
    const [email, setEmail] = useState(initialEmail || readLastEmail())
    const [accountExists, setAccountExists] = useState(null)
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [fullName, setFullName] = useState('')
    const [error, setError] = useState(null)
    const [info, setInfo] = useState(null)
    const [loading, setLoading] = useState(false)
    const [usernameChecking, setUsernameChecking] = useState(false)
    const [usernameStatus, setUsernameStatus] = useState({
        tone: 'neutral',
        message: 'Pick your unique username.',
    })

    const navigate = useNavigate()
    const location = useLocation()
    const from =
        location.state?.from?.pathname ||
        (typeof window !== 'undefined' ? localStorage.getItem('postAuthRedirect') : null) ||
        '/'

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedUsername = normalizeUsernameInput(username)
    const isReturningEmail = Boolean(normalizedEmail && readLastEmail() === normalizedEmail)

    useEffect(() => {
        if (initialStep !== 'email') return
        const remembered = readLastEmail()
        if (remembered && !initialEmail) setEmail(remembered)
    }, [initialEmail, initialStep])

    useEffect(() => {
        if ((step === 'sign-in' || step === 'sign-up') && !normalizedEmail) {
            setStep('email')
        }
    }, [step, normalizedEmail])

    useEffect(() => {
        if (!normalizedUsername) {
            setUsernameStatus({ tone: 'neutral', message: 'Pick your unique username.' })
            setUsernameChecking(false)
            return
        }

        const validation = isUsernameValid(normalizedUsername)
        if (!validation.valid) {
            setUsernameStatus({ tone: 'invalid', message: validation.message })
            setUsernameChecking(false)
            return
        }

        let active = true
        const checkedFor = validation.username
        const timer = setTimeout(async () => {
            try {
                setUsernameChecking(true)
                const result = await checkUsernameAvailability(checkedFor)
                if (!active || checkedFor !== normalizeUsernameInput(username)) return
                setUsernameStatus(interpretUsernameAvailability(result))
            } catch {
                if (!active || checkedFor !== normalizeUsernameInput(username)) return
                setUsernameStatus({
                    tone: 'invalid',
                    message: 'Could not check username right now. Please try again.',
                })
            } finally {
                if (active) setUsernameChecking(false)
            }
        }, 300)

        return () => {
            active = false
            clearTimeout(timer)
        }
    }, [normalizedUsername])

    const usernameStatusClass =
        usernameStatus.tone === 'available'
            ? 'text-emerald-600 dark:text-emerald-300'
            : usernameStatus.tone === 'taken' || usernameStatus.tone === 'invalid'
              ? 'text-red-600 dark:text-red-300'
              : 'text-gray-500 dark:text-gray-400'

    function resetMessages() {
        setError(null)
        setInfo(null)
    }

    function goToEmailStep() {
        resetMessages()
        setPassword('')
        setAccountExists(null)
        setStep('email')
    }

    async function continueWithEmail(e) {
        e?.preventDefault()
        resetMessages()
        if (!normalizedEmail) {
            setError('Enter a valid email address.')
            return
        }

        setLoading(true)
        const { exists, error: lookupError } = await checkEmailRegistered(normalizedEmail)
        setLoading(false)

        if (lookupError || exists === null) {
            setError(lookupError || 'Could not verify this email. Please try again.')
            return
        }

        setAccountExists(exists)
        setStep(exists ? 'sign-in' : 'sign-up')
    }

    async function handleSignIn(e) {
        e.preventDefault()
        setLoading(true)
        resetMessages()
        const { error: signInError } = await signIn({ email: normalizedEmail, password })
        setLoading(false)
        if (signInError) {
            const msg = signInError.message || ''
            if (/invalid login credentials/i.test(msg)) {
                setError(
                    "That password didn't match this email. Reset it below, or create an account if you're new here.",
                )
            } else {
                setError(msg)
            }
            return
        }
        rememberEmail(normalizedEmail)
        try {
            localStorage.removeItem('postAuthRedirect')
        } catch { /* ignore */ }
        navigate(from, { replace: true })
    }

    async function handleSignUp(e) {
        e.preventDefault()
        const validation = isUsernameValid(normalizedUsername)
        if (!validation.valid) {
            setError(validation.message)
            return
        }

        setLoading(true)
        resetMessages()

        try {
            const availability = await checkUsernameAvailability(validation.username)
            if (!availability.available) {
                setLoading(false)
                setError(availability.message || 'Username is already taken. Please choose another one.')
                return
            }
        } catch {
            setLoading(false)
            setError('Could not verify username availability. Please try again.')
            return
        }

        const { data, error: signUpError } = await signUp({
            email: normalizedEmail,
            password,
            username: validation.username,
            fullName,
        })
        setLoading(false)
        if (signUpError) {
            if (/already registered|already exists|user already/i.test(signUpError.message || '')) {
                setError('An account with this email already exists. Sign in with your password instead.')
                setStep('sign-in')
            } else {
                setError(signUpError.message)
            }
            return
        }

        rememberEmail(normalizedEmail)

        if (data?.session) {
            try {
                localStorage.removeItem('postAuthRedirect')
            } catch { /* ignore */ }
            navigate(from, { replace: true })
            return
        }

        setInfo(
            `We sent a verification link to ${normalizedEmail}. Your username is @${validation.username}. After verifying, sign in with your password.`,
        )
        setStep('sign-in')
        setPassword('')
    }

    async function handleProviderSignIn(provider) {
        setLoading(true)
        resetMessages()
        const { error: providerError } = await signInWithProvider(provider)
        if (providerError) {
            setError(providerError.message)
            setLoading(false)
        }
    }

    const headerByStep = {
        email: {
            kicker: 'Account',
            title: 'Sign in to Uvero',
            subtitle: 'Enter your email — we’ll route you to sign in or sign up automatically.',
        },
        'sign-in': {
            kicker: 'Welcome back',
            title: isReturningEmail ? 'Welcome back' : 'Enter your password',
            subtitle: 'We found an account for this email. Enter your password to continue.',
        },
        'sign-up': {
            kicker: 'New here',
            title: 'Create your account',
            subtitle: 'No account found for this email yet. Finish setup below.',
        },
    }

    const header = headerByStep[step] || headerByStep.email

    return (
        <AIPageLayout pattern="focused" maxWidth="max-w-md" centerContent={true} backTo="/" backLabel="Back">
            <div className="text-center sm:text-left mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent dark:text-accent-blue">
                    {header.kicker}
                </p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                    {header.title}
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">{header.subtitle}</p>
            </div>

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                </div>
            )}
            {info && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {info}
                </div>
            )}

            {step === 'email' && (
                <>
                    <form onSubmit={continueWithEmail} className="space-y-4">
                        <label htmlFor="auth-email" className="block">
                            <span className={authLabelClass}>Email</span>
                            <input
                                id="auth-email"
                                name="email"
                                type="email"
                                required
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                placeholder="you@example.com"
                                className={authInputClass}
                            />
                        </label>
                        <button type="submit" disabled={loading} className="w-full btn-accent py-3">
                            {loading ? 'Checking…' : 'Continue'}
                        </button>
                    </form>

                    <AuthDivider />
                    <AuthSocialButtons loading={loading} onProviderSignIn={handleProviderSignIn} />
                </>
            )}

            {step === 'sign-in' && (
                <>
                    <EmailChip email={normalizedEmail} onChange={goToEmailStep} />

                    {info && (
                        <button
                            type="button"
                            onClick={() => {
                                resetMessages()
                                document.getElementById('auth-password')?.focus()
                            }}
                            className="mb-4 w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                        >
                            I verified my email — sign in
                        </button>
                    )}

                    <form onSubmit={handleSignIn} className="space-y-4">
                        <label htmlFor="auth-password" className="block">
                            <span className={authLabelClass}>Password</span>
                            <input
                                id="auth-password"
                                name="password"
                                type="password"
                                required
                                autoFocus={!info}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                className={authInputClass}
                            />
                        </label>
                        <button type="submit" disabled={loading} className="w-full btn-accent py-3">
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <div className="mt-4 flex flex-col gap-3 text-center text-xs sm:text-sm">
                        <Link
                            to="/reset-password"
                            state={{ email: normalizedEmail }}
                            className="text-accent dark:text-accent-blue hover:underline transition-all"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <AuthDivider />

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                            resetMessages()
                            setAccountExists(false)
                            setStep('sign-up')
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:hover:bg-white/[0.06]"
                    >
                        New here? Create an account
                    </button>

                    <div className="mt-6">
                        <AuthSocialButtons loading={loading} onProviderSignIn={handleProviderSignIn} />
                    </div>
                </>
            )}

            {step === 'sign-up' && (
                <>
                    <EmailChip email={normalizedEmail} onChange={goToEmailStep} />

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <label htmlFor="auth-name" className="block">
                            <span className={authLabelClass}>Full name</span>
                            <input
                                id="auth-name"
                                name="name"
                                type="text"
                                required
                                autoFocus
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                autoComplete="name"
                                className={authInputClass}
                            />
                        </label>
                        <label htmlFor="auth-username" className="block">
                            <span className={authLabelClass}>Username</span>
                            <input
                                id="auth-username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(normalizeUsernameInput(e.target.value))}
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                placeholder="yourname"
                                className={authInputClass}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{USERNAME_HELP_TEXT}</p>
                            <p className={`mt-1 text-xs ${usernameStatusClass}`}>
                                {usernameChecking ? 'Checking availability…' : usernameStatus.message}
                            </p>
                        </label>
                        <label htmlFor="auth-new-password" className="block">
                            <span className={authLabelClass}>Password</span>
                            <input
                                id="auth-new-password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                className={authInputClass}
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={
                                loading ||
                                usernameChecking ||
                                usernameStatus.tone === 'taken' ||
                                usernameStatus.tone === 'invalid' ||
                                !normalizedUsername
                            }
                            className="w-full btn-accent py-3"
                        >
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => {
                                resetMessages()
                                setAccountExists(true)
                                setStep('sign-in')
                            }}
                            className="text-accent dark:text-accent-blue font-bold hover:underline transition-all"
                        >
                            Sign in instead
                        </button>
                    </p>
                </>
            )}
        </AIPageLayout>
    )
}
