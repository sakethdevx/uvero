import { Link } from 'react-router-dom';
import { CLI_INSTALL_COMMAND } from '../features/clipboard/cliCommands';
import AnnouncementBanner from '../components/AnnouncementBanner';

/**
 * Services Home Page
 * Main landing page showcasing all Uvero services
 */
const services = [
    {
        id: 'file-processing',
        name: 'File Processing',
        tagline: 'Convert, compress & transform',
        description: '55+ powerful tools to convert, compress, resize, and process your files. Images, PDFs, audio, video, documents — all in one place.',
        features: ['Image & PDF Tools', 'Audio & Video Conversion', 'Privacy-First Processing', 'Works Offline'],
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
        iconBg: 'bg-blue-50 dark:bg-blue-900/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
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
        iconBg: 'bg-rose-50 dark:bg-rose-900/20',
        iconColor: 'text-rose-600 dark:text-rose-400',
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
        iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
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
        iconBg: 'bg-amber-50 dark:bg-amber-900/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
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
        iconBg: 'bg-violet-50 dark:bg-violet-900/20',
        iconColor: 'text-violet-600 dark:text-violet-400',
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
        iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
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
        iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
        title: 'Lightning Fast',
        description: 'Optimized processing with Web Workers for smooth, instant results.',
        iconBg: 'bg-amber-50 dark:bg-amber-900/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
        ),
        title: 'Works Everywhere',
        description: 'Access from any device, any browser. No installations needed.',
        iconBg: 'bg-blue-50 dark:bg-blue-900/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
        ),
        title: 'Completely Free',
        description: 'No hidden fees, no subscriptions. Professional tools at zero cost.',
        iconBg: 'bg-purple-50 dark:bg-purple-900/20',
        iconColor: 'text-purple-600 dark:text-purple-400',
    },
];

export default function ServicesHome() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Announcement Banner */}
            <AnnouncementBanner
                announcements={[
                    { message: "New Feature: Uvero CLI access is now available!", badge: "New" },
                    { message: "Next Major Service: Online Compiler!", badge: "Upcoming" }
                ]}
            />

            {/* Hero Section */}
            <section className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 sm:py-20">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30 rounded-full mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                            <span className="text-xs font-medium text-primary-700 dark:text-primary-400">Your all-in-one digital toolkit</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                            Everything you need,{' '}
                            <span className="text-primary-600 dark:text-primary-400">one platform</span>
                        </h1>

                        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl leading-relaxed">
                            From file processing to event photo sharing — powerful tools designed for simplicity, speed, and privacy.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <Link to="/tools" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm">
                                Explore Tools
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <Link to="/photodrop" className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-5 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
                                Try PhotoDrop
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="max-w-7xl mx-auto px-4 py-14 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Services</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">All tools available — pick what you need</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                        <Link
                            key={service.id}
                            to={service.link}
                            className="group flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all duration-150"
                        >
                            {/* Icon + Badge */}
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-10 h-10 rounded-lg ${service.iconBg} ${service.iconColor} flex items-center justify-center`}>
                                    {service.icon}
                                </div>
                                {service.badge && (
                                    <span className="text-xs font-medium px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800/30 rounded-full">
                                        {service.badge}
                                    </span>
                                )}
                            </div>

                            {/* Title & Tagline */}
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {service.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{service.tagline}</p>

                            {/* Description */}
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-1">
                                {service.description}
                            </p>

                            {/* Feature tags */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {service.features.map((feature, fIdx) => (
                                    <span
                                        key={fIdx}
                                        className="text-xs px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded border border-gray-100 dark:border-gray-700"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>

                            {/* CTA */}
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:gap-2.5 transition-all duration-150">
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
            <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12 gap-6">
                        <div className="max-w-xl">
                            <span className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-400">CLI Access</span>
                            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">Access Uvero from your terminal.</h2>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Install the official Uvero CLI once, then send or fetch clipboard content from the command line whenever you do not want to switch back to the browser.
                            </p>
                            <Link
                                to="/cli"
                                className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                            >
                                Explore CLI usage
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </Link>
                        </div>

                        <div className="flex-1 min-w-0 lg:max-w-sm bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Install</p>
                            <code className="block overflow-x-auto rounded-lg bg-gray-900 px-3 py-2.5 text-sm text-green-400 font-mono">
                                {CLI_INSTALL_COMMAND}
                            </code>
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-3 mb-2">Example</p>
                            <code className="block overflow-x-auto rounded-lg bg-gray-900 px-3 py-2.5 text-sm text-green-400 font-mono">
                                uvero send notes.txt
                            </code>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Uvero Section */}
            <section className="max-w-7xl mx-auto px-4 py-14 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Why Uvero?</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Built with privacy, performance, and simplicity at the core</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {platformFeatures.map((feature, idx) => (
                        <div
                            key={idx}
                            className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                        >
                            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${feature.iconBg} ${feature.iconColor} mb-3`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* About Section */}
            <section className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                <div className="max-w-4xl mx-auto px-4 py-14 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">What Does Uvero Mean?</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">The story behind our name</p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 sm:p-8">
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 text-center">
                            <strong className="text-primary-600 dark:text-primary-400">Uvero</strong> is a coined brand name formed from three core ideas:
                        </p>

                        <div className="grid md:grid-cols-3 gap-6 mb-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xl font-bold mb-3">
                                    U
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Universal</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    A wide collection of useful digital tools — an all-in-one platform for everyday tasks.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-lg font-bold mb-3">
                                    ver
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Versatile</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    Multiple functions in one place — transform files, process data, and share memories.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xl font-bold mb-3">
                                    o
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Zero Effort</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    Instant results with minimal effort. Complete digital tasks with almost zero friction.
                                </p>
                            </div>
                        </div>

                        <div className="text-center pt-5 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Uvero = <span className="text-primary-600 dark:text-primary-400">Universal, versatile tools for zero-effort productivity</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-primary-600 dark:bg-primary-700">
                <div className="max-w-4xl mx-auto px-4 py-14 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                        Ready to Get Started?
                    </h2>
                    <p className="text-primary-100 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                        Pick a service and start right away. No sign-up required for file processing.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/tools"
                            className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-50 transition-colors text-sm"
                        >
                            File Processing
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            to="/photodrop"
                            className="inline-flex items-center gap-2 bg-primary-500 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-400 transition-colors border border-primary-400 text-sm"
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
