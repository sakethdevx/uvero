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

// ─── History persistence ───
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
  } catch { /* quota exceeded — silently fail */ }
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

export function SessionProvider({ children }) {
  // ── Session state (in-memory, current session) ──
  const [session, setSession] = useState({
    lastInput: null,      // { type: 'file'|'text'|'url', data: File|string, name: string }
    lastAction: null,     // { capability: string, params: {}, label: string }
    lastResult: null,     // { type: 'file'|'qr'|'code'|'text', data: any, meta: {} }
    timestamp: null,
  });

  // ── History (localStorage, persistent) ──
  const [history, setHistory] = useState(loadHistory);
  const [favorites, setFavorites] = useState(loadFavorites);

  // Save history whenever it changes
  const historyRef = useRef(history);
  historyRef.current = history;
  useEffect(() => { saveHistory(history); }, [history]);
  useEffect(() => { saveFavorites(favorites); }, [favorites]);

  // ── Update session after execution ──
  const recordAction = useCallback(({ input, action, result }) => {
    const timestamp = Date.now();

    // Update in-memory session
    setSession({
      lastInput: input || null,
      lastAction: action || null,
      lastResult: result || null,
      timestamp,
    });

    // Append to history
    const entry = {
      id: `${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
      action: action?.label || 'Unknown action',
      capability: action?.capability || null,
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
    // Context expires after 10 minutes
    return Date.now() - session.timestamp < 10 * 60 * 1000;
  }, [session]);

  // ── Get session context for follow-up ──
  const getContext = useCallback(() => {
    if (!hasContext()) return null;
    return {
      input: session.lastInput,
      action: session.lastAction,
      result: session.lastResult,
    };
  }, [session, hasContext]);

  // ── Clear session ──
  const clearSession = useCallback(() => {
    setSession({ lastInput: null, lastAction: null, lastResult: null, timestamp: null });
  }, []);

  // ── History operations ──
  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const removeHistoryItem = useCallback((id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  // ── Favorites operations ──
  const toggleFavorite = useCallback((capability) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === capability.id);
      if (exists) {
        return prev.filter(f => f.id !== capability.id);
      }
      return [...prev, { ...capability, pinnedAt: Date.now() }];
    });
  }, []);

  const isFavorite = useCallback((capabilityId) => {
    return favorites.some(f => f.id === capabilityId);
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
