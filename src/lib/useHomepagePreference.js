import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from './supabase/client';

export const HOMEPAGE_PREFERENCE_KEY = 'uvero_homepage_pref';
export const HOMEPAGE_PREFS = {
  VISUAL: 'visual',
  COMMAND: 'command',
};

const PREFERENCE_CHANGE_EVENT = 'uvero-preference-change';

/**
 * Helper to safely read preference from localStorage
 */
function getStoredPreference() {
  try {
    const val = localStorage.getItem(HOMEPAGE_PREFERENCE_KEY);
    if (val === HOMEPAGE_PREFS.VISUAL || val === HOMEPAGE_PREFS.COMMAND) {
      return val;
    }
  } catch {
    // Ignore storage errors
  }
  return HOMEPAGE_PREFS.VISUAL; // Default to Visual Catalog for new/un-set users
}

/**
 * Helper to safely write preference to localStorage and notify window
 */
function setStoredPreference(pref) {
  try {
    localStorage.setItem(HOMEPAGE_PREFERENCE_KEY, pref);
  } catch {
    // Ignore storage errors
  }
  window.dispatchEvent(new CustomEvent(PREFERENCE_CHANGE_EVENT, { detail: pref }));
}

export function useHomepagePreference() {
  const { user } = useAuth?.() || {};
  const [preference, setPreferenceState] = useState(() => getStoredPreference());

  // Load and sync preference from Supabase user_metadata if available
  useEffect(() => {
    const cloudPref = user?.user_metadata?.homepage_preference;
    if (cloudPref === HOMEPAGE_PREFS.VISUAL || cloudPref === HOMEPAGE_PREFS.COMMAND) {
      setPreferenceState(cloudPref);
      try {
        localStorage.setItem(HOMEPAGE_PREFERENCE_KEY, cloudPref);
      } catch {
        // ignore
      }
    }
  }, [user]);

  // Listen to preference change events across components/tabs
  useEffect(() => {
    const handlePrefChange = (e) => {
      if (e.detail && (e.detail === HOMEPAGE_PREFS.VISUAL || e.detail === HOMEPAGE_PREFS.COMMAND)) {
        setPreferenceState(e.detail);
      }
    };
    window.addEventListener(PREFERENCE_CHANGE_EVENT, handlePrefChange);
    return () => window.removeEventListener(PREFERENCE_CHANGE_EVENT, handlePrefChange);
  }, []);

  const setPreference = useCallback(async (newPref) => {
    if (newPref !== HOMEPAGE_PREFS.VISUAL && newPref !== HOMEPAGE_PREFS.COMMAND) return;

    // 1. Update local state & localStorage immediately
    setPreferenceState(newPref);
    setStoredPreference(newPref);

    // 2. Sync to Supabase user metadata if logged in
    if (user?.id && supabase) {
      try {
        await supabase.auth.updateUser({
          data: { homepage_preference: newPref }
        });
      } catch (err) {
        console.warn('Failed to sync homepage preference to user account:', err);
      }
    }
  }, [user]);

  return {
    preference,
    setPreference,
    isVisualMode: preference === HOMEPAGE_PREFS.VISUAL,
    isCommandMode: preference === HOMEPAGE_PREFS.COMMAND,
  };
}
