import { useEffect, useState } from 'react'

const AUTO_REFRESH_SECONDS = 45

export default function Maintenance({ config }) {
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [secondsLeft, setSecondsLeft] = useState(AUTO_REFRESH_SECONDS)

    useEffect(() => {
        const { documentElement, body } = document
        const previousHtmlBackground = documentElement.style.backgroundColor
        const previousBodyBackground = body.style.backgroundColor

        documentElement.style.backgroundColor = '#0c0a09'
        body.style.backgroundColor = '#0c0a09'

        return () => {
            documentElement.style.backgroundColor = previousHtmlBackground
            body.style.backgroundColor = previousBodyBackground
        }
    }, [])

    useEffect(() => {
        if (!autoRefresh) return undefined

        const timer = window.setInterval(() => {
            setSecondsLeft(current => {
                if (current <= 1) {
                    window.location.reload()
                    return AUTO_REFRESH_SECONDS
                }
                return current - 1
            })
        }, 1000)

        return () => window.clearInterval(timer)
    }, [autoRefresh])

    function handleRefreshNow() {
        window.location.reload()
    }

    function handleAutoRefreshToggle() {
        setAutoRefresh(current => !current)
        setSecondsLeft(AUTO_REFRESH_SECONDS)
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-100">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_35%),radial-gradient(circle_at_80%_30%,_rgba(234,88,12,0.18),_transparent_30%),linear-gradient(180deg,_#120f0a_0%,_#0c0a09_100%)]" />
                <div className="absolute left-[-8rem] top-20 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
            </div>

            <main className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full">
                    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-orange-950/30 backdrop-blur-2xl sm:p-10">
                        <div className="inline-flex items-center gap-3 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-200">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-200" />
                            </span>
                            Maintenance Mode Active
                        </div>

                        <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                            {config.title}
                        </h1>

                        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-300">
                            {config.message}
                        </p>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">Expected Return</p>
                                <p className="mt-3 text-xl font-bold text-amber-100">{config.eta}</p>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">What Is Paused</p>
                                <p className="mt-3 text-sm leading-relaxed text-stone-300">{config.details}</p>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={handleRefreshNow}
                                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 px-5 py-3 text-sm font-bold text-stone-950 shadow-lg shadow-orange-500/30 transition-transform hover:-translate-y-0.5"
                            >
                                Check Again Now
                            </button>
                            <label className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-stone-200">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={handleAutoRefreshToggle}
                                    className="h-4 w-4 rounded border-white/20 bg-stone-900 text-amber-400 focus:ring-amber-400"
                                />
                                Auto-refresh every {AUTO_REFRESH_SECONDS} seconds
                            </label>
                        </div>

                        <p className="mt-4 text-sm text-stone-400">
                            {autoRefresh ? `Next automatic check in ${secondsLeft}s.` : 'Automatic checks are paused until you turn them back on.'}
                        </p>
                    </section>
                </div>
            </main>
        </div>
    )
}
