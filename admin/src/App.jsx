import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUser } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import ServerForm from './pages/ServerForm';
import Pending from './pages/Pending';
import SuperAdmin from './pages/SuperAdmin';

function Guard({ children, requireSuperAdmin = false }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const user = getUser();
  if (!user?.superAdmin && (user?.status === 'PENDING' || user?.status === 'BANNED')) {
    return <Navigate to="/pending" replace />;
  }
  if (requireSuperAdmin && !user?.superAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"         element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/pending"       element={<Pending />} />

        <Route path="/" element={<Guard><Layout><Dashboard /></Layout></Guard>} />
        <Route path="/servers/new"   element={<Guard><Layout><ServerForm /></Layout></Guard>} />
        <Route path="/servers/:slug" element={<Guard><Layout><ServerForm /></Layout></Guard>} />
        <Route path="/super-admin"   element={<Guard requireSuperAdmin><Layout><SuperAdmin /></Layout></Guard>} />
      </Routes>
    </BrowserRouter>
  );
}
