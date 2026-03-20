import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

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

    const centerCls = 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4';

    if (status === 'loading' || status === 'redirecting') {
        return (
            <div className={centerCls}>
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 dark:bg-violet-900/20 rounded-2xl mb-4 animate-pulse">
                        <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {status === 'redirecting' ? 'Redirecting…' : 'Loading…'}
                    </h2>
                    {destination && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 break-all max-w-xs mx-auto">{destination}</p>
                    )}
                </div>
            </div>
        );
    }

    const messages = {
        notfound: { icon: '🔍', title: 'QR code not found', body: 'This QR code does not exist or may have been deleted.' },
        inactive: { icon: '⏸', title: 'QR code is paused', body: 'This QR code has been temporarily deactivated by its owner.' },
        error: { icon: '⚠️', title: 'Something went wrong', body: 'We could not load this QR code. Please try again.' },
    };
    const msg = messages[status] || messages.error;

    return (
        <div className={centerCls}>
            <div className="text-center">
                <p className="text-5xl mb-4">{msg.icon}</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{msg.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">{msg.body}</p>
                <a href="/" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors text-sm">
                    Go to Uvero
                </a>
            </div>
        </div>
    );
}
