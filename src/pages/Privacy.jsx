import { Link } from 'react-router-dom';
import AIPageLayout from '../components/AIPageLayout';

/**
 * Privacy Policy Page
 */
export default function Privacy() {
    return (
        <AIPageLayout pattern="calm" maxWidth="max-w-3xl" backTo="/" backLabel="Back to Hub">
            {/* Hero Section */}
            <div className="mb-10 sm:mb-12">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent dark:text-accent-blue">Legal</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                    Privacy Protocol
                </h1>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Last updated: February 4, 2026</p>

                <div className="mt-8 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                    <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">
                        🔒 Local Processing Guarantee
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-emerald-800 dark:text-emerald-200/80">
                        <strong>Your files never leave your device.</strong> All processing happens entirely in your browser. We don't have servers to store your files, and we never will. This is our core promise.
                    </p>
                </div>
            </div>

            {/* Content Body */}
            <div className="space-y-12">

                        {/* How It Works */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                How Our Tools Work
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                                When you upload a file to any of our tools:
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                {[
                                    'The file is loaded directly into your browser\'s memory',
                                    'All processing (compression, conversion, etc.) happens on your device using Web Workers',
                                    'The processed file is created in your browser',
                                    'You download the result directly from your browser\'s memory',
                                    'No data is transmitted to our servers or any third party',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                        {/* Data Collection */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                What Data We Collect
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.15em] mb-2">
                                        File Data: None
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                        We do not collect, store, or have access to any files you process. Your files exist only in your browser's memory and are cleared when you close the tab or navigate away.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.15em] mb-2">
                                        Analytics: Minimal & Anonymous
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                                        We use privacy-focused analytics to understand how our tools are used. This includes:
                                    </p>
                                    <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                                        {[
                                            'Page views and tool usage statistics',
                                            'Browser type and device type (for compatibility)',
                                            'General geographic region (country-level only)',
                                            'Error reports (without file data)',
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                        We never collect IP addresses or personally identifiable information.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                        {/* Third-Party Services */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Third-Party Services
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                We use minimal third-party services:
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { title: 'Google Analytics (Optional)', desc: 'Used for anonymous usage statistics. Can be blocked with ad blockers.' },
                                    { title: 'Content Delivery Network (CDN)', desc: 'Our static files are served via a CDN for faster loading. No user data is collected.' },
                                ].map((item, i) => (
                                    <div key={i} className="rounded-2xl border border-gray-200/80 bg-gray-50/80 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                        {/* Cookies */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Cookies & Local Storage
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                                We use minimal browser storage:
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                    <span><strong className="text-gray-900 dark:text-white">Analytics cookies:</strong> To remember if you've consented to analytics</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                    <span><strong className="text-gray-900 dark:text-white">Preference storage:</strong> To remember your tool settings (like compression quality)</span>
                                </li>
                            </ul>
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                You can clear this data anytime through your browser settings.
                            </p>
                        </section>

                        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                        {/* Your Rights */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Your Rights & Control
                            </h2>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                {[
                                    ['No account required:', 'Use all tools anonymously without registration'],
                                    ['Ad blockers welcome:', 'Our tools work perfectly with ad blockers'],
                                    ['Offline capable:', 'Once loaded, many tools work without internet'],
                                    ['Open source:', 'Our code is transparent and auditable'],
                                ].map(([label, desc], i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        <span><strong className="text-gray-900 dark:text-white">{label}</strong> {desc}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                        {/* Security */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Security
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                                Since all processing happens in your browser and we don't store any files:
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                {[
                                    "There's no server to be hacked",
                                    'No file database to be compromised',
                                    'Your data is as secure as your own device',
                                    "We use HTTPS to ensure the tool code isn't tampered with in transit",
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                        {/* Children's Privacy */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Children's Privacy
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                Our service is safe for all ages. Since we don't collect personal information, there's no data to protect. However, we recommend parental guidance for users under 13.
                            </p>
                        </section>

                        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                        {/* Changes to Policy */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Changes to This Policy
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                We may update this policy occasionally. Material changes will be announced on our homepage. Continued use of our tools constitutes acceptance of any changes.
                            </p>
                        </section>

                        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                        {/* Contact */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Questions?
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                If you have any questions about our privacy practices, please feel free to reach out. We're committed to transparency and your privacy.
                            </p>
                        </section>
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 text-center pt-8 border-t border-gray-100 dark:border-white/[0.06]">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-violet"
                >
                    Return to Hub
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </Link>
            </div>
        </AIPageLayout>
    );
}
