import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
export default function ProtectedRoute({ roles }) { const { loading, isAuthenticated, user } = useAuthStore(); if (loading) return <div className="page-loader">Loading FleetSphere…</div>; if (!isAuthenticated) return <Navigate to="/login" replace />; if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />; return <Outlet />; }
