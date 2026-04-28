import { useState } from 'react';
import { Link } from 'react-router-dom';

const FORMSUBMIT_EMAIL = import.meta.env.VITE_FORMSUBMIT_EMAIL;

/**
 * Contact / Feedback Page
 * Uses FormSubmit (https://formsubmit.co/) for serverless form handling.
 * The receiving email is configured via the VITE_FORMSUBMIT_EMAIL env variable.
 */
export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
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
                    _subject: form.subject || 'New message from Uvero contact form',
                    message: form.message,
                    _captcha: 'false',
                    _template: 'table',
                }),
            });
            const data = await res.json();
            // FormSubmit returns success as a string 'true' in its AJAX response
            if (data.success === 'true' || data.success === true) {
                setStatus('success');
                setForm({ name: '', email: '', subject: '', message: '' });
            } else {
                throw new Error(data.message || 'Submission failed');
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || 'Something went wrong. Please try again.');
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            {/* Background decorations */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-[-10rem] top-16 h-96 w-96 rounded-full bg-primary-500/8 blur-3xl" />
                <div className="absolute right-[-8rem] top-8 h-80 w-80 rounded-full bg-violet-500/8 blur-3xl" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />
            </div>

            <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Home
                </Link>

                {/* Hero card */}
                <div className="mt-8 rounded-3xl border border-gray-200/80 bg-gradient-to-br from-primary-50 via-white to-violet-50 p-8 shadow-xl shadow-primary-100/40 dark:border-white/[0.08] dark:from-primary-500/10 dark:via-gray-950 dark:to-violet-500/10 dark:shadow-none sm:p-10">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-400">Get in Touch</p>
                    <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                        Contact Us
                    </h1>
                    <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        Have a suggestion, found a bug, or just want to say hello? We&apos;d love to hear from you.
                        Fill out the form below and we&apos;ll get back to you as soon as possible.
                    </p>
                </div>

                {/* Form card */}
                 <div className="mt-6 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-xl shadow-gray-100/40 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none sm:p-6">

                    {status === 'success' ? (
                        <div className="flex flex-col items-center gap-4 py-10 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                                <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Message Sent!</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                Thanks for reaching out. We&apos;ve received your message and will get back to you soon.
                            </p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                            >
                                Send Another Message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-5 sm:grid-cols-2">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Your name"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-gray-500 dark:focus:border-primary-400 dark:focus:bg-white/[0.06]"
                                    />
                                </div>
                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-gray-500 dark:focus:border-primary-400 dark:focus:bg-white/[0.06]"
                                    />
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Subject
                                </label>
                                <input
                                    id="subject"
                                    name="subject"
                                    type="text"
                                    value={form.subject}
                                    onChange={handleChange}
                                    placeholder="What's this about?"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-gray-500 dark:focus:border-primary-400 dark:focus:bg-white/[0.06]"
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={3}
                                    value={form.message}
                                    onChange={handleChange}
                                    placeholder="Tell us your thoughts, suggestions, or report a bug…"
                                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder-gray-500 dark:focus:border-primary-400 dark:focus:bg-white/[0.06]"
                                />
                            </div>

                            {/* Error message */}
                            {status === 'error' && (
                                <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                                    <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
                                </div>
                            )}

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
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

                {/* Info cards removed for compactness */}
            </div>
        </div>
    );
}
