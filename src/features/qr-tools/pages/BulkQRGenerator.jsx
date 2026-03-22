import { useState, useRef, useCallback, useEffect } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

/* ── helpers ── */
const HISTORY_KEY = 'uvero_qr_bulk_history';

function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(history) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20))); } catch { /* ignore */ }
}

function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) return { headers: [], rows: [] };
    const parseLine = (line) => {
        const cols = [];
        let inQuote = false, cur = '';
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { inQuote = !inQuote; }
            else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
            else cur += ch;
        }
        cols.push(cur.trim());
        return cols;
    };
    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map((l) => {
        const vals = parseLine(l);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
        return obj;
    });
    return { headers, rows };
}

function parsePasteList(text) {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
    const headers = ['content', 'label'];
    const rows = lines.map((l) => {
        const tab = l.indexOf('\t');
        if (tab !== -1) return { content: l.slice(0, tab).trim(), label: l.slice(tab + 1).trim() };
        return { content: l.trim(), label: '' };
    });
    return { headers, rows };
}

async function generateQRDataUrl(content, opts) {
    return QRCode.toDataURL(content, {
        width: opts.size || 400,
        errorCorrectionLevel: opts.errorLevel || 'M',
        color: { dark: opts.darkColor || '#000000', light: opts.lightColor || '#ffffff' },
        margin: 4,
    });
}

const EXPORT_OPTS = { size: 400, errorLevel: 'M', darkColor: '#000000', lightColor: '#ffffff' };

/* ── sub-components ── */
function TabBtn({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
            {children}
        </button>
    );
}

