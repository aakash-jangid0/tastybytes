import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GuestProvider } from '../../context/GuestContext';
import DashboardLogin from '../auth/DashboardLogin';
import { ShieldX, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'kitchen' | 'counter' | 'customer';
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Dashboard routes (kitchen/counter/admin) show inline login instead of redirect
  const isDashboardRoute = requiredRole === 'kitchen' || requiredRole === 'counter' || requiredRole === 'admin';

  // Not logged in and not guest
  if (!user && !isGuest) {
    if (isDashboardRoute) {
      return (
        <DashboardLogin
          dashboardType={requiredRole as 'kitchen' | 'counter' | 'admin'}
          onGuestAccess={() => setIsGuest(true)}
        />
      );
    }
    // Non-dashboard protected routes still redirect to /auth
    return <></>;
  }

  // Logged in but wrong role (customer trying to access staff dashboards)
  if (user && requiredRole && role !== requiredRole && role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Your account does not have permission to access this dashboard.
            Please use a staff or admin account.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Guest mode or authenticated — wrap with GuestProvider
  return (
    <GuestProvider isGuest={isGuest} exitGuestMode={() => setIsGuest(false)}>
      {children}
    </GuestProvider>
  );
}

export default ProtectedRoute;
