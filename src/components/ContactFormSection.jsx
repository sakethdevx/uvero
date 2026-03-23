import { useState } from 'react';
import { Link } from 'react-router-dom';

const FORMSUBMIT_EMAIL = import.meta.env.VITE_FORMSUBMIT_EMAIL;

/**
 * Compact inline contact / feedback form for the homepage.
 * Uses FormSubmit (https://formsubmit.co/) for serverless delivery.
 */
export default function ContactFormSection() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!FORMSUBMIT_EMAIL) {
            setStatus('error');
            setErrorMsg('Contact form is not configured yet. Please try again later.');
            return;
        }
        setStatus('submitting');
        setErrorMsg('');
        try {
            const res = await fetch(`https://formsubmit.co/ajax/${FORMSUBMIT_EMAIL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    _subject: 'New message from Uvero homepage',
                    message: form.message,
                    _captcha: 'false',
                    _template: 'table',
                }),
            });
            const data = await res.json();
            // FormSubmit returns success as a string 'true' in its AJAX response
            if (data.success === 'true' || data.success === true) {
                setStatus('success');
                setForm({ name: '', email: '', message: '' });
            } else {
                throw new Error(data.message || 'Submission failed');
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || 'Something went wrong. Please try again.');
        }
    }

    return (
        <section className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-violet-50 via-white to-primary-50 p-6 shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:from-violet-500/10 dark:via-gray-950 dark:to-primary-500/10 dark:shadow-none sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-500 dark:text-violet-400">Feedback</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                            Share Your Thoughts
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                            Have a suggestion or found a bug? Let us know and help make Uvero better.
                        </p>
                    </div>
                    <Link
                        to="/contact"
                        className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                    >
                        Full contact page
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>

                {status === 'success' ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                            <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Message Sent!</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                            We&apos;ve received your message and will get back to you soon.
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="mt-1 rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                        >
                            Send Another
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="hs-name" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="hs-name"
                                    name="name"
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-gray-500 dark:focus:border-primary-400"
                                />
                            </div>
                            <div>
                                <label htmlFor="hs-email" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="hs-email"
                                    name="email"
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-gray-500 dark:focus:border-primary-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="hs-message" className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="hs-message"
                                name="message"
                                required
                                rows={4}
                                value={form.message}
                                onChange={handleChange}
                                placeholder="Your suggestion, bug report, or question…"
                                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-gray-500 dark:focus:border-primary-400"
                            />
                        </div>

                        {status === 'error' && (
                            <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                                <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {status === 'submitting' ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Sending…
                                </>
                            ) : (
                                <>
                                    Send Message
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}
