import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import Button from '../components/common/Button';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Account status verification
  if (user.status === 'SUSPENDED') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-rose-100">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Account Suspended</h2>
          <p className="text-sm text-gray-600 mt-2">
            Your MediStock account has been suspended by a System Administrator. Please contact hospital support.
          </p>
          <div className="mt-6">
            <Button variant="outline" onClick={logout} className="w-full">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Role verification
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-amber-100">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-sm text-gray-600 mt-2">
            You do not hold the required security privileges (<strong>{allowedRoles.join(' / ')}</strong>) to access this resource.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Navigate to="/dashboard" replace />
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
