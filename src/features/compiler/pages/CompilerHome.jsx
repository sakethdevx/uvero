import React, { useState, useCallback, useEffect, useRef } from 'react';
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
    const prefs = loadPrefs();
    const savedCodes = useRef(loadCodes());

    // State
    const [language, setLanguage] = useState(prefs.language || 'python');
    const [templateName, setTemplateName] = useState('hello');
    const [code, setCode] = useState(savedCodes.current[prefs.language || 'python'] || getLanguageTemplate(prefs.language || 'python'));
    const [stdin, setStdin] = useState('');
    const [fontSize, setFontSize] = useState(prefs.fontSize || 14);
    const [output, setOutput] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
    const [isDark, setIsDark] = useState(true);
    const [historyOpen, setHistoryOpen] = useState(false);

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
            const result = await executeCode(language, code, stdin);
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

    // Share handler
    const handleShare = useCallback(() => {
        return generateShareLink(language, code, stdin);
    }, [generateShareLink, language, code, stdin]);

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
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] text-gray-900 dark:text-white transition-colors duration-500">

            {/* ─── Ambient Background ─── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
                    style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />
                {/* Animated gradient orbs */}
                <div className="absolute top-20 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/20 to-violet-500/20 dark:from-blue-600/10 dark:to-violet-600/10 rounded-full blur-[100px] animate-slow-drift" />
                <div className="absolute -bottom-20 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 dark:from-emerald-600/8 dark:to-cyan-600/8 rounded-full blur-[100px] animate-slow-drift-reverse" />
                <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-600/5 dark:to-pink-600/5 rounded-full blur-[80px] animate-slow-pulse" />
            </div>

            {/* ─── Compact Header ─── */}
            <header className="relative pt-8 pb-4 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: Title & Badge */}
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                                <span className="text-gray-900 dark:text-white">Online </span>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 animate-gradient-x">
                                    Compiler
                                </span>
                            </h1>
                            
                            {/* Discrete pill badge */}
                            <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-white/[0.06] border border-gray-200/50 dark:border-white/10 backdrop-blur-sm shadow-sm">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                </span>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">{LANGUAGES.length} Languages</span>
                            </div>
                        </div>

                        {/* Right: Empty or Action counts */}
                        <div className="flex items-center gap-3">
                            {/* Actions moved to toolbar/statusbar */}
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── IDE Layout ─── */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-6">
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
                                    isLoading={isLoading}
                                    onRun={handleRun}
                                    onReset={handleReset}
                                    onCopy={handleCopy}
                                    onShare={handleShare}
                                    onHistoryToggle={() => setHistoryOpen(true)}
                                    fontSize={fontSize}
                                    onFontSizeChange={setFontSize}
                                />

                                {/* Monaco Editor */}
                                <div className="flex-1 min-h-[350px] lg:min-h-[520px]">
                                    <CodeEditor
                                        language={monacoLang}
                                        value={code}
                                        onChange={setCode}
                                        isDark={isDark}
                                        fontSize={fontSize}
                                        onRun={handleRun}
                                    />
                                </div>

                                {/* Status bar */}
                                <StatusBar
                                    language={currentLang?.id}
                                    onLanguageChange={handleLanguageChange}
                                    cursorPosition={cursorPosition}
                                    charCount={charCount}
                                    lineCount={lineCount}
                                    lastExecTime={output?.execution_time_ms}
                                    status={output?.status}
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

            {/* ─── Features Strip ─── */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-20">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        {
                            icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>),
                            title: 'Instant Execution',
                            desc: 'Cloud-powered sandboxed runtimes',
                            gradient: 'from-amber-400 to-orange-500',
                        },
                        {
                            icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>),
                            title: 'Monaco Editor',
                            desc: 'VS Code powered editing',
                            gradient: 'from-blue-400 to-indigo-500',
                        },
                        {
                            icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
                            title: 'Execution History',
                            desc: 'Last 50 runs, no login needed',
                            gradient: 'from-violet-400 to-purple-500',
                        },
                        {
                            icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>),
                            title: 'Shareable Links',
                            desc: 'Share code via URL in one click',
                            gradient: 'from-emerald-400 to-cyan-500',
                        },
                    ].map((feat, i) => (
                        <div key={i} className="group relative bg-white/60 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.06] rounded-xl p-5 hover:border-gray-300 dark:hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 backdrop-blur-sm">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center text-white mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                {feat.icon}
                            </div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">{feat.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
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
            `}</style>
        </div>
    );
}
