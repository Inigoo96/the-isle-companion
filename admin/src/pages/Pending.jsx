import { useState } from 'react';
import { clearAuth } from '../auth';
import styles from './Pending.module.css';

export default function Pending() {
  const [confirming, setConfirming] = useState(false);

  function logout() {
    clearAuth();
    window.location.href = import.meta.env.BASE_URL + 'login';
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h1 className={styles.title}>Account Pending Approval</h1>
        <p className={styles.desc}>
          Your account is awaiting review. The administrator will approve or reject
          your request shortly. You will be notified once a decision has been made.
        </p>
        {confirming ? (
          <div className={styles.confirmRow}>
            <span className={styles.confirmText}>Log out?</span>
            <button className={styles.confirmYes} onClick={logout}>Yes, logout</button>
            <button className={styles.confirmNo} onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        ) : (
          <button className={styles.logoutBtn} onClick={() => setConfirming(true)}>Logout</button>
        )}
      </div>
    </div>
  );
}
