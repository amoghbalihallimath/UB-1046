import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import OfficialServices from './pages/OfficialServices';
import RaiseGrievance from './pages/RaiseGrievance';
import TrackGrievance from './pages/TrackGrievance';
import AdminPanel from './pages/AdminPanel';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="loader"></div><p>Loading Samadhana AI...</p></div>;
  return user ? children : <Navigate to="/" replace />;
}

function AdminRoute({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="loader"></div></div>;
  if (!user) return <Navigate to="/" replace />;
  if (role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="loader"></div></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="page-wrapper">
      {/* Hide govt-strip and app navbar on the admin page */}
      {!isAdminPage && (
        <div className="govt-strip">
          🇮🇳 Government of Karnataka — Samadhana AI Official Citizen Services Portal | jansevaaiportal@gmail.com
        </div>
      )}
      {user && !isAdminPage && <Navbar />}
      <Routes>
        <Route path="/" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/services" element={<PrivateRoute><OfficialServices /></PrivateRoute>} />
        <Route path="/grievance/new" element={<PrivateRoute><RaiseGrievance /></PrivateRoute>} />
        <Route path="/grievance/track" element={<PrivateRoute><TrackGrievance /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}
