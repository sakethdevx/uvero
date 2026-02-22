import { Link } from 'react-router-dom';

/**
 * Privacy Policy Page
 */
export default function Privacy() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 transition-colors duration-500">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-8 font-semibold transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Home
                </Link>

                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-white/5 transition-colors duration-500">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                        Privacy Policy
                    </h1>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                        Last updated: February 4, 2026
                    </p>

                    <div className="prose prose-lg max-w-none space-y-8">
                        {/* Core Privacy Commitment */}
                        <section>
                            <div className="p-6 bg-green-50 dark:bg-green-500/10 border-l-4 border-green-500 rounded-r-lg mb-6 transition-colors">
                                <h2 className="text-2xl font-bold text-green-900 dark:text-green-400 mb-3 mt-0">
                                    🔒 Our Privacy Commitment
                                </h2>
                                <p className="text-green-800 dark:text-green-300 text-lg mb-0">
                                    <strong>Your files never leave your device.</strong> All processing happens
                                    entirely in your browser. We don't have servers to store your files, and we
                                    never will. This is our core promise.
                                </p>
                            </div>
                        </section>

                        {/* How It Works */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                How Our Tools Work
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300">
                                When you upload a file to any of our tools:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                                <li>The file is loaded directly into your browser's memory</li>
                                <li>All processing (compression, conversion, etc.) happens on your device using Web Workers</li>
                                <li>The processed file is created in your browser</li>
                                <li>You download the result directly from your browser's memory</li>
                                <li>No data is transmitted to our servers or any third party</li>
                            </ul>
                        </section>

                        {/* Data Collection */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                What Data We Collect
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        File Data: None
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        We do not collect, store, or have access to any files you process.
                                        Your files exist only in your browser's memory and are cleared when
                                        you close the tab or navigate away.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        Analytics: Minimal & Anonymous
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        We use privacy-focused analytics to understand how our tools are used.
                                        This includes:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 mt-2">
                                        <li>Page views and tool usage statistics</li>
                                        <li>Browser type and device type (for compatibility)</li>
                                        <li>General geographic region (country-level only)</li>
                                        <li>Error reports (without file data)</li>
                                    </ul>
                                    <p className="text-gray-700 dark:text-gray-300 mt-2">
                                        We never collect IP addresses or personally identifiable information.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Third-Party Services */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Third-Party Services
                            </h2>

                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                We use minimal third-party services:
                            </p>

                            <div className="space-y-3">
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Google Analytics (Optional)
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Used for anonymous usage statistics. Can be blocked with ad blockers.
                                    </p>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Content Delivery Network (CDN)
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Our static files are served via a CDN for faster loading. No user data is collected.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Cookies */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Cookies & Local Storage
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                We use minimal browser storage:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                                <li>
                                    <strong>Analytics cookies:</strong> To remember if you've consented to analytics
                                </li>
                                <li>
                                    <strong>Preference storage:</strong> To remember your tool settings (like compression quality)
                                </li>
                            </ul>
                            <p className="text-gray-700 dark:text-gray-300 mt-3">
                                You can clear this data anytime through your browser settings.
                            </p>
                        </section>

                        {/* Your Rights */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Your Rights & Control
                            </h2>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                                <li>
                                    <strong>No account required:</strong> Use all tools anonymously without registration
                                </li>
                                <li>
                                    <strong>Ad blockers welcome:</strong> Our tools work perfectly with ad blockers
                                </li>
                                <li>
                                    <strong>Offline capable:</strong> Once loaded, many tools work without internet
                                </li>
                                <li>
                                    <strong>Open source:</strong> Our code is transparent and auditable
                                </li>
                            </ul>
                        </section>

                        {/* Security */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Security
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300">
                                Since all processing happens in your browser and we don't store any files:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mt-3">
                                <li>There's no server to be hacked</li>
                                <li>No file database to be compromised</li>
                                <li>Your data is as secure as your own device</li>
                                <li>We use HTTPS to ensure the tool code isn't tampered with in transit</li>
                            </ul>
                        </section>

                        {/* Children's Privacy */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Children's Privacy
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300">
                                Our service is safe for all ages. Since we don't collect personal information,
                                there's no data to protect. However, we recommend parental guidance for users
                                under 13.
                            </p>
                        </section>

                        {/* Changes to Policy */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Changes to This Policy
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300">
                                We may update this policy occasionally. Material changes will be announced
                                on our homepage. Continued use of our tools constitutes acceptance of any changes.
                            </p>
                        </section>

                        {/* Contact */}
                        <section className="border-t dark:border-white/10 pt-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Questions?
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300">
                                If you have any questions about our privacy practices, please feel free to
                                reach out. We're committed to transparency and your privacy.
                            </p>
                        </section>
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-8 text-center">
                    <Link
                        to="/"
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        Start Using Our Tools
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}
