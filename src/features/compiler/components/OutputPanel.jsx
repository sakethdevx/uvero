import React, { useState } from 'react';

const STATUS_CONFIG = {
    success: { icon: '✅', label: 'Success', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/80 dark:bg-emerald-500/10', border: 'border-emerald-200/50 dark:border-emerald-500/15', glow: 'shadow-emerald-500/5 dark:shadow-emerald-500/5' },
    runtime_error: { icon: '❌', label: 'Runtime Error', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50/80 dark:bg-red-500/10', border: 'border-red-200/50 dark:border-red-500/15', glow: 'shadow-red-500/5 dark:shadow-red-500/5' },
    compilation_error: { icon: '🔨', label: 'Compilation Error', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/80 dark:bg-amber-500/10', border: 'border-amber-200/50 dark:border-amber-500/15', glow: 'shadow-amber-500/5 dark:shadow-amber-500/5' },
    timeout: { icon: '⏱', label: 'Timeout', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50/80 dark:bg-orange-500/10', border: 'border-orange-200/50 dark:border-orange-500/15', glow: '' },
    error: { icon: '⚠️', label: 'Error', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50/80 dark:bg-red-500/10', border: 'border-red-200/50 dark:border-red-500/15', glow: '' },
    cancelled: { icon: '🚫', label: 'Cancelled', color: 'text-gray-500', bg: 'bg-gray-50/80 dark:bg-white/[0.03]', border: 'border-gray-200/50 dark:border-white/[0.06]', glow: '' },
};

export default function OutputPanel({ output, isLoading }) {
    const [activeTab, setActiveTab] = useState('output');
    const [copied, setCopied] = useState(false);

    // No output yet — empty state
    if (!output && !isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 py-12">
                {/* Terminal icon with pulse */}
                <div className="relative mb-5">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-2xl blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/[0.06] dark:to-white/[0.02] border border-gray-200/50 dark:border-white/[0.08] flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Ready to execute</p>
                <p className="text-xs text-gray-400 dark:text-gray-600">
                    Press{' '}
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.04] border border-gray-200/50 dark:border-white/[0.08] rounded text-[10px] font-mono shadow-sm">⌘ Enter</kbd>
                    {' '}to run your code
                </p>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 py-12">
                {/* Animated wave dots */}
                <div className="flex items-center gap-1.5 mb-5">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-violet-500"
                            style={{
                                animation: 'wave 1.2s ease-in-out infinite',
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Executing on Uvero Cloud…</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">Sandboxed · Secured · Fast</p>

                <style>{`
                    @keyframes wave {
                        0%, 100% { transform: translateY(0); opacity: 0.5; }
                        50% { transform: translateY(-8px); opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    const status = STATUS_CONFIG[output.status] || STATUS_CONFIG.error;
    const hasCompileOutput = output.compile_output && output.compile_output.trim();
    const hasStderr = output.stderr && output.stderr.trim();
    const hasStdout = output.stdout && output.stdout.trim();

    const tabs = [
        { id: 'output', label: 'Output', hasContent: hasStdout },
        { id: 'errors', label: 'Errors', hasContent: hasStderr },
        ...(hasCompileOutput ? [{ id: 'compile', label: 'Compile', hasContent: true }] : []),
    ];

    function getActiveContent() {
        switch (activeTab) {
            case 'output': return output.stdout || '';
            case 'errors': return output.stderr || '';
            case 'compile': return output.compile_output || '';
            default: return '';
        }
    }

    function handleCopy() {
        navigator.clipboard.writeText(getActiveContent());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="h-full flex flex-col">
            {/* Status badge + metrics */}
            <div className={`flex items-center justify-between px-4 py-2.5 ${status.bg} border-b ${status.border} shadow-sm ${status.glow}`}>
                <div className="flex items-center gap-2">
                    <span className="text-sm">{status.icon}</span>
                    <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    {output.execution_time_ms !== undefined && (
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            {output.execution_time_ms.toFixed(0)}ms
                        </span>
                    )}
                    {output.memory_used_kb > 0 && (
                        <span>{(output.memory_used_kb / 1024).toFixed(1)}MB</span>
                    )}
                    {output.exit_code !== null && output.exit_code !== undefined && (
                        <span className={output.exit_code === 0 ? 'text-emerald-500' : 'text-red-400'}>
                            Exit: {output.exit_code}
                        </span>
                    )}
                </div>
            </div>

            {/* Complexity summary */}
            {output.analysis && (
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02] flex flex-wrap items-center gap-3 text-[11px]">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Complexity</span>
                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200 font-mono">
                        {output.analysis.time_complexity?.class || 'unknown'}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-200 font-mono">
                        {output.analysis.space_complexity?.class || 'unknown'}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">method: {output.analysis.time_complexity?.method || 'static'}</span>
                    {output.analysis.static_notes?.length ? (
                        <span className="text-gray-500 dark:text-gray-400 truncate max-w-full">
                            notes: {output.analysis.static_notes.join(' · ')}
                        </span>
                    ) : null}
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 px-3 pt-2.5 pb-0 border-b border-gray-100/70 dark:border-white/[0.04]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-3 py-2 text-xs font-semibold rounded-t-lg transition-all ${
                            activeTab === tab.id
                                ? 'text-gray-800 dark:text-white bg-gray-50/80 dark:bg-white/[0.05] border-b-2 border-violet-500'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                        {tab.label}
                        {tab.hasContent && tab.id === 'errors' && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0d1117]" />
                        )}
                    </button>
                ))}

                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    className="ml-auto p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.04] rounded-lg transition-all"
                    title="Copy output"
                >
                    {copied ? (
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                <pre className={`text-xs font-mono whitespace-pre-wrap break-words leading-relaxed ${
                    activeTab === 'errors' ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'
                }`}>
                    {getActiveContent() || (
                        <span className="text-gray-300 dark:text-gray-600 italic">
                            {activeTab === 'output' ? 'No output' : activeTab === 'errors' ? 'No errors' : 'No compile output'}
                        </span>
                    )}
                </pre>
            </div>
        </div>
    );
}
