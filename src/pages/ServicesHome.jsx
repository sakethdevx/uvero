import { Link } from 'react-router-dom';
import { CLI_INSTALL_COMMAND } from '../features/clipboard/cliCommands';
import AnnouncementBanner from '../components/AnnouncementBanner';
import ContactFormSection from '../components/ContactFormSection';

/**
 * Services Home Page
 * Main landing page showcasing all Uvero services
 */
const services = [
    {
        id: 'file-tools',
        name: 'File Tools',
        tagline: 'Convert, compress & transform',
        description: '55+ powerful tools to convert, compress, resize, and process your files. Images, PDFs, audio, video, documents — all in one place.',
        features: ['Image & PDF Tools', 'Audio & Video Conversion', 'Privacy-First Processing', 'Works Offline'],
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
        iconBg: 'bg-primary-50 dark:bg-primary-500/10',
        iconColor: 'text-primary-600 dark:text-primary-300',
        gradient: 'from-primary-50 via-white to-blue-50',
        darkGradient: 'dark:from-primary-500/10 dark:via-gray-950 dark:to-blue-500/10',
        shadow: 'shadow-primary-100/40',
        link: '/tools',
        cta: 'Explore Tools',
    },
    {
        id: 'photodrop',
        name: 'PhotoDrop',
        tagline: 'Event photos, simplified',
        description: 'Create events, upload photos, and let guests find their pictures with smart face recognition. Share memories effortlessly.',
        features: ['Event Photo Sharing', 'Face Recognition', 'QR Code Invites', 'Bulk Download'],
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
        ),
        iconBg: 'bg-rose-50 dark:bg-rose-500/10',
        iconColor: 'text-rose-600 dark:text-rose-300',
        gradient: 'from-rose-50 via-white to-pink-50',
        darkGradient: 'dark:from-rose-500/10 dark:via-gray-950 dark:to-pink-500/10',
        shadow: 'shadow-rose-100/40',
        link: '/photodrop',
        cta: 'Get Started',
    },
    {
        id: 'clipboard',
        name: 'Online Clipboard',
        tagline: 'Share text instantly, anywhere',
        description: 'Quick-share text with a 4-digit code or create private boards with syntax highlighting, markdown preview, and security features.',
        features: ['4-Digit Quick Share', 'Syntax Highlighting', 'Password Protection', 'Burn After Read'],
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
        ),
        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
        iconColor: 'text-emerald-600 dark:text-emerald-300',
        gradient: 'from-emerald-50 via-white to-cyan-50',
        darkGradient: 'dark:from-emerald-500/10 dark:via-gray-950 dark:to-cyan-500/10',
        shadow: 'shadow-emerald-100/40',
        link: '/clipboard',
        cta: 'Try Now',
    },
    {
        id: 'trip-split',
        name: 'PaySplit – Split Expenses',
        tagline: 'Split expenses without friction',
        description: 'Create trip groups, add shared expenses, auto-calculate who owes whom, and settle instantly using UPI IDs, mobile numbers, or QR payment references.',
        features: ['Equal / Exact / % / Shares', 'UPI Deep Links', 'Guest + Signed-In Support', 'Smart Settle-Up Suggestions'],
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.12-3 2.5S10.343 13 12 13s3 1.12 3 2.5S13.657 18 12 18m0-10V6m0 12v-2m9-4.5c0 4.971-4.03 9-9 9s-9-4.029-9-9 4.03-9 9-9 9 4.029 9 9z" />
            </svg>
        ),
        iconBg: 'bg-amber-50 dark:bg-amber-500/10',
        iconColor: 'text-amber-600 dark:text-amber-300',
        gradient: 'from-amber-50 via-white to-yellow-50',
        darkGradient: 'dark:from-amber-500/10 dark:via-gray-950 dark:to-yellow-500/10',
        shadow: 'shadow-amber-100/40',
        link: '/split-expense',
        cta: 'Split Now',
    },
    {
        id: 'qr-tools',
        name: 'QR Tools',
        tagline: 'Generate, scan & validate QR codes',
        description: 'Create professional QR codes for URLs, WiFi, UPI payments, vCard contacts, WhatsApp, maps, and more. Scan with camera or image upload.',
        features: ['12+ Payload Types', 'Logo & Custom Colours', 'Camera & Image Scanner', 'QR Validator & Score'],
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
        ),
        iconBg: 'bg-violet-50 dark:bg-violet-500/10',
        iconColor: 'text-violet-600 dark:text-violet-300',
        gradient: 'from-violet-50 via-white to-purple-50',
        darkGradient: 'dark:from-violet-500/10 dark:via-gray-950 dark:to-purple-500/10',
        shadow: 'shadow-violet-100/40',
        link: '/qr-tools',
        cta: 'Try QR Tools',
    },
    {
        id: 'compiler',
        name: 'Online Compiler',
        tagline: 'Write, compile & run code instantly',
        description: 'A premium online IDE powered by Monaco Editor. Execute code in 20+ programming languages with real-time output, execution metrics, and zero setup required.',
        features: ['20+ Languages', 'Monaco Editor', 'Execution Metrics', 'Cloud Sandboxed'],
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
        ),
        iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
        iconColor: 'text-indigo-600 dark:text-indigo-300',
        gradient: 'from-indigo-50 via-white to-blue-50',
        darkGradient: 'dark:from-indigo-500/10 dark:via-gray-950 dark:to-blue-500/10',
        shadow: 'shadow-indigo-100/40',
        link: '/compiler',
        cta: 'Start Coding',
        badge: 'New',
    },
];

