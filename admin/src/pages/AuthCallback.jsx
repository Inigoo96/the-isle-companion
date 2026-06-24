import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveAuth } from '../auth';
import { api } from '../api';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (!token) { navigate('/login'); return; }

    // Save token first so api.js can use it, then fetch full profile
    localStorage.setItem('isle_admin_token', token);
    api.get('/me')
      .then(user => {
        saveAuth(token, user);
        if (window.opener) {
          window.opener.postMessage({ type: 'auth-success' }, window.location.origin);
          window.close();
        } else {
          navigate('/');
        }
      })
      .catch(() => {
        if (window.opener) window.close();
        else navigate('/login');
      });
  }, []);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-muted)' }}>
      Authenticating…
    </div>
  );
}
