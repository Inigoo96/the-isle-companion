import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getUser, clearAuth } from '../auth';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [confirming, setConfirming] = useState(false);

  function logout() {
    clearAuth();
    navigate('/login');
  }

  const links = [
    { to: '/',             label: 'Dashboard' },
    { to: '/servers/new',  label: '+ New Server' },
    ...(user?.platformAdmin ? [{ to: '/moderation', label: 'Moderation' }] : []),
  ];

  return (
    <div className={styles.shell}>
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>IC</div>
          <span className={styles.logoText}>Isle Admin</span>
        </div>

        <ul className={styles.nav}>
          {links.map(l => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`${styles.navLink} ${location.pathname === l.to ? styles.active : ''}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.user}>
          <div className={styles.userRow}>
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt="" className={styles.avatar} />
            )}
            <span className={styles.userName}>{user?.username}</span>
          </div>
          {confirming ? (
            <div className={styles.logoutConfirm}>
              <span className={styles.logoutQuestion}>Log out?</span>
              <div className={styles.logoutActions}>
                <button className={styles.logoutYes} onClick={logout}>Yes</button>
                <button className={styles.logoutNo} onClick={() => setConfirming(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className={styles.logout} onClick={() => setConfirming(true)}>Logout</button>
          )}
        </div>
      </nav>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
