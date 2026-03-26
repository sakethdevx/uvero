const VERSION_KEY = 'uvero_app_version';

/**
 * Fetches /version.json bypassing all caches and compares with the version
 * stored in localStorage. If a newer version is detected, all Service Worker
 * caches are cleared and the page is hard-reloaded so iOS PWA users always
 * receive the latest build.
 *
 * @returns {Promise<boolean>} true when the app should continue loading,
 *   false when a reload has been triggered.
 */
export async function checkVersion() {
    try {
        const response = await fetch('/version.json', { cache: 'no-store' });
        if (!response.ok) return true;

        const { version } = await response.json();
        const storedVersion = localStorage.getItem(VERSION_KEY);

        if (storedVersion && storedVersion !== version) {
            // Persist the new version before reloading to avoid reload loops
            localStorage.setItem(VERSION_KEY, version);

            // Clear all Service Worker caches so the browser fetches fresh assets
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map((name) => caches.delete(name)));
            }

            window.location.reload();
            return false;
        }

        localStorage.setItem(VERSION_KEY, version);
        return true;
    } catch {
        // Network unavailable (offline) – proceed normally without reloading
        return true;
    }
}
