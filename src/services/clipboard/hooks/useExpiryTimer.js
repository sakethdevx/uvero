import { useEffect, useState } from 'react';

/**
 * Hook to compute remaining time until expiration.
 * @param {string|Date} expiresAt - ISO timestamp or Date object.
 * @returns {{ timeRemaining: number, formatted: string }}
 */
export default function useExpiryTimer(expiresAt) {
  const [timeRemaining, setTimeRemaining] = useState(() => computeRemaining());

  function computeRemaining() {
    const now = new Date();
    const target = new Date(expiresAt);
    const diff = target - now;
    return diff > 0 ? diff : 0;
  }

  // Helper: format milliseconds into human‑readable string
  function format(ms) {
    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const hrs = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (days > 0) return `${days}d ${hrs}h`;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  useEffect(() => {
    // Immediately recalculate when expiresAt changes
    setTimeRemaining(computeRemaining());
    const interval = setInterval(() => {
      setTimeRemaining(computeRemaining());
    }, 1000); // update every second for smoother UI
    return () => clearInterval(interval);
  }, [expiresAt]);

  return { timeRemaining, formatted: format(timeRemaining) };
}
