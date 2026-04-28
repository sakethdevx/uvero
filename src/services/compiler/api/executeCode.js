/**
 * Frontend API client for the Uvero Compiler
 */

let activeController = null;

export async function executeCode(language, code, stdin = '', timeout = 10, { analyze = true } = {}) {
    // Cancel any in-flight request
    if (activeController) activeController.abort();
    activeController = new AbortController();

    try {
        const response = await fetch('/api/compiler/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language, code, stdin, timeout, analyze }),
            signal: activeController.signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || `Server error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            return { status: 'cancelled', stdout: '', stderr: 'Execution cancelled', execution_time_ms: 0 };
        }
        console.error('[compilerApi] execution failed:', error);
        throw error;
    } finally {
        activeController = null;
    }
}

export async function getLanguages() {
    try {
        const response = await fetch('/api/compiler/languages');
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('[compilerApi] failed to fetch languages:', error);
        return [];
    }
}
