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
  const [status, setStatus] = useState('pending');
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  function load(s) {
    setLoading(true);
    setError('');
    api.get(`/admin/admins?status=${s}`)
      .then(setAdmins)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(status); }, [status]);

  async function act(id, action) {
    setBusy(id + action);
    try {
      await api.post(`/admin/admins/${id}/${action}`);
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
        <p className={styles.sub}>Approve, reject or ban the Discord admins requesting access.</p>
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
      ) : admins.length === 0 ? (
        <p className={styles.muted}>No {status} admins.</p>
      ) : (
        <div className={styles.list}>
          {admins.map(a => (
            <div key={a.id} className={styles.card}>
              <div className={styles.cardMain}>
                <div className={styles.name}>
                  {a.avatarUrl && <img src={a.avatarUrl} alt="" className={styles.avatar} />}
                  {a.username || a.discordUserId}
                </div>
                <div className={styles.meta}>
                  <span>Discord ID: <strong>{a.discordUserId}</strong></span>
                  <span>Servers: <strong>{a.serverCount}</strong></span>
                  {a.createdAt && <span>Joined: {new Date(a.createdAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className={styles.actions}>
                {(ACTIONS[status] || []).map(action => (
                  <button key={action}
                    className={styles[ACTION_CLASS[action]]}
                    disabled={busy === a.id + action}
                    onClick={() => act(a.id, action)}>
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
