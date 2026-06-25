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

  function StatusPill({ status }) {
    if (!status) return null;
    const colors = {
      pending:  { bg: 'rgba(234,179,8,0.15)',  fg: '#eab308' },
      accepted: { bg: 'rgba(34,197,94,0.15)',  fg: '#22c55e' },
      rejected: { bg: 'rgba(239,68,68,0.15)',  fg: '#ef4444' },
      banned:   { bg: 'rgba(127,29,29,0.25)',  fg: '#f87171' },
    };
    const c = colors[status] || colors.pending;
    return (
      <span style={{
        marginLeft: 8, padding: '2px 8px', borderRadius: 999, fontSize: 10,
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
        background: c.bg, color: c.fg, verticalAlign: 'middle',
      }}>{status}</span>
    );
  }

  return (
    <div>
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
                <div className={styles.cardName}>
                  {s.name}
                  <StatusPill status={s.status} />
                </div>
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
