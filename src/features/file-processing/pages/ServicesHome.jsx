import { Link } from 'react-router-dom';

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
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
        gradient: 'from-primary-500 via-blue-500 to-indigo-600',
        lightGradient: 'from-primary-50 via-blue-50 to-indigo-50',
        accentColor: 'primary',
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
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
        ),
        gradient: 'from-rose-500 via-pink-500 to-purple-600',
        lightGradient: 'from-rose-50 via-pink-50 to-purple-50',
        accentColor: 'rose',
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
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
        ),
        gradient: 'from-emerald-500 via-cyan-500 to-teal-600',
        lightGradient: 'from-emerald-50 via-cyan-50 to-teal-50',
        accentColor: 'emerald',
        link: '/clipboard',
        cta: 'Try Now',
    },
];

const platformFeatures = [
    {
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        ),
        title: 'Privacy First',
        description: 'Your files stay on your device. No uploads, no tracking, no compromise.',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
    },
    {
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
        title: 'Lightning Fast',
        description: 'Optimized processing with Web Workers for smooth, instant results.',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
    },
    {
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
        ),
        title: 'Works Everywhere',
        description: 'Access from any device, any browser. No installations needed.',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
    },
    {
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
        ),
        title: 'Completely Free',
        description: 'No hidden fees, no subscriptions. Professional tools at zero cost.',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
    },
];

export default function ServicesHome() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-500">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-blob" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-100/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-8 sm:px-6 lg:px-8 sm:pt-24 sm:pb-12">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-full mb-8 animate-fade-in shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Your all-in-one digital toolkit</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-[1.1] animate-fade-in-up text-balance">
                            Everything you need,{' '}
                            <span className="gradient-text animate-gradient-x">
                                one platform
                            </span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-500 dark:text-gray-400 mb-12 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
                            From file processing to event photo sharing — powerful tools designed for simplicity, speed, and privacy.
                        </p>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="max-w-7xl mx-auto px-4 pb-20 sm:px-6 lg:px-8 -mt-4">
                <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                    {services.map((service, idx) => (
                        <Link
                            key={service.id}
                            to={service.link}
                            className="group relative rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-none hover:shadow-2xl dark:hover:shadow-primary-500/10 transition-all duration-500 hover:-translate-y-2 animate-fade-in-up"
                            style={{ animationDelay: `${0.15 + idx * 0.1}s` }}
                        >
                            {/* Top gradient strip */}
                            <div className={`h-2 bg-gradient-to-r ${service.gradient}`} />

                            {/* Card content */}
                            <div className="p-8 sm:p-10">
                                {/* Icon + Badge */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                        {service.icon}
                                    </div>
                                    <svg className="w-6 h-6 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all duration-300 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>

                                {/* Title & Tagline */}
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-gray-800 dark:group-hover:text-white transition-colors">
                                    {service.name}
                                </h2>
                                <p className={`text-sm font-semibold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent mb-4`}>
                                    {service.tagline}
                                </p>

                                {/* Description */}
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                                    {service.description}
                                </p>

                                {/* Feature pills */}
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {service.features.map((feature, fIdx) => (
                                        <span
                                            key={fIdx}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${service.lightGradient} dark:from-white/5 dark:to-white/5 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5`}
                                        >
                                            <span className={`w-1 h-1 rounded-full bg-gradient-to-r ${service.gradient}`} />
                                            {feature}
                                        </span>
                                    ))}
                                </div>

                                {/* CTA */}
                                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${service.gradient} text-white font-semibold shadow-lg group-hover:shadow-xl transition-all duration-300 text-sm`}>
                                    {service.cta}
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </div>

                            {/* Hover gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${service.lightGradient} opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`} />
                        </Link>
                    ))}
                </div>

                {/* Coming Soon hint */}
                <div className="text-center mt-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        More services coming soon
                    </p>
                </div>
            </section>

            {/* Why Uvero Section */}
            <section className="bg-gray-50/50 dark:bg-gray-900/30 py-20 sm:py-24 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Uvero?</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">Built with privacy, performance, and simplicity at the core</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {platformFeatures.map((feature, idx) => (
                            <div
                                key={idx}
                                className="group text-center p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${feature.bg} dark:bg-white/5 ${feature.color} dark:text-white mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Uvero Section */}
            <section className="py-20 sm:py-24 dark:bg-gray-950 transition-colors">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">What Does Uvero Mean?</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">The story behind our name</p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl dark:shadow-none p-8 sm:p-12 border border-gray-100 dark:border-white/5">
                        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-8 text-center">
                            <strong className="text-primary-600 dark:text-primary-400">Uvero</strong> is a coined brand name formed from three core ideas:
                        </p>

                        <div className="grid md:grid-cols-3 gap-8 mb-8">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-3xl font-bold mb-4">
                                    U
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Universal</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    A wide collection of useful digital tools — an all-in-one platform for everyday tasks.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-2xl font-bold mb-4">
                                    ver
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Versatile</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Multiple functions in one place — transform files, process data, and share memories.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-3xl font-bold mb-4">
                                    o
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Zero Effort</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    Instant results with minimal effort. Complete digital tasks with almost zero friction.
                                </p>
                            </div>
                        </div>

                        <div className="text-center pt-6 border-t border-gray-200 dark:border-white/10">
                            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Uvero = <span className="gradient-text">Universal, versatile tools for zero-effort productivity</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-blue-600 to-indigo-700" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

                <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-24 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 text-balance">
                        Ready to Get Started?
                    </h2>
                    <p className="text-lg text-blue-100 dark:text-gray-300 mb-8 max-w-xl mx-auto">
                        Pick a service and start right away. No sign-up required for file processing.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/tools"
                            className="inline-flex items-center gap-2 bg-white dark:bg-primary-500 text-primary-700 dark:text-white font-semibold py-3.5 px-7 rounded-xl hover:bg-gray-50 dark:hover:bg-primary-600 transition-all duration-300 shadow-xl shadow-black/10 hover:-translate-y-0.5"
                        >
                            File Processing
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            to="/photodrop"
                            className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold py-3.5 px-7 rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20 hover:-translate-y-0.5"
                        >
                            PhotoDrop
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
