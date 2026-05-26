import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import LanguageSelector from '../components/LanguageSelector';
import EditorToolbar from '../components/EditorToolbar';
import OutputPanel from '../components/OutputPanel';
import StdinPanel from '../components/StdinPanel';
import StatusBar from '../components/StatusBar';
import HistoryPanel from '../components/HistoryPanel';
import { LANGUAGES, getLanguageTemplate, getLanguageById } from '../data/languages';
import { executeCode } from '../api/executeCode';
import useExecutionHistory from '../hooks/useExecutionHistory';
import useShareableSnippet from '../hooks/useShareableSnippet';
import { AIServiceShell, CompactServiceHeader, AIBackLink } from '../../../components/AIServiceLayout';

const STORAGE_KEY = 'uvero_compiler_prefs';
const CODE_STORAGE_KEY = 'uvero_compiler_codes';

function loadPrefs() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
}

function savePrefs(prefs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch {}
}

function loadCodes() {
    try {
        return JSON.parse(localStorage.getItem(CODE_STORAGE_KEY)) || {};
    } catch { return {}; }
}

function saveCodes(codes) {
    try { localStorage.setItem(CODE_STORAGE_KEY, JSON.stringify(codes)); } catch {}
}

export default function CompilerHome() {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlLang = searchParams.get('lang');
    const urlCode = searchParams.get('code');
    const prefs = loadPrefs();
    const savedCodes = useRef(loadCodes());

    // State
    const [language, setLanguage] = useState(urlLang || prefs.language || 'python');
    const [templateName, setTemplateName] = useState('hello');
    const [code, setCode] = useState(savedCodes.current[urlLang || prefs.language || 'python'] || getLanguageTemplate(urlLang || prefs.language || 'python'));
    const [stdin, setStdin] = useState('');
    const [fontSize, setFontSize] = useState(prefs.fontSize || 14);
    const [output, setOutput] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
    const [isDark, setIsDark] = useState(true);
    const [historyOpen, setHistoryOpen] = useState(false);

    // Share & fetch states
    const [isSharing, setIsSharing] = useState(false);
    const [shareError, setShareError] = useState('');
    const [shareCode, setShareCode] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [copiedLinkType, setCopiedLinkType] = useState(null); // null | 'compiler' | 'clipboard'
    const [isFetchingCode, setIsFetchingCode] = useState(false);
    const [fetchCodeError, setFetchCodeError] = useState('');

    // Execution history
    const { runs, addRun, deleteRun, clearHistory } = useExecutionHistory();

    // Shareable snippet — restore shared code on mount
    const handleSnippetRestore = useCallback((data) => {
        savedCodes.current[data.language] = data.code;
        saveCodes(savedCodes.current);
        setLanguage(data.language);
        setCode(data.code);
        if (data.stdin) setStdin(data.stdin);
        setOutput(null);
    }, []);

    const { generateShareLink } = useShareableSnippet(handleSnippetRestore);

    // Fetch shared code on mount/param change
    useEffect(() => {
        if (!urlCode) return;

        async function fetchSharedCode() {
            setIsFetchingCode(true);
            setFetchCodeError('');
            try {
                const res = await fetch(`/api/clipboard?code=${encodeURIComponent(urlCode)}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to load shared code');

                if (data.data && data.data.content) {
                    setCode(data.data.content);
                    if (data.data.language) {
                        const matched = getLanguageById(data.data.language);
                        if (matched) {
                            setLanguage(data.data.language);
                        }
                    }
                }
            } catch (err) {
                setFetchCodeError(err.message);
            } finally {
                setIsFetchingCode(false);
                // Clear the parameter so refreshing doesn't overwrite edits
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('code');
                setSearchParams(newParams, { replace: true });
            }
        }

        fetchSharedCode();
    }, [urlCode, searchParams, setSearchParams]);

    const handleCopyLink = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopiedLinkType(type);
        setTimeout(() => setCopiedLinkType(null), 2000);
    };


    // Detect system/site dark mode
    useEffect(() => {
        const checkDark = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkDark();
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Save prefs on change
    useEffect(() => {
        savePrefs({ language, fontSize });
    }, [language, fontSize]);

    // Save code per language
    useEffect(() => {
        savedCodes.current[language] = code;
        saveCodes(savedCodes.current);
    }, [code, language]);

    // Run code
    const handleRun = useCallback(async () => {
        if (isLoading) return;
        setIsLoading(true);
        setOutput(null);
        try {
            const result = await executeCode(language, code, stdin, 10, { analyze: true });
            setOutput(result);

            // Save to execution history
            const lang = getLanguageById(language);
            addRun({
                language,
                languageName: lang?.name || language,
                code,
                stdin,
                status: result.status,
                executionTime: result.execution_time_ms || 0,
                stdout: result.stdout || '',
                stderr: result.stderr || '',
                exitCode: result.exit_code,
                analysis: result.analysis || null,
            });
        } catch (error) {
            setOutput({
                status: 'error',
                stdout: '',
                stderr: error.message || 'Failed to execute code. Please try again.',
                execution_time_ms: 0,
                memory_used_kb: 0,
                exit_code: null,
            });
        } finally {
            setIsLoading(false);
        }
    }, [language, code, stdin, isLoading, addRun]);

    // Switch language
    const handleLanguageChange = useCallback((newLang) => {
        savedCodes.current[language] = code;
        saveCodes(savedCodes.current);
        const savedCode = savedCodes.current[newLang];
        setLanguage(newLang);
        // Always reset to 'hello' template for now as per requirement "default code should be automatically there"
        // If the user wants to preserve edits, we could check savedCode, but "user just need to select language"
        // implies a fresh start with the default template.
        setCode(getLanguageTemplate(newLang, 'hello'));
        setTemplateName('hello');
        setOutput(null);
    }, [language, code]);

    // Sync language from URL if provided
    useEffect(() => {
        if (urlLang && urlLang !== language) {
            handleLanguageChange(urlLang);
        }
    }, [urlLang, language, handleLanguageChange]);

    // Switch template
    const handleTemplateChange = useCallback((tmpl) => {
        setTemplateName(tmpl);
        setCode(getLanguageTemplate(language, tmpl));
    }, [language]);

    // Reset code to template
    const handleReset = useCallback(() => {
        setCode(getLanguageTemplate(language, templateName));
    }, [language, templateName]);

    // Copy code
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code);
    }, [code]);

    const currentLang = getLanguageById(language);
    const monacoLang = currentLang?.monaco || 'plaintext';
    const lineCount = code.split('\n').length;
    const charCount = code.length;

    // Share handler via clipboard API
    const handleShare = useCallback(async () => {
        setIsSharing(true);
        setShareError('');
        setShareCode('');
        try {
            const resp = await fetch('/api/clipboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: code,
                    type: 'public',
                    language: language
                })
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Failed to share code');

            setShareCode(data.data.id);
            setShowShareModal(true);
        } catch (err) {
            setShareError(err.message);
            // Fallback to local url generation
            const localUrl = generateShareLink(language, code, stdin);
            if (localUrl) {
                alert('Clipboard share failed, but a fallback share link has been copied to your clipboard!');
            } else {
                alert(`Failed to share: ${err.message}`);
            }
        } finally {
            setIsSharing(false);
        }
    }, [code, language, stdin, generateShareLink]);

    // Load from history
    const handleLoadRun = useCallback((run) => {
        savedCodes.current[run.language] = run.code;
        saveCodes(savedCodes.current);
        setLanguage(run.language);
        setCode(run.code);
        if (run.stdin) setStdin(run.stdin);
        setOutput(null);
        setHistoryOpen(false);
    }, []);

    return (
        <AIServiceShell>
            <AIBackLink to="/">Back to Hub</AIBackLink>
            <CompactServiceHeader
                eyebrow="Compiler"
                title="Run code"
                description="Editor, stdin, output, history, and sharing stay in one workspace."
            />

            {/* ─── IDE Layout ─── */}
            <section className="relative pb-4">
                {/* Main IDE card with glow border */}
                <div className="relative rounded-2xl overflow-hidden">
                    {/* Glow border effect */}
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-purple-500/30 dark:from-blue-500/20 dark:via-violet-500/20 dark:to-purple-500/20 rounded-2xl blur-sm" />

                    <div className="relative bg-white dark:bg-[#0d1117] rounded-2xl border border-gray-200/50 dark:border-white/[0.08] shadow-2xl shadow-black/5 dark:shadow-black/40 overflow-hidden">
                        <div className="flex flex-col lg:flex-row">
                            {/* ─ Left: Editor ─ */}
                            <div className="flex-1 min-w-0 flex flex-col">
                                {/* Toolbar */}
                                <EditorToolbar
                                    language={language}
                                    onLanguageChange={handleLanguageChange}
                                    isLoading={isLoading}
                                    isSharing={isSharing}
                                    onRun={handleRun}
                                    onReset={handleReset}
                                    onCopy={handleCopy}
                                    onShare={handleShare}
                                    onHistoryToggle={() => setHistoryOpen(true)}
                                    fontSize={fontSize}
                                    onFontSizeChange={setFontSize}
                                />

                                {fetchCodeError && (
                                    <div className="mx-4 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs rounded-xl flex items-center justify-between">
                                        <span>Error loading shared code: {fetchCodeError}</span>
                                        <button onClick={() => setFetchCodeError('')} className="font-bold hover:underline">Dismiss</button>
                                    </div>
                                )}

                                {/* Monaco Editor */}
                                {isFetchingCode ? (
                                    <div className="h-[350px] lg:h-auto lg:flex-1 lg:min-h-[520px] flex flex-col items-center justify-center bg-gray-50/50 dark:bg-white/[0.01]">
                                        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
                                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Retrieving shared code from Clipboard...</p>
                                    </div>
                                ) : (
                                    <div className="h-[350px] lg:h-auto lg:flex-1 lg:min-h-[520px]">
                                        <CodeEditor
                                            language={monacoLang}
                                            value={code}
                                            onChange={setCode}
                                            isDark={isDark}
                                            fontSize={fontSize}
                                            onRun={handleRun}
                                        />
                                    </div>
                                )}

                                {/* Status bar */}
                                <StatusBar
                                    cursorPosition={cursorPosition}
                                    charCount={charCount}
                                    lineCount={lineCount}
                                    lastExecTime={output?.execution_time_ms}
                                />
                            </div>

                            {/* ─ Vertical divider ─ */}
                            <div className="hidden lg:block w-px bg-gray-200/70 dark:bg-white/[0.06]" />
                            <div className="lg:hidden h-px bg-gray-200/70 dark:bg-white/[0.06]" />

                            {/* ─ Right: Input + Output ─ */}
                            <div className="w-full lg:w-[400px] xl:w-[440px] flex flex-col bg-gray-50/50 dark:bg-white/[0.01]">
                                {/* Stdin */}
                                <StdinPanel value={stdin} onChange={setStdin} />

                                {/* Output */}
                                <div className="flex-1 min-h-[280px] lg:min-h-0">
                                    <OutputPanel output={output} isLoading={isLoading} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* History Panel */}
            <HistoryPanel
                isOpen={historyOpen}
                onClose={() => setHistoryOpen(false)}
                runs={runs}
                onLoadRun={handleLoadRun}
                onDeleteRun={deleteRun}
                onClearHistory={clearHistory}
            />

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setShowShareModal(false)}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative w-full max-w-md glass-panel p-6 shadow-2xl flex flex-col items-center text-center animate-scale-up">
                        {/* Title */}
                        <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg mb-4 shadow-md shadow-emerald-500/10 border"
                            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-glass)' }}
                        >
                            ⚡
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">Code Shared Successfully!</h3>
                        <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
                            Your code is stored in the public Uvero Clipboard. Anyone can access or load it.
                        </p>

                        {/* 4-digit code */}
                        <div className="flex items-center justify-center gap-2.5 mb-6">
                            {shareCode.split('').map((digit, i) => (
                                <div 
                                    key={i} 
                                    className="w-12 h-14 bg-white/50 dark:bg-white/[0.02] border rounded-xl flex items-center justify-center text-2xl font-black text-emerald-600 dark:text-emerald-400 shadow-sm"
                                    style={{ borderColor: 'var(--border-glass)' }}
                                >
                                    {digit}
                                </div>
                            ))}
                        </div>

                        {/* Direct Link Input */}
                        <div className="w-full space-y-4 mb-6">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-left mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    Compiler Link (Run & Edit)
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={`${window.location.origin}/compiler?code=${shareCode}`} 
                                        className="flex-1 bg-white/30 dark:bg-black/20 border text-xs rounded-xl px-3 py-2 font-mono text-gray-950 dark:text-gray-200 outline-none"
                                        style={{ borderColor: 'var(--border-glass)' }}
                                        onClick={(e) => e.target.select()}
                                    />
                                    <button
                                        onClick={() => handleCopyLink(`${window.location.origin}/compiler?code=${shareCode}`, 'compiler')}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors min-w-[75px]"
                                    >
                                        {copiedLinkType === 'compiler' ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-left mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    Clipboard Link (Raw Text)
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={`${window.location.origin}/c/${shareCode}`} 
                                        className="flex-1 bg-white/30 dark:bg-black/20 border text-xs rounded-xl px-3 py-2 font-mono text-gray-950 dark:text-gray-200 outline-none"
                                        style={{ borderColor: 'var(--border-glass)' }}
                                        onClick={(e) => e.target.select()}
                                    />
                                    <button
                                        onClick={() => handleCopyLink(`${window.location.origin}/c/${shareCode}`, 'clipboard')}
                                        className="px-4 py-2 bg-white/50 hover:bg-white/80 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border font-bold rounded-xl text-xs transition-colors min-w-[75px]"
                                        style={{ borderColor: 'var(--border-glass)', color: 'var(--text-primary)' }}
                                    >
                                        {copiedLinkType === 'clipboard' ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex w-full gap-2">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="flex-1 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS animations */}
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.2s ease-out both; }

                @keyframes gradient-x {
                    0%, 100% { background-size: 200% 200%; background-position: left center; }
                    50% { background-size: 200% 200%; background-position: right center; }
                }
                .animate-gradient-x { animation: gradient-x 6s ease infinite; }

                @keyframes slow-drift {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(30px, -20px); }
                }
                .animate-slow-drift { animation: slow-drift 20s ease-in-out infinite; }

                @keyframes slow-drift-reverse {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-30px, 20px); }
                }
                .animate-slow-drift-reverse { animation: slow-drift-reverse 25s ease-in-out infinite; }

                @keyframes slow-pulse {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
                .animate-slow-pulse { animation: slow-pulse 15s ease-in-out infinite; }

                @keyframes scale-up {
                    from { opacity: 0; transform: scale(0.95); }
                    to   { opacity: 1; transform: scale(1); }
                }
                .animate-scale-up { animation: scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </AIServiceShell>
    );
}
