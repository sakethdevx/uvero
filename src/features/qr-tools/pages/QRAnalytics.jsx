import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';

/* ── pure-SVG chart helpers ── */

function BarChart({ data, height = 96 }) {
    if (!data || !data.length) return null;
    const max = Math.max(...data.map((d) => d.count), 1);
    const TOTAL = data.length;

    return (
        <svg viewBox={`0 0 ${TOTAL * 14} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
            {data.map((d, i) => {
                const barH = Math.max((d.count / max) * (height - 20), d.count > 0 ? 3 : 1);
                const x = i * 14 + 2;
                const y = height - barH - 14;
                return (
                    <g key={d.date}>
                        <rect
                            x={x} y={y} width={10} height={barH}
                            rx={2}
                            className="fill-violet-400 dark:fill-violet-500"
                            opacity={0.85}
                        />
                        {i % 7 === 0 && (
                            <text x={x + 5} y={height - 2} textAnchor="middle" className="fill-gray-400" fontSize={7}>
                                {d.date.slice(5)}
                            </text>
                        )}
                        <title>{`${d.date}: ${d.count} scans`}</title>
                    </g>
                );
            })}
        </svg>
    );
}

function HBarChart({ data, max }) {
    if (!data || !data.length) return (
        <p className="text-xs text-gray-400 text-center py-4">No scan data yet</p>
    );
    const maxVal = max || Math.max(...data.map((d) => d.count), 1);
    return (
        <div className="space-y-2">
            {data.map((item) => (
                <div key={item.country} className="flex items-center gap-2 text-sm">
                    <span className="w-28 text-right text-gray-600 dark:text-gray-400 text-xs truncate">{item.country}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                        <div
                            className="h-3 rounded-full bg-violet-600 transition-all duration-500"
                            style={{ width: `${(item.count / maxVal) * 100}%` }}
                        />
                    </div>
                    <span className="w-10 text-xs font-semibold text-gray-700 dark:text-gray-300">{item.count.toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
}

function StatCard({ label, value, sub, color }) {
    const textColors = {
        violet: 'text-violet-600 dark:text-violet-400',
        sky: 'text-sky-600 dark:text-sky-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        amber: 'text-amber-600 dark:text-amber-400',
    };
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-3xl font-extrabold ${textColors[color] || 'text-violet-600 dark:text-violet-400'}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    );
}

/* ── CSV export helper ── */
function exportCSV(data) {
    const header = ['date', 'scans'];
    const rows = data.daily_counts.map((d) => [d.date, d.count]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/* ── main page ── */
export default function QRAnalytics() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = user?.access_token;

    const loadAnalytics = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/qr/analytics', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to load analytics');
            setData(json);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { navigate('/login'); return; }
        loadAnalytics();
    }, [authLoading, user, navigate, loadAnalytics]);

    if (authLoading || !user) return null;

    const APP_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            {/* Background decorations */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-[-10rem] top-16 h-96 w-96 rounded-full bg-indigo-500/8 blur-3xl" />
                <div className="absolute right-[-8rem] top-8 h-80 w-80 rounded-full bg-blue-500/8 blur-3xl" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link
                    to="/qr-tools"
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.08]"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to QR Tools
                </Link>

                {/* Header card */}
                <div className="mt-8 rounded-3xl border border-gray-200/80 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-8 shadow-xl shadow-indigo-100/40 dark:border-white/[0.08] dark:from-indigo-500/10 dark:via-gray-950 dark:to-blue-500/10 dark:shadow-none sm:p-10">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-300">QR Analytics</p>
                            <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                                QR Analytics Dashboard
                            </h1>
                            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                Scan trends, country breakdown, and top performing codes — last 30 days.
                            </p>
                        </div>
                        {data && data.total_codes > 0 && (
                            <button
                                onClick={() => exportCSV(data)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:border-violet-400 transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Export CSV
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-500/20">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5 h-24 animate-pulse" />
                            ))}
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 h-48 animate-pulse" />
                    </div>
                ) : !data || data.total_codes === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 dark:bg-violet-900/20 rounded-2xl mb-4">
                            <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No analytics yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">Create some dynamic QR codes and share them. Scan data will appear here.</p>
                        <Link to="/qr-tools/dynamic" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors text-sm">
                            Create Dynamic QR Code
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Total Codes" value={data.total_codes.toLocaleString()} sub={`${data.active_codes} active`} color="violet" />
                            <StatCard label="All-time Scans" value={data.total_scans.toLocaleString()} color="sky" />
                            <StatCard label="Scans (30d)" value={data.scans_last_30d.toLocaleString()} sub="last 30 days" color="emerald" />
                            <StatCard
                                label="Avg / Code"
                                value={data.total_codes > 0 ? Math.round(data.total_scans / data.total_codes).toLocaleString() : '0'}
                                sub="all-time avg scans"
                                color="amber"
                            />
                        </div>

                        {/* 30-day bar chart */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">30-Day Scan Trend</p>
                                <p className="text-xs text-gray-400">{data.scans_last_30d.toLocaleString()} scans</p>
                            </div>
                            {data.scans_last_30d === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-6">No scans in the last 30 days</p>
                            ) : (
                                <BarChart data={data.daily_counts} height={96} />
                            )}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Country breakdown */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Top Countries (30d)</p>
                                <HBarChart
                                    data={data.country_breakdown}
                                    max={Math.max(...(data.country_breakdown.map((d) => d.count)), 1)}
                                />
                            </div>

                            {/* Top codes */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Top Performing Codes</p>
                                {data.top_codes.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4">No codes yet</p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {data.top_codes.map((code, i) => (
                                            <div key={code.id} className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{code.title || code.short_code}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{`${APP_ORIGIN}/qr/r/${code.short_code}`}</p>
                                                </div>
                                                <span className="text-sm font-bold text-violet-600 dark:text-violet-400 whitespace-nowrap">{(code.scan_count || 0).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Per-code table */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Top 10 Codes</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50 dark:border-white/5">
                                            <th className="px-6 py-3 font-semibold">Title</th>
                                            <th className="px-4 py-3 font-semibold">Short Code</th>
                                            <th className="px-4 py-3 font-semibold">Status</th>
                                            <th className="px-4 py-3 font-semibold text-right">Scans</th>
                                            <th className="px-4 py-3 font-semibold">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                        {data.top_codes.map((code) => (
                                            <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{code.title || '—'}</td>
                                                <td className="px-4 py-3 font-mono text-violet-600 dark:text-violet-400 text-xs">{code.short_code}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${code.is_active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
                                                        {code.is_active ? 'Active' : 'Paused'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{(code.scan_count || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(code.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
