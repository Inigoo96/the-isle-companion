import { useEffect, useState } from 'react';
import { api } from '../api';
import styles from './SuperAdmin.module.css';

const STATUS_LABEL = { PENDING: 'Pending', ACTIVE: 'Active', BANNED: 'Banned' };
const STATUS_CLASS  = { PENDING: styles.badgePending, ACTIVE: styles.badgeActive, BANNED: styles.badgeBanned };

export default function SuperAdmin() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get('/admin/accounts')
      .then(setAccounts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function setStatus(steamId, status) {
    try {
      await api.put(`/admin/accounts/${steamId}/status`, { status });
      setAccounts(prev =>
        prev.map(a => a.steamId === steamId ? { ...a, status } : a)
      );
    } catch (e) {
      setError(e.message);
    }
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Account Management</h1>
          <p className={styles.sub}>Review and manage server administrator accounts</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.muted}>Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No accounts yet</p>
          <p className={styles.emptyHint}>Accounts will appear here when administrators sign up.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {accounts.map(a => (
            <div key={a.steamId} className={styles.row}>
              <div className={styles.identity}>
                {a.avatarUrl
                  ? <img src={a.avatarUrl} alt="" className={styles.avatar} />
                  : <div className={styles.avatarFallback}>{(a.displayName || '?')[0].toUpperCase()}</div>
                }
                <div className={styles.info}>
                  <span className={styles.name}>{a.displayName || a.steamId}</span>
                  <span className={styles.steamId}>{a.steamId}</span>
                </div>
              </div>

              <div className={styles.meta}>
                <span className={`${styles.badge} ${STATUS_CLASS[a.status]}`}>
                  {STATUS_LABEL[a.status]}
                </span>
                <span className={styles.metaText}>Joined {formatDate(a.createdAt)}</span>
                <span className={styles.metaText}>Last login {formatDate(a.lastLoginAt)}</span>
              </div>

              <div className={styles.servers}>
                {a.serverCount === 0 ? (
                  <span className={styles.noServers}>No servers</span>
                ) : (
                  a.servers.map(s => (
                    <span key={s.slug} className={styles.serverChip}>/{s.slug}</span>
                  ))
                )}
              </div>

              <div className={styles.actions}>
                {a.status === 'PENDING' && (
                  <button className={styles.btnApprove} onClick={() => setStatus(a.steamId, 'ACTIVE')}>
                    Approve
                  </button>
                )}
                {a.status === 'ACTIVE' && (
                  <button className={styles.btnBan} onClick={() => setStatus(a.steamId, 'BANNED')}>
                    Ban
                  </button>
                )}
                {a.status === 'BANNED' && (
                  <button className={styles.btnUnban} onClick={() => setStatus(a.steamId, 'ACTIVE')}>
                    Unban
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
