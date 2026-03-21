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
        // Save current code for current language
        savedCodes.current[language] = code;
        saveCodes(savedCodes.current);

        // Load code for new language (saved or template)
        const savedCode = savedCodes.current[newLang];
        setLanguage(newLang);
        setCode(savedCode || getLanguageTemplate(newLang));
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
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/8 dark:bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/8 dark:bg-violet-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 dark:bg-cyan-500/3 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <section className="relative pt-20 pb-6 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {LANGUAGES.length} Languages · Cloud Sandboxed
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                                Online{' '}
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600">
                                    Compiler
                                </span>
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Write, compile & run code in {LANGUAGES.length}+ languages — no setup needed
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <LanguageSelector
                                selectedLanguage={language}
                                onLanguageChange={handleLanguageChange}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* IDE Layout */}
            <section className="relative max-w-7xl mx-auto px-4 pb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left: Editor */}
                    <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-gray-900/30 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
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
                            templateName={templateName}
                            onTemplateChange={handleTemplateChange}
                        />

                        {/* Monaco Editor */}
                        <div className="flex-1 min-h-[300px] lg:min-h-[500px]">
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
                            language={currentLang}
                            cursorPosition={cursorPosition}
                            charCount={charCount}
                            lineCount={lineCount}
                            lastExecTime={output?.execution_time_ms}
                            status={output?.status}
                        />
                    </div>

                    {/* Right: Input + Output */}
                    <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-3">
                        {/* Stdin */}
                        <StdinPanel value={stdin} onChange={setStdin} />

                        {/* Output */}
                        <div className="flex-1 min-h-[250px] lg:min-h-0 bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
                            <OutputPanel output={output} isLoading={isLoading} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features strip */}
            <section className="relative max-w-7xl mx-auto px-4 pb-16">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: '⚡', title: 'Instant Execution', desc: 'Cloud-powered sandboxed runtimes' },
                        { icon: '🎨', title: 'Monaco Editor', desc: 'VS Code powered editing experience' },
                        { icon: '🕐', title: 'Execution History', desc: 'Last 50 runs stored locally, no login' },
                        { icon: '🔗', title: 'Shareable Links', desc: 'Share code via URL in one click' },
                    ].map((feat, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-xl p-4 hover:border-gray-200 dark:hover:border-white/10 transition-all">
                            <span className="text-2xl mb-2 block">{feat.icon}</span>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-0.5">{feat.title}</h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-500">{feat.desc}</p>
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
            `}</style>
        </div>
    );
}
