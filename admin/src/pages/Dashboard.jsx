import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { getUser } from '../auth';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    api.get('/servers/mine')
      .then(setServers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalDinos = servers.reduce((sum, s) => sum + (s.allowedDinos?.length || 0), 0);

  // Aviso segun el estado de moderacion del propio admin.
  function StatusBanner() {
    const s = user?.status;
    if (!s || s === 'accepted') return null;
    const msg = {
      pending:  { fg: '#eab308', bg: 'rgba(234,179,8,0.1)',  bd: 'rgba(234,179,8,0.3)',
                  text: 'Your account is pending approval. Your servers won’t be public until a platform admin approves you.' },
      rejected: { fg: '#ef4444', bg: 'rgba(239,68,68,0.1)',  bd: 'rgba(239,68,68,0.3)',
                  text: 'Your access has been rejected. You cannot create new servers.' },
      banned:   { fg: '#f87171', bg: 'rgba(127,29,29,0.18)', bd: 'rgba(239,68,68,0.3)',
                  text: 'Your access has been banned. You cannot create new servers.' },
    }[s];
    if (!msg) return null;
    return (
      <div style={{
        background: msg.bg, border: `1px solid ${msg.bd}`, color: msg.fg,
        padding: '12px 16px', borderRadius: 10, fontSize: 13, marginBottom: 20,
      }}>{msg.text}</div>
    );
  }

  return (
    <div>
      <StatusBanner />
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>Welcome back, <strong>{user?.username}</strong></p>
        </div>
        <Link to="/servers/new" className={styles.btnPrimary}>+ New Server</Link>
      </div>

      {!loading && servers.length > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{servers.length}</span>
            <span className={styles.statLabel}>{servers.length === 1 ? 'Server' : 'Servers'}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{totalDinos}</span>
            <span className={styles.statLabel}>Dinos configured</span>
          </div>
        </div>
      )}

      <p className={styles.sectionTitle}>Your Servers</p>

      {loading ? (
        <div className={styles.loadingGrid}>
          {[1, 2].map(i => <div key={i} className={styles.cardSkeleton} />)}
        </div>
      ) : servers.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⬡</div>
          <p className={styles.emptyTitle}>No servers yet</p>
          <p className={styles.emptyHint}>Create your first server to start configuring it for your players.</p>
          <Link to="/servers/new" className={styles.btnPrimary}>+ New Server</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {servers.map(s => (
            <Link key={s.slug} to={`/servers/${s.slug}`} className={styles.card}>
              <div className={styles.cardAccent} />
              <div className={styles.cardBody}>
                <div className={styles.cardName}>{s.name}</div>
                <div className={styles.cardSlug}>/{s.slug}</div>
                {s.rules && (
                  <p className={styles.cardRules}>{s.rules}</p>
                )}
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.badge}>
                  <span className={styles.badgeDot} />
                  ×{s.growthMultiplier} growth
                </span>
                <span className={styles.badgeMuted}>
                  {s.allowedDinos?.length ?? 0} dinos
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
