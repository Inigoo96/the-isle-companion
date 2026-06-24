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

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>Welcome back, {user?.displayName}</p>
        </div>
        <Link to="/servers/new" className={styles.btnPrimary}>+ New Server</Link>
      </div>

      <h2 className={styles.sectionTitle}>Your Servers</h2>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : servers.length === 0 ? (
        <div className={styles.empty}>
          <p>You have no servers yet.</p>
          <Link to="/servers/new" className={styles.btnPrimary}>Create your first server</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {servers.map(s => (
            <Link key={s.slug} to={`/servers/${s.slug}`} className={styles.card}>
              <div className={styles.cardName}>{s.name}</div>
              <div className={styles.cardSlug}>/{s.slug}</div>
              <div className={styles.cardMeta}>×{s.growthMultiplier} growth</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
