import { useState, useCallback } from 'react';

const HISTORY_KEY = 'uvero_compiler_history';
const MAX_ENTRIES = 50;

function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
        return [];
    }
}

function saveHistory(runs) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(runs));
    } catch { /* localStorage full or blocked */ }
}

/**
 * Custom hook for managing execution history in localStorage.
 * Stores last 50 runs with code, language, stdin, output, and metadata.
 */
export default function useExecutionHistory() {
    const [runs, setRuns] = useState(loadHistory);

    const addRun = useCallback((entry) => {
        setRuns((prev) => {
            const newRun = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                language: entry.language,
                languageName: entry.languageName || entry.language,
                code: entry.code,
                stdin: entry.stdin || '',
                status: entry.status || 'success',
                executionTime: entry.executionTime || 0,
                stdout: (entry.stdout || '').slice(0, 500),   // Trim to save space
                stderr: (entry.stderr || '').slice(0, 500),
                exitCode: entry.exitCode ?? null,
                analysis: entry.analysis || null,
            };
            const updated = [newRun, ...prev].slice(0, MAX_ENTRIES);
            saveHistory(updated);
            return updated;
        });
    }, []);

    const deleteRun = useCallback((id) => {
        setRuns((prev) => {
            const updated = prev.filter((r) => r.id !== id);
            saveHistory(updated);
            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setRuns([]);
        saveHistory([]);
    }, []);

    return { runs, addRun, deleteRun, clearHistory };
}
