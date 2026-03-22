import { Link } from 'react-router-dom';

const tools = [
    {
        id: 'generator',
        name: 'QR Generator',
        tagline: 'Create QR codes for any purpose',
        description:
            'Generate QR codes for URLs, plain text, email, phone, SMS, WiFi, WhatsApp, UPI, vCard contacts, maps, and more.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
        ),
        gradient: 'from-violet-500 to-purple-600',
        cardBg: 'from-violet-50 via-white to-purple-50 dark:from-violet-500/10 dark:via-gray-950 dark:to-purple-500/10',
        badge: 'Free',
        link: '/qr-tools/generator',
        features: ['URL, WiFi, vCard, UPI', 'Custom colors & logo', 'PNG / SVG export', 'Works offline'],
    },
    {
        id: 'scanner',
        name: 'QR Scanner',
        tagline: 'Decode any QR code instantly',
        description:
            'Scan QR codes using your device camera or upload an image. Decoded output is shown with copy and export actions.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
        ),
        gradient: 'from-sky-500 to-blue-600',
        cardBg: 'from-sky-50 via-white to-blue-50 dark:from-sky-500/10 dark:via-gray-950 dark:to-blue-500/10',
        badge: 'Free',
        link: '/qr-tools/scanner',
        features: ['Camera live scan', 'Upload image to scan', 'Copy decoded text', 'Open URLs directly'],
    },
    {
        id: 'validator',
        name: 'QR Validator',
        tagline: 'Check your QR before you print',
        description:
            'Validate QR codes for contrast, quiet zone, size recommendations, logo safety warnings, and get a basic scan score.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
        ),
        gradient: 'from-emerald-500 to-teal-600',
        cardBg: 'from-emerald-50 via-white to-teal-50 dark:from-emerald-500/10 dark:via-gray-950 dark:to-teal-500/10',
        badge: 'Free',
        link: '/qr-tools/validator',
        features: ['Contrast check', 'Quiet zone check', 'Size recommendations', 'Logo safety warnings'],
    },
    {
        id: 'bulk',
        name: 'Bulk QR Generator',
        tagline: 'Generate hundreds at once',
        description:
            'Upload a CSV or paste a list to generate hundreds of QR codes in one click. Export as ZIP of PNGs or a printable A4 PDF sheet.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
        ),
        gradient: 'from-orange-500 to-amber-600',
        cardBg: 'from-orange-50 via-white to-amber-50 dark:from-orange-500/10 dark:via-gray-950 dark:to-amber-500/10',
        badge: 'Free',
        link: '/qr-tools/bulk',
        features: ['CSV upload or paste list', 'Variable mapping', 'ZIP & A4 PDF export', 'Batch history'],
    },
    {
        id: 'dynamic',
        name: 'Dynamic QR Codes',
        tagline: 'Edit destinations after printing',
        description:
            'Create QR codes whose destination can be changed at any time — without reprinting. Track scan counts and 30-day trends per code.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
        ),
        gradient: 'from-rose-500 to-pink-600',
        cardBg: 'from-rose-50 via-white to-pink-50 dark:from-rose-500/10 dark:via-gray-950 dark:to-pink-500/10',
        badge: 'Sign in required',
        link: '/qr-tools/dynamic',
        features: ['Editable destination URL', 'Scan count tracking', '30-day scan trend', 'Pause / Resume codes'],
    },
    {
        id: 'analytics',
        name: 'QR Analytics',
        tagline: 'Understand your scan performance',
        description:
            'Unified analytics dashboard: 30-day scan trend, country breakdown, top performing codes, and per-code scan history.',
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
        ),
        gradient: 'from-indigo-500 to-blue-600',
        cardBg: 'from-indigo-50 via-white to-blue-50 dark:from-indigo-500/10 dark:via-gray-950 dark:to-blue-500/10',
        badge: 'Sign in required',
        link: '/qr-tools/analytics',
        features: ['30-day scan trend chart', 'Country breakdown', 'Top performing codes', 'CSV export'],
    },
];