const platformFeatures = [
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        ),
        title: 'Privacy First',
        description: 'Your files stay on your device. No uploads, no tracking, no compromise.',
        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
        iconColor: 'text-emerald-600 dark:text-emerald-300',
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
        title: 'Lightning Fast',
        description: 'Optimized processing with Web Workers for smooth, instant results.',
        iconBg: 'bg-amber-50 dark:bg-amber-500/10',
        iconColor: 'text-amber-600 dark:text-amber-300',
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
        ),
        title: 'Works Everywhere',
        description: 'Access from any device, any browser. No installations needed.',
        iconBg: 'bg-blue-50 dark:bg-blue-500/10',
        iconColor: 'text-primary-600 dark:text-primary-300',
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
        ),
        title: 'Completely Free',
        description: 'No hidden fees, no subscriptions. Professional tools at zero cost.',
        iconBg: 'bg-purple-50 dark:bg-purple-500/10',
        iconColor: 'text-purple-600 dark:text-purple-300',
    },
];

export default function ServicesHome() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            {/* Announcement Banner */}
            <AnnouncementBanner
                announcements={[
                    { message: "New Feature: Uvero CLI access is now available!", badge: "New" },
                    { message: "Next Major Service: Project Helper — coming soon!", badge: "Upcoming" }
                ]}
            />

            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Subtle background blobs */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[-10rem] top-16 h-96 w-96 rounded-full bg-primary-500/8 blur-3xl" />
                    <div className="absolute right-[-8rem] top-8 h-80 w-80 rounded-full bg-blue-500/8 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
                </div>

                <section className="relative max-w-7xl mx-auto px-4 pt-16 pb-10 sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.85fr]">
                        {/* Main hero card */}
                        <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-primary-50 via-white to-blue-50 p-8 shadow-xl shadow-primary-100/40 dark:border-white/[0.08] dark:from-primary-500/10 dark:via-gray-950 dark:to-blue-500/10 dark:shadow-none sm:p-10">
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-300">Uvero Platform</p>
                            <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                                Everything you need,{' '}
                                <span className="text-primary-600 dark:text-primary-400">one platform</span>
                            </h1>
                            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
                                From File Tools to event photo sharing — powerful tools designed for simplicity, speed, and privacy. No sign-up required for most tools.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    to="/tools"
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                                >
                                    Explore Tools
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <Link
                                    to="/photodrop"
                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/80 px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                                >
                                    Try PhotoDrop
                                </Link>
                            </div>
                        </div>

                        {/* Quick stats / highlights card */}
                        <div className="rounded-3xl border border-gray-200/80 bg-gray-50/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Why Uvero?</p>
                            <div className="mt-5 space-y-4">
                                {platformFeatures.map((f, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${f.iconBg} ${f.iconColor}`}>
                                            {f.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{f.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Services Grid */}
            <section className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Services</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">All tools, one place</h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {services.map((service) => (
                        <Link
                            key={service.id}
                            to={service.link}
                            className={`group flex flex-col rounded-3xl border border-gray-200/80 bg-gradient-to-br ${service.gradient} p-6 shadow-xl ${service.shadow} transition-shadow hover:shadow-2xl dark:border-white/[0.08] ${service.darkGradient} dark:shadow-none`}
                        >
                            {/* Icon + Badge */}
                            <div className="flex items-start justify-between mb-5">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${service.iconBg} ${service.iconColor}`}>
                                    {service.icon}
                                </div>
                                {service.badge && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                                        {service.badge}
                                    </span>
                                )}
                            </div>

                            {/* Title & Tagline */}
                            <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
                                {service.name}
                            </h3>
                            <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${service.iconColor}`}>{service.tagline}</p>

                            {/* Description */}
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 flex-1">
                                {service.description}
                            </p>

                            {/* Feature tags */}
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {service.features.map((feature, fIdx) => (
                                    <span
                                        key={fIdx}
                                        className="text-xs px-2.5 py-1 rounded-full border border-gray-200/80 bg-white/70 text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-gray-400"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>

                            {/* CTA */}
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:gap-3 transition-all duration-200">
                                {service.cta}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>

                <p className="text-sm text-gray-400 dark:text-gray-600 mt-6 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    More services coming soon
                </p>
            </section>

            {/* CLI Section */}
            <section className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none sm:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12 gap-6">
                        <div className="max-w-xl">
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-300">CLI Access</p>
                            <h2 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Access Uvero from your terminal.</h2>
                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Install the official Uvero CLI once, then send or fetch clipboard content from the command line whenever you do not want to switch back to the browser.
                            </p>
                            <Link
                                to="/cli"
                                className="inline-flex items-center gap-2 mt-5 rounded-xl border border-gray-200/80 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-gray-200 dark:hover:bg-white/[0.08]"
                            >
                                Explore CLI usage
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </Link>
                        </div>

                        <div className="flex-1 min-w-0 lg:max-w-sm rounded-2xl border border-gray-200/80 bg-white/85 p-5 shadow-sm dark:border-white/[0.08] dark:bg-gray-950/50">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">Install</p>
                            <code className="mt-3 block overflow-x-auto rounded-xl bg-gray-950 px-4 py-3 text-sm text-cyan-200">
                                {CLI_INSTALL_COMMAND}
                            </code>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mt-4">Example</p>
                            <code className="mt-3 block overflow-x-auto rounded-xl bg-gray-950 px-4 py-3 text-sm text-cyan-200">
                                uvero send notes.txt
                            </code>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">About</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">What Does Uvero Mean?</h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">The story behind our name</p>

                    <div className="mt-8 grid md:grid-cols-3 gap-6">
                        {[
                            { letter: 'U', label: 'Universal', bg: 'bg-primary-50 dark:bg-primary-500/10', color: 'text-primary-600 dark:text-primary-300', desc: 'A wide collection of useful digital tools — an all-in-one platform for everyday tasks.' },
                            { letter: 'ver', label: 'Versatile', bg: 'bg-purple-50 dark:bg-purple-500/10', color: 'text-purple-600 dark:text-purple-300', desc: 'Multiple functions in one place — transform files, process data, and share memories.' },
                            { letter: 'o', label: 'Zero Effort', bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-300', desc: 'Instant results with minimal effort. Complete digital tasks with almost zero friction.' },
                        ].map((item) => (
                            <div key={item.letter} className="text-center">
                                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${item.bg} ${item.color} text-2xl font-black mb-3`}>
                                    {item.letter}
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{item.label}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200/80 dark:border-white/[0.08] text-center">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Uvero = <span className="text-primary-600 dark:text-primary-400 font-semibold">Universal, versatile tools for zero-effort productivity</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact / Feedback Section */}
            <ContactFormSection />

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto px-4 pb-20 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-primary-500/20 bg-gradient-to-br from-primary-600 to-indigo-700 p-6 text-center shadow-xl shadow-primary-500/20 sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary-200">Get started</p>
                    <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                        Ready to Get Started?
                    </h2>
                    <p className="mt-2 text-primary-100 max-w-md mx-auto text-sm leading-relaxed">
                        Pick a service and start right away. No sign-up required for File Tools.
                    </p>
                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/tools"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
                        >
                            File Tools
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            to="/photodrop"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                        >
                            PhotoDrop
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

