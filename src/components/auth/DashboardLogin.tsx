import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ChefHat, LayoutDashboard, Monitor, UserX, ArrowLeft, Eye } from 'lucide-react';

interface DashboardLoginProps {
  dashboardType: 'kitchen' | 'counter' | 'admin';
  onGuestAccess: () => void;
}

const dashboardConfig = {
  kitchen: {
    title: 'Kitchen Dashboard',
    icon: ChefHat,
    color: 'orange',
    description: 'Manage orders and track preparation status',
  },
  counter: {
    title: 'Counter Dashboard',
    icon: Monitor,
    color: 'blue',
    description: 'Process orders and handle payments',
  },
  admin: {
    title: 'Admin Panel',
    icon: LayoutDashboard,
    color: 'purple',
    description: 'Full restaurant management and analytics',
  },
};

export default function DashboardLogin({ dashboardType, onGuestAccess }: DashboardLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const config = dashboardConfig[dashboardType];
  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAccessError(null);

    try {
      await signIn(email, password);
      // Role check happens in ProtectedRoute after auth state updates
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${config.color}-100 mb-4`}>
            <Icon className={`w-8 h-8 text-${config.color}-600`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
          <p className="mt-2 text-gray-500">{config.description}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Staff Login</h2>

          {accessError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <UserX className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{accessError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your email"
                  autoComplete="off"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={onGuestAccess}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Eye className="w-5 h-5" />
            Continue as Guest
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Guests can view all pages but cannot perform any operations
          </p>
        </div>

        {/* Back to Home */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}
