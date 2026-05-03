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
import { AIServiceShell, CompactServiceHeader } from '../../../components/AIServiceLayout';

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
    const [searchParams] = useSearchParams();
    const urlLang = searchParams.get('lang');
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

    // Sync language from URL if provided
    useEffect(() => {
        if (urlLang && urlLang !== language) {
            handleLanguageChange(urlLang);
        }
    }, [urlLang, language, handleLanguageChange]);

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
        <AIServiceShell>
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
                                    onRun={handleRun}
                                    onReset={handleReset}
                                    onCopy={handleCopy}
                                    onShare={handleShare}
                                    onHistoryToggle={() => setHistoryOpen(true)}
                                    fontSize={fontSize}
                                    onFontSizeChange={setFontSize}
                                />

                                {/* Monaco Editor */}
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
        </AIServiceShell>
    );
}
