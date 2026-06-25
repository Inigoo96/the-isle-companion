import { useEffect, useState } from 'react';
import { api } from '../api';
import styles from './Moderation.module.css';

const TABS = ['pending', 'accepted', 'rejected', 'banned'];

// Transiciones permitidas por estado (debe coincidir con el backend).
const ACTIONS = {
  pending:  ['approve', 'reject'],
  rejected: ['approve'],
  accepted: ['ban'],
  banned:   ['approve'],
};

const ACTION_LABEL = { approve: 'Approve', reject: 'Reject', ban: 'Ban' };
const ACTION_CLASS = { approve: 'approve', reject: 'reject', ban: 'ban' };

export default function Moderation() {
  const [status, setStatus]   = useState('pending');
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(null);

  function load(s) {
    setLoading(true);
    setError('');
    api.get(`/admin/servers?status=${s}`)
      .then(setServers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(status); }, [status]);

  async function act(id, action) {
    setBusy(id + action);
    try {
      await api.post(`/admin/servers/${id}/${action}`);
      load(status);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Moderation</h1>
        <p className={styles.sub}>Review and approve servers submitted by community admins.</p>
      </div>

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t}
            className={`${styles.tab} ${status === t ? styles.tabActive : ''}`}
            onClick={() => setStatus(t)}>
            {t}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : servers.length === 0 ? (
        <p className={styles.muted}>No {status} servers.</p>
      ) : (
        <div className={styles.list}>
          {servers.map(s => (
            <div key={s.id} className={styles.card}>
              <div className={styles.cardMain}>
                <div className={styles.name}>{s.name} <span className={styles.slug}>/{s.slug}</span></div>
                <div className={styles.meta}>
                  <span>Discord: <strong>{s.discordGuildName || s.discordGuildId || '—'}</strong></span>
                  <span>Owner: <strong>{s.ownerUsername || '—'}</strong></span>
                  {s.discordInviteUrl && (
                    <a href={s.discordInviteUrl} target="_blank" rel="noreferrer">invite</a>
                  )}
                </div>
              </div>
              <div className={styles.actions}>
                {(ACTIONS[status] || []).map(action => (
                  <button key={action}
                    className={styles[ACTION_CLASS[action]]}
                    disabled={busy === s.id + action}
                    onClick={() => act(s.id, action)}>
                    {ACTION_LABEL[action]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
