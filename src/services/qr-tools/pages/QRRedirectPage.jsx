import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AIPageLayout from '../../../components/AIPageLayout';
import AILoader from '../../../components/AILoader';

/**
 * QR Redirect Page — shown briefly when a dynamic QR code is scanned.
 * Fetches the destination from /api/qr/r/:code and immediately redirects.
 */
export default function QRRedirectPage() {
    const { code } = useParams();
    const [status, setStatus] = useState('loading'); // 'loading' | 'redirecting' | 'notfound' | 'inactive' | 'error'
    const [destination, setDestination] = useState('');

    useEffect(() => {
        async function resolve() {
            if (!code) { setStatus('notfound'); return; }
            try {
                const res = await fetch(`/api/qr/r/${code}`);
                if (res.status === 404) { setStatus('notfound'); return; }
                if (res.status === 410) { setStatus('inactive'); return; }
                if (!res.ok) { setStatus('error'); return; }
                const data = await res.json();
                setDestination(data.destination_url);
                setStatus('redirecting');
                setTimeout(() => { window.location.href = data.destination_url; }, 600);
            } catch {
                setStatus('error');
            }
        }
        resolve();
    }, [code]);

    if (status === 'loading' || status === 'redirecting') {
        return (
            <AIPageLayout pattern="focused">
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <AILoader mode="orb" label={status === 'redirecting' ? 'Redirecting…' : 'Loading…'} />
                    {destination && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono break-all max-w-xs mx-auto mt-2">{destination}</p>
                    )}
                </div>
            </AIPageLayout>
        );
    }

    const messages = {
        notfound: { icon: '🔍', title: 'QR code not found', body: 'This QR code does not exist or may have been deleted.' },
        inactive: { icon: '⏸', title: 'QR code is paused', body: 'This QR code has been temporarily deactivated by its owner.' },
        error: { icon: '⚠️', title: 'Something went wrong', body: 'We could not load this QR code. Please try again.' },
    };
    const msg = messages[status] || messages.error;

    return (
        <AIPageLayout pattern="focused">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <p className="text-5xl mb-4">{msg.icon}</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{msg.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8">{msg.body}</p>
                <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                    Go to Uvero
                </a>
            </div>
        </AIPageLayout>
    );
}
