import React, { useEffect, useState } from 'react';
import useExpiryTimer from '../hooks/useExpiryTimer';
import styles from "../styles/expiry.module.css";

/**
 * Visual indicator of board expiration.
 * Shows a live "Expires in" badge, a progress bar, and a subtle toast when close to expiry.
 */
export default function ExpiryIndicator({ expiresAt, expiresIn }) {
  const { timeRemaining, formatted } = useExpiryTimer(expiresAt);
  const [showToast, setShowToast] = useState(false);

  // Show toast when less than 30 minutes remaining (adjustable)
  useEffect(() => {
    if (timeRemaining > 0 && timeRemaining <= 30 * 60 * 1000 && !showToast) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, showToast]);

  // Determine max duration based on expiresIn (default 24h)
  const durationMap = { '1h': 1 * 60 * 60 * 1000, '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 };
  const maxMs = durationMap[expiresIn] || 24 * 60 * 60 * 1000;

  const percent = Math.max(0, Math.min(100, (timeRemaining / maxMs) * 100));

  // Determine badge colour based on urgency
  let badgeClass = styles.badge; // default
  if (percent > 50) badgeClass = `${styles.badge} ${styles.good}`;
  else if (percent > 20) badgeClass = `${styles.badge} ${styles.warning}`;
  else badgeClass = `${styles.badge} ${styles.danger}`;

  return (
    <div className={styles.container}>
      {/* Badge */}
      <div className={badgeClass}>Expires in {formatted}</div>
      {/* Progress Bar */}
      <div className={styles.progressBarBackground}>
        <div className={styles.progressBarFill} style={{ width: `${percent}%` }} />
      </div>
      {/* Toast */}
      {showToast && (
        <div className={styles.toast}>
          <span>⚠️ Board will expire soon. Save changes to extend its life.</span>
        </div>
      )}
    </div>
  );
}
