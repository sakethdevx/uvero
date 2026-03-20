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
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-500">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl animate-blob" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-100/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-8 sm:px-6 lg:px-8 sm:pt-24 sm:pb-12">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-full mb-8 animate-fade-in shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                            </span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Free QR Tools — no sign-up required</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-[1.1] animate-fade-in-up text-balance">
                            Professional{' '}
                            <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                                QR Tools
                            </span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-500 dark:text-gray-400 mb-8 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
                            Generate, scan, and validate QR codes for URLs, WiFi, UPI payments, contacts, and 10+ more formats.
                            Optimized for real-world scanning. Completely free.
                        </p>

                        <div className="flex flex-wrap justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <Link
                                to="/qr-tools/generator"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <span>Generate QR Code</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <Link
                                to="/qr-tools/scanner"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border border-gray-200 dark:border-white/10 shadow hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <span>Scan a QR Code</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tools Grid */}
            <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">All QR Tools</h2>
                    <p className="text-gray-500 dark:text-gray-400">Everything you need to work with QR codes</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {tools.map((tool, idx) => (
                        <Link
                            key={tool.id}
                            to={tool.link}
                            className="group relative rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-none hover:shadow-2xl dark:hover:shadow-violet-500/10 transition-all duration-500 hover:-translate-y-2 animate-fade-in-up"
                            style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
                        >
                            <div className={`h-1.5 bg-gradient-to-r ${tool.gradient}`} />
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-5">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                        {tool.icon}
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                                        {tool.badge}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{tool.name}</h3>
                                <p className={`text-sm font-semibold bg-gradient-to-r ${tool.gradient} bg-clip-text text-transparent mb-3`}>
                                    {tool.tagline}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-5">
                                    {tool.description}
                                </p>

                                <ul className="space-y-1.5">
                                    {tool.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="px-8 pb-8">
                                <div className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${tool.gradient} text-white text-sm font-semibold text-center group-hover:shadow-lg transition-shadow`}>
                                    Open Tool →
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Use Cases */}
            <section className="bg-gray-50 dark:bg-gray-900/50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Generate QR for anything</h2>
                        <p className="text-gray-500 dark:text-gray-400">12+ payload types supported out of the box</p>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {useCases.map((uc) => (
                            <Link
                                key={uc.label}
                                to="/qr-tools/generator"
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                            >
                                <span className="text-3xl">{uc.icon}</span>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center leading-tight">{uc.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why QR Tools */}
            <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: '🎯',
                            title: 'Scan-Optimized Output',
                            description: 'Every QR code is generated with proper error correction, quiet zones, and size guidance for reliable real-world scanning.',
                        },
                        {
                            icon: '🔒',
                            title: 'No Login Required',
                            description: 'Static QR generation stays frictionless and completely in your browser. No account, no tracking.',
                        },
                        {
                            icon: '⚡',
                            title: 'Instant & Offline',
                            description: 'Generation and scanning work entirely client-side with no server round-trips. Fast even on slow connections.',
                        },
                    ].map((item) => (
                        <div key={item.title} className="flex flex-col items-start gap-4 p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                            <span className="text-4xl">{item.icon}</span>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 py-16">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to create your first QR code?</h2>
                    <p className="text-violet-100 mb-8 text-lg">
                        Free, instant, and no account required.
                    </p>
                    <Link
                        to="/qr-tools/generator"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-600 font-bold rounded-2xl hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <span>Start Generating</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </section>
        </div>
    );
}
