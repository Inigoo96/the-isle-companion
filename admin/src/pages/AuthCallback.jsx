import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveAuth, clearAuth } from '../auth';
import { api } from '../api';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (!token) { navigate('/login', { replace: true }); return; }

    // Save token first so api.js attaches it, then load the admin profile.
    localStorage.setItem('isle_admin_token', token);
    api.get('/admin/me')
      .then(user => {
        saveAuth(token, user);
        navigate('/', { replace: true });
      })
      .catch(() => {
        clearAuth();
        navigate('/login', { replace: true });
      });
  }, []);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-muted)' }}>
      Authenticating…
    </div>
  );
}
