import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

/**
 * SessionContext — Lightweight session memory for the AI interaction system.
 * 
 * Tracks last input, last action, last result, and enables follow-up commands
 * that reference previous context (e.g. "compress it" after uploading an image).
 */

const SessionContext = createContext(null);

const MAX_HISTORY = 50;
const HISTORY_KEY = 'uvero_action_history';
const FAVORITES_KEY = 'uvero_favorites';

// ─── Persistence Utilities ───
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch { /* quota exceeded */ }
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch { /* silently fail */ }
}

/**
 * Stable Hash for capability params
 */
function getCapabilityIdentity(capabilityId, params = {}) {
  if (!capabilityId) return null;
  // Create a stable string representation of params
  const paramStr = JSON.stringify(Object.keys(params).sort().reduce((obj, key) => {
    obj[key] = params[key];
    return obj;
  }, {}));
  return `${capabilityId}:${paramStr}`;
}

export function SessionProvider({ children }) {
  // ── Session state (in-memory, current session) ──
  const [session, setSession] = useState({
    lastInput: null,
    lastAction: null,
    lastResult: null,
    timestamp: null,
  });

  // ── History & Favorites (localStorage, persistent) ──
  const [history, setHistory] = useState(loadHistory);
  const [favorites, setFavorites] = useState(loadFavorites);

  // ── Rehydration Logic (PWA & Cross-tab) ──
  const rehydrate = useCallback(() => {
    const nextFavorites = loadFavorites();
    const nextHistory = loadHistory();

    // Only update if actually different to avoid unnecessary re-renders
    setFavorites(prev => {
      const isSame = JSON.stringify(prev) === JSON.stringify(nextFavorites);
      return isSame ? prev : nextFavorites;
    });

    setHistory(prev => {
      const isSame = JSON.stringify(prev) === JSON.stringify(nextHistory);
      return isSame ? prev : nextHistory;
    });
  }, []);

  // Debounced rehydration
  const rehydrateTimer = useRef(null);
  const triggerRehydrate = useCallback(() => {
    if (rehydrateTimer.current) clearTimeout(rehydrateTimer.current);
    rehydrateTimer.current = setTimeout(rehydrate, 80);
  }, [rehydrate]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === FAVORITES_KEY || e.key === HISTORY_KEY) triggerRehydrate();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') triggerRehydrate();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', triggerRehydrate);
    window.addEventListener('pageshow', triggerRehydrate);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', triggerRehydrate);
      window.removeEventListener('pageshow', triggerRehydrate);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (rehydrateTimer.current) clearTimeout(rehydrateTimer.current);
    };
  }, [triggerRehydrate]);

  // ── Optimistic Persistence ──
  useEffect(() => { saveHistory(history); }, [history]);
  useEffect(() => { saveFavorites(favorites); }, [favorites]);

  // ── Update session after execution ──
  const recordAction = useCallback(({ input, action, result }) => {
    const timestamp = Date.now();

    setSession({
      lastInput: input || null,
      lastAction: action || null,
      lastResult: result || null,
      timestamp,
    });

    const entry = {
      id: `${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
      action: action?.label || 'Unknown action',
      capability: action?.capability || null,
      params: action?.params || {},
      description: action?.description || '',
      icon: action?.icon || '✦',
      timestamp,
      inputSummary: input?.name || input?.data?.toString?.()?.slice(0, 50) || '',
      resultSummary: result?.meta?.summary || '',
    };

    setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY));
  }, []);

  // ── Check if session has context for follow-up commands ──
  const hasContext = useCallback(() => {
    if (!session.lastResult || !session.timestamp) return false;
    return Date.now() - session.timestamp < 10 * 60 * 1000;
  }, [session]);

  const getContext = useCallback(() => {
    if (!hasContext()) return null;
    return {
      input: session.lastInput,
      action: session.lastAction,
      result: session.lastResult,
    };
  }, [session, hasContext]);

  const clearSession = useCallback(() => {
    setSession({ lastInput: null, lastAction: null, lastResult: null, timestamp: null });
  }, []);

  // ── History operations ──
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeHistoryItem = useCallback((id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  // ── Favorites operations ──
  const toggleFavorite = useCallback((capability) => {
    const identity = getCapabilityIdentity(capability.id, capability.params);
    if (!identity) return;

    setFavorites(prev => {
      const exists = prev.some(f => getCapabilityIdentity(f.id, f.params) === identity);
      if (exists) {
        return prev.filter(f => getCapabilityIdentity(f.id, f.params) !== identity);
      }
      return [...prev, { ...capability, pinnedAt: Date.now() }];
    });
  }, []);

  const isFavorite = useCallback((capabilityId, params = {}) => {
    const identity = getCapabilityIdentity(capabilityId, params);
    return favorites.some(f => getCapabilityIdentity(f.id, f.params) === identity);
  }, [favorites]);

  const value = {
    session,
    history,
    favorites,
    recordAction,
    hasContext,
    getContext,
    clearSession,
    clearHistory,
    removeHistoryItem,
    toggleFavorite,
    isFavorite,
    rehydrate: triggerRehydrate,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}

