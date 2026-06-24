import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import ServerForm from './pages/ServerForm';

function Guard({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"         element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/" element={<Guard><Layout><Dashboard /></Layout></Guard>} />
        <Route path="/servers/new"   element={<Guard><Layout><ServerForm /></Layout></Guard>} />
        <Route path="/servers/:slug" element={<Guard><Layout><ServerForm /></Layout></Guard>} />
      </Routes>
    </BrowserRouter>
  );
}
