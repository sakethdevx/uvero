import React, { useState } from 'react';

const STATUS_CONFIG = {
    success: { icon: '✅', label: 'Success', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
    runtime_error: { icon: '❌', label: 'Runtime Error', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20' },
    compilation_error: { icon: '🔨', label: 'Compilation Error', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
    timeout: { icon: '⏱', label: 'Timeout', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20' },
    error: { icon: '⚠️', label: 'Error', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20' },
    cancelled: { icon: '🚫', label: 'Cancelled', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-white/5', border: 'border-gray-200 dark:border-white/10' },
};

export default function OutputPanel({ output, isLoading }) {
    const [activeTab, setActiveTab] = useState('output');
    const [copied, setCopied] = useState(false);

    // No output yet — empty state
    if (!output && !isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-1">Ready to execute</p>
                <p className="text-xs text-gray-300 dark:text-gray-600">
                    Hit <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-[10px] font-mono">⌘ Enter</kbd> to run
                </p>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="flex items-center gap-1.5 mb-4">
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Executing on Uvero Cloud...</p>
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
            <div className={`flex items-center justify-between px-4 py-2.5 ${status.bg} border-b ${status.border} rounded-t-xl`}>
                <div className="flex items-center gap-2">
                    <span className="text-sm">{status.icon}</span>
                    <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    {output.execution_time_ms !== undefined && (
                        <span>⚡ {output.execution_time_ms.toFixed(0)}ms</span>
                    )}
                    {output.memory_used_kb > 0 && (
                        <span>💾 {(output.memory_used_kb / 1024).toFixed(1)}MB</span>
                    )}
                    {output.exit_code !== null && output.exit_code !== undefined && (
                        <span>Exit: {output.exit_code}</span>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-3 pt-2 border-b border-gray-100 dark:border-white/5">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all ${
                            activeTab === tab.id
                                ? 'text-gray-800 dark:text-white bg-gray-50 dark:bg-white/5'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                        {tab.label}
                        {tab.hasContent && tab.id === 'errors' && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                        )}
                    </button>
                ))}

                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    className="ml-auto p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