function Badge({ color, children }) {
    const colors = {
        green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20',
        yellow: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${colors[color]}`}>{children}</span>;
}

const inputCls = 'w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';

/* ── main component ── */
export default function BulkQRGenerator() {
    const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'csv'
    const [pasteText, setPasteText] = useState('');
    const [csvText, setCsvText] = useState('');
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [rows, setRows] = useState([]);
    const [contentCol, setContentCol] = useState('');
    const [labelCol, setLabelCol] = useState('');
    const [prefix, setPrefix] = useState('');
    const [suffix, setSuffix] = useState('');
    const [darkColor, setDarkColor] = useState('#000000');
    const [lightColor, setLightColor] = useState('#ffffff');
    const [qrSize, setQrSize] = useState(400);
    const [errorLevel, setErrorLevel] = useState('M');

    const [generated, setGenerated] = useState([]); // [{label, content, dataUrl, error}]
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [history, setHistory] = useState(() => loadHistory());
    const [activeHistoryId, setActiveHistoryId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    const fileInputRef = useRef(null);

    // Parse paste input
    const parsedPaste = useCallback(() => {
        if (!pasteText.trim()) return { headers: [], rows: [] };
        return parsePasteList(pasteText);
    }, [pasteText]);

    // Parse CSV
    useEffect(() => {
        if (!csvText.trim()) { setCsvHeaders([]); setRows([]); return; }
        const { headers, rows: r } = parseCSV(csvText);
        setCsvHeaders(headers);
        setRows(r);
        if (headers.length && !contentCol) setContentCol(headers[0]);
    }, [csvText, contentCol]);

    const effectiveRows = useCallback(() => {
        if (inputMode === 'paste') {
            const { rows: r } = parsedPaste();
            return r.map((row) => ({
                content: (prefix + row.content + suffix).trim(),
                label: row.label || row.content.slice(0, 40),
            }));
        }
        if (inputMode === 'csv') {
            return rows.map((row) => ({
                content: (prefix + (row[contentCol] || '') + suffix).trim(),
                label: labelCol ? (row[labelCol] || row[contentCol] || '') : (row[contentCol] || ''),
            }));
        }
        return [];
    }, [inputMode, parsedPaste, rows, contentCol, labelCol, prefix, suffix]);

    const handleCSVFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setCsvText(ev.target.result);
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const generate = useCallback(async () => {
        const eRows = effectiveRows();
        if (!eRows.length) { setError('No rows to generate. Please add some data.'); return; }

        const validRows = eRows.filter((r) => r.content.trim());
        const invalidCount = eRows.length - validRows.length;

        if (!validRows.length) { setError('All rows are empty. Please check your content column.'); return; }
        setError('');
        setGenerating(true);
        setProgress(0);
        setGenerated([]);

        const results = [];
        for (let i = 0; i < eRows.length; i++) {
            const row = eRows[i];
            if (!row.content.trim()) {
                results.push({ ...row, dataUrl: null, error: 'Empty content' });
            } else {
                try {
                    const dataUrl = await generateQRDataUrl(row.content, { size: qrSize, errorLevel, darkColor, lightColor });
                    results.push({ ...row, dataUrl, error: null });
                } catch {
                    results.push({ ...row, dataUrl: null, error: 'Failed to generate' });
                }
            }
            setProgress(Math.round(((i + 1) / eRows.length) * 100));
        }

        setGenerated(results);
        setGenerating(false);

        // Save to history
        const histEntry = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            mode: inputMode,
            totalCount: eRows.length,
            successCount: results.filter((r) => r.dataUrl).length,
            failedCount: results.filter((r) => r.error && r.dataUrl === null).length,
            invalidCount,
            rows: results,
        };
        const newHistory = [histEntry, ...history];
        setHistory(newHistory);
        saveHistory(newHistory);
        setActiveHistoryId(histEntry.id);
    }, [effectiveRows, qrSize, errorLevel, darkColor, lightColor, inputMode, history]);

    const downloadZIP = useCallback(async () => {
        const items = generated.filter((r) => r.dataUrl);
        if (!items.length) return;
        const zip = new JSZip();
        const folder = zip.folder('qr-codes');
        items.forEach((item, idx) => {
            const name = (item.label || `qr-${idx + 1}`).replace(/[^a-z0-9_-]/gi, '_').slice(0, 60);
            const b64 = item.dataUrl.split(',')[1];
            folder.file(`${name}.png`, b64, { base64: true });
        });
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `qr-batch-${Date.now()}.zip`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
    }, [generated]);

    const downloadPDF = useCallback(() => {
        const items = generated.filter((r) => r.dataUrl);
        if (!items.length) return;

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PAGE_W = 210, PAGE_H = 297;
        const MARGIN = 12;
        const COLS = 3;
        const QR_MM = (PAGE_W - MARGIN * 2 - (COLS - 1) * 6) / COLS; // ~58mm
        const LABEL_H = 8;
        const CELL_H = QR_MM + LABEL_H + 4;

        let x = MARGIN, y = MARGIN, col = 0;

        items.forEach((item, idx) => {
            pdf.addImage(item.dataUrl, 'PNG', x, y, QR_MM, QR_MM);
            pdf.setFontSize(7);
            pdf.setTextColor(60, 60, 60);
            const labelText = (item.label || item.content).slice(0, 35);
            pdf.text(labelText, x + QR_MM / 2, y + QR_MM + 4, { align: 'center' });

            col++;
            if (col >= COLS) {
                col = 0;
                x = MARGIN;
                y += CELL_H + 4;
                if (y + CELL_H > PAGE_H - MARGIN) {
                    if (idx < items.length - 1) { pdf.addPage(); y = MARGIN; }
                }
            } else {
                x += QR_MM + 6;
            }
        });

        pdf.save(`qr-batch-${Date.now()}.pdf`);
    }, [generated]);

    const exportFailedCSV = useCallback(() => {
        const failed = generated.filter((r) => r.error);
        if (!failed.length) return;
        const csv = ['label,content,error', ...failed.map((r) => `"${r.label}","${r.content}","${r.error}"`)].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `qr-failed-${Date.now()}.csv`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
    }, [generated]);

    const rerunFromHistory = (entry) => {
        setGenerated(entry.rows);
        setActiveHistoryId(entry.id);
        setShowHistory(false);
    };

    const deleteHistory = (id) => {
        const updated = history.filter((h) => h.id !== id);
        setHistory(updated);
        saveHistory(updated);
        if (activeHistoryId === id) setActiveHistoryId(null);
    };

    const eRows = effectiveRows();
    const successCount = generated.filter((r) => r.dataUrl).length;
    const failedCount = generated.filter((r) => r.error).length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Bulk QR Generator</h1>
                        <p className="text-gray-500 dark:text-gray-400">Generate hundreds of QR codes from a CSV file or paste list, then export as ZIP or printable PDF.</p>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-violet-400 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Batch History ({history.length})
                        </button>
                    )}
                </div>

                {/* History panel */}
                {showHistory && (
                    <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Batch History</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {history.map((h) => (
                                <div key={h.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${activeHistoryId === h.id ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/10' : 'border-gray-100 dark:border-white/5 hover:border-violet-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {new Date(h.createdAt).toLocaleString()} — {h.mode === 'csv' ? 'CSV' : 'Paste'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge color="green">{h.successCount} OK</Badge>
                                                {h.failedCount > 0 && <Badge color="red">{h.failedCount} failed</Badge>}
                                                <span className="text-xs text-gray-400">{h.totalCount} total</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => rerunFromHistory(h)} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">View</button>
                                        <button onClick={() => deleteHistory(h.id)} className="text-xs text-gray-400 hover:text-red-500">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
                    {/* Left: Config */}
                    <div className="space-y-6">
                        {/* Input mode */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
                            <div className="flex gap-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-xl mb-5">
                                <TabBtn active={inputMode === 'paste'} onClick={() => { setInputMode('paste'); setGenerated([]); }}>📋 Paste List</TabBtn>
                                <TabBtn active={inputMode === 'csv'} onClick={() => { setInputMode('csv'); setGenerated([]); }}>📄 CSV Upload</TabBtn>
                            </div>

                            {inputMode === 'paste' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">One item per line (optionally tab-separated: content{'\t'}label)</label>
                                        <textarea
                                            className={inputCls}
                                            rows={8}
                                            value={pasteText}
                                            onChange={(e) => { setPasteText(e.target.value); setGenerated([]); }}
                                            placeholder={"https://example.com\thttps://uvero.in\thttps://github.com\tGitHub"}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">{parsedPaste().rows.length} items detected</p>
                                </div>
                            )}

                            {inputMode === 'csv' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
                                        >
                                            Upload CSV
                                        </button>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">or paste CSV below</span>
                                        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSVFile} />
                                    </div>
                                    <textarea
                                        className={inputCls}
                                        rows={5}
                                        value={csvText}
                                        onChange={(e) => { setCsvText(e.target.value); setGenerated([]); }}
                                        placeholder={"url,name,description\nhttps://example.com,Example,My website\nhttps://github.com,GitHub,Code hosting"}
                                    />
                                    {csvHeaders.length > 0 && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content Column <span className="text-red-400">*</span></label>
                                                <select className={inputCls} value={contentCol} onChange={(e) => { setContentCol(e.target.value); setGenerated([]); }}>
                                                    <option value="">-- select --</option>
                                                    {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label Column (optional)</label>
                                                <select className={inputCls} value={labelCol} onChange={(e) => { setLabelCol(e.target.value); setGenerated([]); }}>
                                                    <option value="">-- none --</option>
                                                    {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    {rows.length > 0 && (
                                        <p className="text-xs text-gray-400">{rows.length} rows parsed from CSV</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content transform */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Content Transform</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Prefix (prepend to each)</label>
                                    <input className={inputCls} value={prefix} onChange={(e) => { setPrefix(e.target.value); setGenerated([]); }} placeholder="https://" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Suffix (append to each)</label>
                                    <input className={inputCls} value={suffix} onChange={(e) => { setSuffix(e.target.value); setGenerated([]); }} placeholder="?utm_source=qr" />
                                </div>
                            </div>
                        </div>

                        {/* Design options */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">QR Design (applies to all)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">QR Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={darkColor} onChange={(e) => { setDarkColor(e.target.value); setGenerated([]); }} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer" />
                                        <span className="text-xs text-gray-500 font-mono">{darkColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Background</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={lightColor} onChange={(e) => { setLightColor(e.target.value); setGenerated([]); }} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer" />
                                        <span className="text-xs text-gray-500 font-mono">{lightColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Error Correction</label>
                                    <select className={inputCls} value={errorLevel} onChange={(e) => { setErrorLevel(e.target.value); setGenerated([]); }}>
                                        <option value="L">Low (7%)</option>
                                        <option value="M">Medium (15%)</option>
                                        <option value="Q">Quartile (25%)</option>
                                        <option value="H">High (30%)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Output Size</label>
                                    <select className={inputCls} value={qrSize} onChange={(e) => { setQrSize(Number(e.target.value)); setGenerated([]); }}>
                                        <option value={200}>200px (small)</option>
                                        <option value={400}>400px (standard)</option>
                                        <option value={800}>800px (large)</option>
                                        <option value={1024}>1024px (print)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Validation preview */}
                        {eRows.length > 0 && !generated.length && (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Preview — {eRows.length} items</p>
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {eRows.slice(0, 10).map((r, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <span className="w-6 text-xs text-gray-400 text-right flex-shrink-0">{i + 1}.</span>
                                            {r.content ? (
                                                <span className="text-gray-700 dark:text-gray-300 truncate">{r.content}</span>
                                            ) : (
                                                <span className="text-red-400 text-xs">— empty, will be skipped —</span>
                                            )}
                                        </div>
                                    ))}
                                    {eRows.length > 10 && <p className="text-xs text-gray-400 pt-1">…and {eRows.length - 10} more</p>}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-500/20">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={generate}
                            disabled={generating || !eRows.length}
                            className="w-full py-3.5 bg-violet-600 text-white font-bold rounded-xl shadow-sm hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {generating ? `Generating… ${progress}%` : `Generate ${eRows.length || ''} QR Codes`}
                        </button>

                        {/* Progress bar */}
                        {generating && (
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                <div className="bg-violet-500 h-2 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
                            </div>
                        )}
                    </div>

                    {/* Right: Results */}
                    <div className="lg:sticky lg:top-24 space-y-4">
                        {generated.length > 0 && (
                            <>
                                {/* Stats */}
                                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Results</p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <Badge color="green">{successCount} generated</Badge>
                                        {failedCount > 0 && <Badge color="red">{failedCount} failed</Badge>}
                                    </div>

                                    {/* Export buttons */}
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <button
                                            onClick={downloadZIP}
                                            disabled={!successCount}
                                            className="flex items-center justify-center gap-1.5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            ZIP (PNG)
                                        </button>
                                        <button
                                            onClick={downloadPDF}
                                            disabled={!successCount}
                                            className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:border-violet-400 transition-colors disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                            A4 PDF
                                        </button>
                                        {failedCount > 0 && (
                                            <button
                                                onClick={exportFailedCSV}
                                                className="col-span-2 flex items-center justify-center gap-1.5 py-2 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                            >
                                                Export {failedCount} failed rows as CSV
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Preview grid */}
                                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Preview</p>
                                    <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                                        {generated.map((item, i) => (
                                            <div key={i} className={`rounded-xl overflow-hidden border ${item.error ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-white/5'}`}>
                                                {item.dataUrl ? (
                                                    <a href={item.dataUrl} download={`${(item.label || `qr-${i + 1}`).replace(/[^a-z0-9]/gi, '_')}.png`}>
                                                        <img src={item.dataUrl} alt={item.label} className="w-full aspect-square object-contain" title={item.content} />
                                                    </a>
                                                ) : (
                                                    <div className="w-full aspect-square flex items-center justify-center text-xs text-red-400 p-2 text-center">{item.error}</div>
                                                )}
                                                <p className="text-xs text-gray-500 dark:text-gray-400 px-1.5 pb-1.5 truncate text-center">{item.label || `#${i + 1}`}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {!generated.length && (
                            <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl p-5 text-sm text-violet-700 dark:text-violet-300 space-y-2">
                                <p className="font-semibold">💡 Tips for bulk generation</p>
                                <p>• CSV: First row must be a header. Map the right column.</p>
                                <p>• Paste mode: one item per line. Optionally add a tab-separated label.</p>
                                <p>• Use <strong>Prefix/Suffix</strong> to append tracking parameters or base URLs.</p>
                                <p>• ZIP export gives one PNG per QR, named by label.</p>
                                <p>• PDF export creates A4 sheets, 3 QR codes per row.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
