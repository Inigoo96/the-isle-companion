import { clearAuth } from '../auth';
import styles from './Pending.module.css';

export default function Pending() {
  function logout() {
    clearAuth();
    window.location.href = '/login';
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
        <button className={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
