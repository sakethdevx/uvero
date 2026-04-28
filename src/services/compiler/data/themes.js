/**
 * Custom Monaco Editor themes for Uvero
 * Synced with the Uvero design system
 */

export const UVERO_DARK = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },        // purple-400
        { token: 'string', foreground: '34d399' },          // emerald-400
        { token: 'number', foreground: 'fb923c' },          // orange-400
        { token: 'type', foreground: '38bdf8' },            // sky-400
        { token: 'function', foreground: '60a5fa' },        // blue-400
        { token: 'variable', foreground: 'e2e8f0' },        // slate-200
        { token: 'constant', foreground: 'f472b6' },        // pink-400
        { token: 'operator', foreground: '94a3b8' },        // slate-400
        { token: 'delimiter', foreground: '94a3b8' },
        { token: 'tag', foreground: 'f87171' },             // red-400
        { token: 'attribute.name', foreground: 'fbbf24' },  // amber-400
        { token: 'attribute.value', foreground: '34d399' },
    ],
    colors: {
        'editor.background': '#0f1419',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#1e293b80',
        'editor.selectionBackground': '#334155',
        'editor.inactiveSelectionBackground': '#1e293b',
        'editorCursor.foreground': '#38bdf8',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.selectionHighlightBackground': '#334155aa',
        'editorBracketMatch.background': '#38bdf820',
        'editorBracketMatch.border': '#38bdf850',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#334155',
        'editorWidget.background': '#1e293b',
        'editorWidget.border': '#334155',
        'editorSuggestWidget.background': '#1e293b',
        'editorSuggestWidget.border': '#334155',
        'editorSuggestWidget.selectedBackground': '#334155',
        'scrollbarSlider.background': '#33415580',
        'scrollbarSlider.hoverBackground': '#475569',
        'scrollbarSlider.activeBackground': '#64748b',
        'minimap.background': '#0f1419',
    },
};

export const UVERO_LIGHT = {
    base: 'vs',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c3aed' },        // violet-600
        { token: 'string', foreground: '059669' },          // emerald-600
        { token: 'number', foreground: 'ea580c' },          // orange-600
        { token: 'type', foreground: '0284c7' },            // sky-600
        { token: 'function', foreground: '2563eb' },        // blue-600
        { token: 'variable', foreground: '1e293b' },        // slate-800
        { token: 'constant', foreground: 'db2777' },        // pink-600
        { token: 'operator', foreground: '64748b' },        // slate-500
        { token: 'delimiter', foreground: '64748b' },
        { token: 'tag', foreground: 'dc2626' },             // red-600
        { token: 'attribute.name', foreground: 'd97706' },  // amber-600
        { token: 'attribute.value', foreground: '059669' },
    ],
    colors: {
        'editor.background': '#fafbfc',
        'editor.foreground': '#1e293b',
        'editor.lineHighlightBackground': '#f1f5f920',
        'editor.selectionBackground': '#bfdbfe',
        'editor.inactiveSelectionBackground': '#e2e8f0',
        'editorCursor.foreground': '#2563eb',
        'editorLineNumber.foreground': '#cbd5e1',
        'editorLineNumber.activeForeground': '#64748b',
        'editor.selectionHighlightBackground': '#bfdbfe80',
        'editorBracketMatch.background': '#2563eb15',
        'editorBracketMatch.border': '#2563eb40',
        'editorIndentGuide.background': '#f1f5f9',
        'editorIndentGuide.activeBackground': '#e2e8f0',
        'editorWidget.background': '#ffffff',
        'editorWidget.border': '#e2e8f0',
        'editorSuggestWidget.background': '#ffffff',
        'editorSuggestWidget.border': '#e2e8f0',
        'scrollbarSlider.background': '#94a3b840',
        'scrollbarSlider.hoverBackground': '#94a3b860',
        'minimap.background': '#fafbfc',
    },
};

export const THEME_NAME_DARK = 'uvero-dark';
export const THEME_NAME_LIGHT = 'uvero-light';
