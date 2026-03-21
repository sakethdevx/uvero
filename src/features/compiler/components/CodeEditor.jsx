import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { UVERO_DARK, UVERO_LIGHT, THEME_NAME_DARK, THEME_NAME_LIGHT } from '../data/themes';

export default function CodeEditor({ language, value, onChange, isDark = true, fontSize = 14, onRun }) {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);

    function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Register custom themes
        monaco.editor.defineTheme(THEME_NAME_DARK, UVERO_DARK);
        monaco.editor.defineTheme(THEME_NAME_LIGHT, UVERO_LIGHT);
        monaco.editor.setTheme(isDark ? THEME_NAME_DARK : THEME_NAME_LIGHT);

        // Keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            onRun?.();
        });

        // Prevent Ctrl+S browser save dialog
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            // no-op
        });

        // Focus editor
        editor.focus();
    }

    // Sync theme on dark mode change
    useEffect(() => {
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(isDark ? THEME_NAME_DARK : THEME_NAME_LIGHT);
        }
    }, [isDark]);

    return (
        <div className="h-full w-full overflow-hidden">
            <Editor
                height="100%"
                language={language}
                value={value}
                onChange={(val) => onChange(val || '')}
                onMount={handleEditorDidMount}
                theme={isDark ? THEME_NAME_DARK : THEME_NAME_LIGHT}
                loading={
                    <div className="flex items-center justify-center h-full bg-[#0f1419]">
                        <div className="flex items-center gap-3 text-gray-400">
                            <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" />
                            Loading editor...
                        </div>
                    </div>
                }
                options={{
                    fontSize,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    fontLigatures: true,
                    lineNumbers: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorSmoothCaretAnimation: 'on',
                    cursorBlinking: 'smooth',
                    bracketPairColorization: { enabled: true },
                    autoClosingBrackets: 'always',
                    autoClosingQuotes: 'always',
                    formatOnPaste: true,
                    renderLineHighlight: 'all',
                    roundedSelection: true,
                    padding: { top: 16, bottom: 16 },
                    suggest: { showSnippets: true },
                    wordWrap: 'on',
                    tabSize: 4,
                    automaticLayout: true,
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                    scrollbar: {
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                        useShadows: false,
                    },
                }}
            />
        </div>
    );
}
