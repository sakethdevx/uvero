import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import QRCode from 'qrcode';

/* ── helpers ── */
const APP_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';
const REDIRECT_BASE = `${APP_ORIGIN}/qr/r/`;

async function apiFetch(method, path, body, accessToken) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api/${path}`, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
}

async function generatePreviewDataUrl(shortCode) {
    return QRCode.toDataURL(`${REDIRECT_BASE}${shortCode}`, {
        width: 200,
        errorCorrectionLevel: 'M',
        margin: 3,
    });
}

/* ── sub-components ── */
const inputCls = 'w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';

function StatBadge({ label, value, color }) {
    const colors = {
        violet: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20',
        green: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
        gray: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
    };
    return (
        <div className={`rounded-xl px-4 py-2.5 text-center ${colors[color]}`}>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs mt-0.5 opacity-80">{label}</p>
        </div>
    );
}

function ScanTrendChart({ scans }) {
    if (!scans || !scans.length) return (
        <p className="text-xs text-gray-400 text-center py-4">No scans yet</p>
    );

    // Build last-14-day bar chart
    const days = 14;
    const bins = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        bins.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    scans.forEach((s) => {
        const day = s.scanned_at.slice(0, 10);
        const bin = bins.find((b) => b.date === day);
        if (bin) bin.count++;
    });
    const max = Math.max(...bins.map((b) => b.count), 1);

    return (
        <div className="flex items-end gap-1 h-16">
            {bins.map((b) => (
                <div key={b.date} className="flex-1 flex flex-col items-center justify-end group relative" title={`${b.date}: ${b.count} scans`}>
                    <div
                        className="w-full bg-violet-400 dark:bg-violet-500 rounded-t transition-all"
                        style={{ height: `${(b.count / max) * 100}%`, minHeight: b.count > 0 ? '4px' : '2px' }}
                    />
                </div>
            ))}
        </div>
    );
}

function CodeCard({ code, onEdit, onDelete, onToggle, onViewAnalytics, previewUrl }) {
    const scanUrl = `${REDIRECT_BASE}${code.short_code}`;
    const isActive = code.is_active;

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-2xl border transition-all ${isActive ? 'border-gray-100 dark:border-white/5' : 'border-amber-200 dark:border-amber-500/30 opacity-75'} shadow-sm hover:shadow-md`}>
            <div className="p-5 flex gap-4">
                {/* QR Preview */}
                <div className="flex-shrink-0">
                    {previewUrl ? (
                        <img src={previewUrl} alt={code.title} className="w-20 h-20 rounded-xl border border-gray-100 dark:border-white/5" />
                    ) : (
                        <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{code.title}</h3>
                        {!isActive && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-500/30">Paused</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={code.destination_url}>{code.destination_url}</p>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-mono text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded">{code.short_code}</span>
                        <span className="text-xs text-gray-400">{code.scan_count} scans</span>
                        <span className="text-xs text-gray-400">{new Date(code.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 px-4 pb-4 flex-wrap">
                <button
                    onClick={() => onViewAnalytics(code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Analytics
                </button>
                <button
                    onClick={() => onEdit(code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit
                </button>
                <button
                    onClick={() => onToggle(code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isActive ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'}`}
                >
                    {isActive ? 'Pause' : 'Resume'}
                </button>
                <a
                    href={previewUrl}
                    download={`${code.short_code}.png`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    PNG
                </a>
                <button
                    onClick={() => navigator.clipboard?.writeText(scanUrl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={scanUrl}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Copy Link
                </button>
                <button
                    onClick={() => onDelete(code)}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete
                </button>
            </div>
        </div>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

/* ── main page ── */
export default function DynamicQRManager() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewUrls, setPreviewUrls] = useState({}); // id -> dataUrl

    // Create / edit modal
    const [modal, setModal] = useState(null); // null | 'create' | 'edit'
    const [editingCode, setEditingCode] = useState(null);
    const [formTitle, setFormTitle] = useState('');
    const [formDest, setFormDest] = useState('');
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Analytics panel
    const [analyticsCode, setAnalyticsCode] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const token = user?.access_token;

    const loadCodes = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const { codes: data } = await apiFetch('GET', 'qr/codes', null, token);
            setCodes(data || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { navigate('/login'); return; }
        loadCodes();
    }, [authLoading, user, navigate, loadCodes]);

    // Generate preview QR data URLs for loaded codes
    useEffect(() => {
        codes.forEach((code) => {
            if (previewUrls[code.id]) return;
            generatePreviewDataUrl(code.short_code).then((url) => {
                setPreviewUrls((prev) => ({ ...prev, [code.id]: url }));
            }).catch(() => { });
        });
    }, [codes, previewUrls]);

    const openCreate = () => {
        setEditingCode(null);
        setFormTitle('');
        setFormDest('');
        setFormError('');
        setModal('create');
    };

    const openEdit = (code) => {
        setEditingCode(code);
        setFormTitle(code.title);
        setFormDest(code.destination_url);
        setFormError('');
        setModal('edit');
    };

    const closeModal = () => { setModal(null); setEditingCode(null); };

    const submitForm = async () => {
        setFormError('');
        if (!formDest.trim()) { setFormError('Destination URL is required'); return; }
        try {
            const parsed = new URL(formDest);
            if (parsed.protocol !== 'https:') throw new Error('HTTPS required');
        } catch {
            setFormError('Enter a valid HTTPS URL (must start with https://)');
            return;
        }
        setFormLoading(true);
        try {
            if (modal === 'create') {
                const { code } = await apiFetch('POST', 'qr/codes', { title: formTitle, destination_url: formDest }, token);
                setCodes((prev) => [code, ...prev]);
            } else {
                const { code } = await apiFetch('PATCH', `qr/codes/${editingCode.id}`, { title: formTitle, destination_url: formDest }, token);
                setCodes((prev) => prev.map((c) => c.id === code.id ? code : c));
                // Regenerate preview
                setPreviewUrls((prev) => { const n = { ...prev }; delete n[code.id]; return n; });
            }
            closeModal();
        } catch (e) {
            setFormError(e.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (code) => {
        if (!window.confirm(`Delete "${code.title}"? This cannot be undone.`)) return;
        try {
            await apiFetch('DELETE', `qr/codes/${code.id}`, null, token);
            setCodes((prev) => prev.filter((c) => c.id !== code.id));
        } catch (e) {
            setError(e.message);
        }
    };

    const handleToggle = async (code) => {
        try {
            const { code: updated } = await apiFetch('PATCH', `qr/codes/${code.id}`, { is_active: !code.is_active }, token);
            setCodes((prev) => prev.map((c) => c.id === updated.id ? updated : c));
        } catch (e) {
            setError(e.message);
        }
    };

    const handleViewAnalytics = async (code) => {
        setAnalyticsCode(code);
        setAnalyticsData(null);
        setAnalyticsLoading(true);
        try {
            const data = await apiFetch('GET', `qr/codes/${code.id}`, null, token);
            setAnalyticsData(data);
        } catch (e) {
            setAnalyticsData({ error: e.message });
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const totalScans = codes.reduce((s, c) => s + (c.scan_count || 0), 0);
    const activeCount = codes.filter((c) => c.is_active).length;

    if (authLoading || !user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Dynamic QR Codes</h1>
                        <p className="text-gray-500 dark:text-gray-400">Edit destinations after printing. Track scan counts and trends in real time.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Link
                            to="/qr-tools/analytics"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:border-violet-400 transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            Analytics
                        </Link>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-violet-500/30"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            New Dynamic QR
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {codes.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <StatBadge label="Total Codes" value={codes.length} color="violet" />
                        <StatBadge label="Active" value={activeCount} color="green" />
                        <StatBadge label="Total Scans" value={totalScans.toLocaleString()} color="gray" />
                    </div>
                )}

                {error && (
                    <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-500/20">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5 animate-pulse h-36" />
                        ))}
                    </div>
                ) : codes.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 dark:bg-violet-900/20 rounded-2xl mb-4">
                            <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No dynamic QR codes yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create your first code. The printed QR will never go stale — you can always update where it points.</p>
                        <button
                            onClick={openCreate}
                            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors"
                        >
                            Create First Code
                        </button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {codes.map((code) => (
                            <CodeCard
                                key={code.id}
                                code={code}
                                previewUrl={previewUrls[code.id]}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                                onToggle={handleToggle}
                                onViewAnalytics={handleViewAnalytics}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {modal && (
                <Modal title={modal === 'create' ? 'New Dynamic QR Code' : 'Edit QR Code'} onClose={closeModal}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title (optional)</label>
                            <input
                                className={inputCls}
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="e.g. Restaurant Menu, Product Page"
                                maxLength={120}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination URL <span className="text-red-400">*</span></label>
                            <input
                                className={inputCls}
                                value={formDest}
                                onChange={(e) => setFormDest(e.target.value)}
                                placeholder="https://your-destination.com"
                                type="url"
                            />
                            <p className="text-xs text-gray-400 mt-1">You can update this URL anytime. The QR code you print never changes.</p>
                        </div>
                        {formError && (
                            <p className="text-sm text-red-500 dark:text-red-400">{formError}</p>
                        )}
                        <div className="flex gap-3 pt-2">
                            <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                            <button
                                onClick={submitForm}
                                disabled={formLoading}
                                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                            >
                                {formLoading ? 'Saving…' : modal === 'create' ? 'Create QR Code' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Analytics Modal */}
            {analyticsCode && (
                <Modal title={`Analytics — ${analyticsCode.title}`} onClose={() => setAnalyticsCode(null)}>
                    {analyticsLoading ? (
                        <div className="py-8 text-center text-sm text-gray-400">Loading analytics…</div>
                    ) : analyticsData?.error ? (
                        <p className="text-sm text-red-500">{analyticsData.error}</p>
                    ) : analyticsData ? (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <StatBadge label="Total Scans" value={(analyticsData.code?.scan_count || 0).toLocaleString()} color="violet" />
                                <StatBadge label="Last 30 days" value={(analyticsData.scans?.length || 0).toLocaleString()} color="green" />
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">14-day scan trend</p>
                                <ScanTrendChart scans={analyticsData.scans || []} />
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Current Destination</p>
                                <p className="text-sm text-violet-600 dark:text-violet-400 break-all">{analyticsData.code?.destination_url}</p>
                            </div>

                            {analyticsData.scans?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Recent Scans</p>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {analyticsData.scans.slice(0, 20).map((s, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 py-0.5">
                                                <span>{new Date(s.scanned_at).toLocaleString()}</span>
                                                {s.country && <span className="font-mono">{s.country}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </Modal>
            )}
        </div>
    );
}
