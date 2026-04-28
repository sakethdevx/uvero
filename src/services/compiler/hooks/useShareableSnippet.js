import { useEffect, useCallback, useRef } from 'react';
import LZString from 'lz-string';

/**
 * Custom hook for encoding/decoding code state in the URL hash.
 * Uses lz-string for compression → URL-safe Base64.
 *
 * @param {Function} onRestore - Called with { language, code, stdin } when a shared snippet is detected in the URL
 * @returns {{ generateShareLink, isSharedSnippet }}
 */
export default function useShareableSnippet(onRestore) {
    const hasRestored = useRef(false);

    // On mount: check if URL hash contains a shared snippet
    useEffect(() => {
        if (hasRestored.current) return;

        try {
            const hash = window.location.hash.slice(1); // remove #
            if (!hash || !hash.startsWith('code=')) return;

            const encoded = hash.slice(5); // remove "code="
            const json = LZString.decompressFromEncodedURIComponent(encoded);
            if (!json) return;

            const data = JSON.parse(json);
            if (data && data.language && data.code) {
                hasRestored.current = true;
                onRestore({
                    language: data.language,
                    code: data.code,
                    stdin: data.stdin || '',
                });

                // Clean up the hash after restoring so it doesn't interfere
                // with future sharing
                window.history.replaceState(null, '', window.location.pathname);
            }
        } catch {
            // Invalid hash — silently ignore
        }
    }, [onRestore]);

    // Generate a shareable link with the current code state
    const generateShareLink = useCallback((language, code, stdin) => {
        try {
            const data = { language, code };
            if (stdin && stdin.trim()) data.stdin = stdin;

            const json = JSON.stringify(data);
            const compressed = LZString.compressToEncodedURIComponent(json);
            const url = `${window.location.origin}${window.location.pathname}#code=${compressed}`;

            // Copy to clipboard
            navigator.clipboard.writeText(url);
            return url;
        } catch {
            return null;
        }
    }, []);

    return {
        generateShareLink,
        isSharedSnippet: hasRestored.current,
    };
}