const useCases = [
    { icon: '🔗', label: 'Website URL' },
    { icon: '📶', label: 'WiFi Sharing' },
    { icon: '💳', label: 'UPI Payment' },
    { icon: '👤', label: 'vCard Contact' },
    { icon: '💬', label: 'WhatsApp Chat' },
    { icon: '📍', label: 'Google Maps' },
    { icon: '📧', label: 'Email' },
    { icon: '📱', label: 'Phone / SMS' },
    { icon: '📋', label: 'Plain Text' },
    { icon: '📱', label: 'App Store Link' },
    { icon: '🍽️', label: 'Restaurant Menu' },
    { icon: '📅', label: 'Event / Calendar' },
];

export default function QRToolsHome() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            {/* Hero */}
            <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[-10rem] top-16 h-96 w-96 rounded-full bg-violet-500/8 blur-3xl" />
                    <div className="absolute right-[-8rem] top-8 h-80 w-80 rounded-full bg-purple-500/8 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                </div>

                <section className="relative max-w-7xl mx-auto px-4 pt-16 pb-10 sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.85fr]">
                        <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-violet-50 via-white to-purple-50 p-8 shadow-xl shadow-violet-100/40 dark:border-white/[0.08] dark:from-violet-500/10 dark:via-gray-950 dark:to-purple-500/10 dark:shadow-none sm:p-10">
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-600 dark:text-violet-300">QR Tools</p>
                            <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                                Generate, scan &{' '}
                                <span className="text-violet-600 dark:text-violet-400">validate QR codes.</span>
                            </h1>
                            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
                                QR codes for URLs, WiFi, UPI payments, contacts, and 10+ more formats. Optimized for real-world scanning. Completely free.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    to="/qr-tools/generator"
                                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
                                >
                                    Generate QR Code
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <Link
                                    to="/qr-tools/scanner"
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/80 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                                >
                                    Scan a QR Code
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-gray-200/80 bg-gray-50/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">QR for anything</p>
                            <div className="mt-4 grid grid-cols-3 gap-2">
                                {useCases.map((uc) => (
                                    <Link key={uc.label} to="/qr-tools/generator"
                                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-gray-200/80 bg-white/70 transition-colors hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                                    >
                                        <span className="text-xl">{uc.icon}</span>
                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 text-center leading-tight">{uc.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Tools Grid */}
            <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Tools</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">All QR Tools</h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {tools.map((tool) => (
                        <Link
                            key={tool.id}
                            to={tool.link}
                            className={`group flex flex-col rounded-3xl border border-gray-200/80 bg-gradient-to-br ${tool.cardBg} p-6 shadow-xl shadow-gray-100/40 transition-shadow hover:shadow-2xl dark:border-white/[0.08] dark:shadow-none`}
                        >
                            <div className="flex items-start justify-between mb-5">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.gradient} text-white shadow-sm`}>
                                    {tool.icon}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tool.badge === 'Free' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                                    {tool.badge}
                                </span>
                            </div>

                            <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">{tool.name}</h3>
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600 dark:text-violet-300 mt-0.5 mb-2">{tool.tagline}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 flex-1">{tool.description}</p>

                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {tool.features.map((f) => (
                                    <span key={f} className="text-xs px-2.5 py-1 rounded-full border border-gray-200/80 bg-white/70 text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-gray-400">{f}</span>
                                ))}
                            </div>

                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:gap-3 transition-all duration-200">
                                Open tool
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Why QR Tools */}
            <section className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-gray-200/80 bg-gray-50/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mb-5">Why choose Uvero QR</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: '🎯', title: 'Scan-Optimized Output', description: 'Every QR code is generated with proper error correction, quiet zones, and size guidance for reliable real-world scanning.' },
                            { icon: '🔒', title: 'No Login Required', description: 'Static QR generation stays frictionless and completely in your browser. No account, no tracking.' },
                            { icon: '⚡', title: 'Instant & Offline', description: 'Generation and scanning work entirely client-side with no server round-trips. Fast even on slow connections.' },
                        ].map((item) => (
                            <div key={item.title} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200/80 dark:border-white/[0.08] flex items-center justify-center text-xl shrink-0 shadow-sm">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-4 pb-20 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-center shadow-xl shadow-violet-500/20 sm:p-12">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-200">Get started</p>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Ready to create your first QR code?</h2>
                    <p className="mt-3 text-violet-100 max-w-md mx-auto text-sm leading-relaxed">Free, instant, and no account required.</p>
                    <div className="mt-8">
                        <Link
                            to="/qr-tools/generator"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow-sm transition-colors hover:bg-violet-50"
                        >
                            Start Generating
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
