import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUser } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import ServerForm from './pages/ServerForm';
import Moderation from './pages/Moderation';

function Guard({ children, requirePlatformAdmin = false }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const user = getUser();
  if (requirePlatformAdmin && !user?.platformAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login"         element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/" element={<Guard><Layout><Dashboard /></Layout></Guard>} />
        <Route path="/servers/new"   element={<Guard><Layout><ServerForm /></Layout></Guard>} />
        <Route path="/servers/:slug" element={<Guard><Layout><ServerForm /></Layout></Guard>} />
        <Route path="/moderation"    element={<Guard requirePlatformAdmin><Layout><Moderation /></Layout></Guard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
