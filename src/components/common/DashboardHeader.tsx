import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGuest } from '../../context/GuestContext';
import { LogIn, LogOut, AlertTriangle, ChefHat, Monitor, LayoutDashboard } from 'lucide-react';

interface DashboardHeaderProps {
  dashboardType: 'kitchen' | 'counter' | 'admin';
}

const dashboardConfig = {
  kitchen: { title: 'Kitchen Dashboard', icon: ChefHat },
  counter: { title: 'Counter Dashboard', icon: Monitor },
  admin: { title: 'Admin Panel', icon: LayoutDashboard },
};

export default function DashboardHeader({ dashboardType }: DashboardHeaderProps) {
  const { user, signOut } = useAuth();
  const { isGuest, exitGuestMode } = useGuest();

  const config = dashboardConfig[dashboardType];
  const Icon = config.icon;

  return (
    <div className="w-full">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-orange-500" />
          <h1 className="text-lg font-bold text-gray-800">{config.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {isGuest ? (
            <button
              onClick={exitGuestMode}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Guest Banner */}
      {isGuest && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            You are viewing as a guest. All operations are disabled.{' '}
            <button
              onClick={exitGuestMode}
              className="font-semibold underline hover:text-amber-900"
            >
              Login
            </button>
            {' '}to get full access.
          </p>
        </div>
      )}
    </div>
  );
}
