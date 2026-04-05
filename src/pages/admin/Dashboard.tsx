import React, { useState, useEffect, useRef } from 'react';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import {
  LayoutDashboard, Coffee, ClipboardList, UserCog, Heart,
  MessageSquare, Ticket, FileText, Globe, QrCode,
  Coins, Users, TrendingUp, HelpCircle,
  Package, ChefHat, Bell, Activity
} from 'lucide-react';
import StatCard from '../../components/admin/dashboard/StatCard';
import RevenueChart from '../../components/admin/dashboard/RevenueChart';
import OrderStatusChart from '../../components/admin/dashboard/OrderStatusChart';
import ReportSelector from '../../components/admin/dashboard/ReportSelector';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import DashboardHeader from '../../components/common/DashboardHeader';

const dailyData = [
  { name: '12 AM', revenue: 1200 },
  { name: '4 AM', revenue: 800 },
  { name: '8 AM', revenue: 2400 },
  { name: '12 PM', revenue: 5800 },
  { name: '4 PM', revenue: 4800 },
  { name: '8 PM', revenue: 3800 },
  { name: '11 PM', revenue: 2900 },
];

const orderStatusData = [
  { name: 'Pending', value: 5 },
  { name: 'Preparing', value: 8 },
  { name: 'Ready', value: 3 },
  { name: 'Delivered', value: 25 },
];

function Dashboard() {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [stats, setStats] = useState({
    totalOrders: 156,
    totalRevenue: 45890,
    averageOrderValue: 294,
    activeCustomers: 42,
    totalStaff: 12,

    pendingFeedback: 15
  });
  const [notifications] = useState([]);

  useEffect(() => {
    const setupRealtimeSubscription = () => {
      const subscription = supabase
        .channel('dashboard_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            // Handle real-time updates
            if (payload.table === 'orders') {
              fetchDashboardData();
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    fetchDashboardData();
    const cleanup = setupRealtimeSubscription();
    
    return cleanup;
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

      // Calculate stats
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const averageOrderValue = totalRevenue / totalOrders;

      // Get feedback count
      const { count: feedbackCount, error: feedbackError } = await supabase
        .from('order_feedback')
        .select('id', { count: 'exact', head: true });

      if (feedbackError) throw feedbackError;

      setStats(prev => ({
        ...prev,
        totalOrders,
        totalRevenue,
        averageOrderValue: Math.round(averageOrderValue),
        pendingFeedback: feedbackCount || 0
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  // Lenis smooth scroll for admin content area
  useEffect(() => {
    const wrapper = contentRef.current;
    const content = contentInnerRef.current;
    if (!wrapper || !content) return;

    const lenis = new Lenis({
      wrapper,
      content,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/menu', icon: Coffee, label: 'Menu' },
    { path: '/admin/orders', icon: ClipboardList, label: 'Orders' },

    { path: '/admin/staff', icon: UserCog, label: 'Staff' },
    { path: '/admin/customers', icon: Heart, label: 'Customers' },
    { path: '/admin/feedback', icon: MessageSquare, label: 'Feedback' },
    { path: '/admin/support', icon: HelpCircle, label: 'Support Chat' },
    { path: '/admin/coupons', icon: Ticket, label: 'Coupons' },
    { path: '/admin/invoices', icon: FileText, label: 'Invoices' },
    { path: '/admin/website', icon: Globe, label: 'Website' },
    { path: '/admin/qr-codes', icon: QrCode, label: 'QR Codes' },
    { path: '/admin/diagnostics', icon: Activity, label: 'Diagnostics' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Dashboard Auth Header */}
      <DashboardHeader dashboardType="admin" />

      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-white shadow-md"
      >
        <div className="p-4">
          <h1 className="text-xl font-bold text-orange-500">TastyBites Admin</h1>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-500 ${
                location.pathname === item.path ? 'bg-orange-50 text-orange-500' : ''
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>
      </motion.div>

      {/* Main Content */}
      <div ref={contentRef} className="flex-1 overflow-auto scrollbar-thin">
        <div ref={contentInnerRef}>
        <AnimatePresence mode="wait">
          {location.pathname === '/admin' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Dashboard Overview</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening with your restaurant.</p>
              </div>

              <ReportSelector
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Orders"
                  value={stats.totalOrders}
                  icon={Package}
                  trend={12}
                  color="bg-blue-500"
                  subtitle="Today"
                />
                <StatCard
                  title="Total Revenue"
                  value={stats.totalRevenue}
                  icon={Coins}
                  trend={8}
                  color="bg-green-500"
                  subtitle="vs. previous period"
                />
                <StatCard
                  title="Avg. Order Value"
                  value={stats.averageOrderValue}
                  icon={TrendingUp}
                  trend={-5}
                  color="bg-orange-500"
                  subtitle="per order"
                />
                <StatCard
                  title="Active Customers"
                  value={stats.activeCustomers}
                  icon={Users}
                  trend={15}
                  color="bg-purple-500"
                  subtitle="currently dining"
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Staff"
                  value={stats.totalStaff}
                  icon={ChefHat}
                  color="bg-indigo-500"
                  subtitle="Active employees"
                />

                <StatCard
                  title="Pending Feedback"
                  value={stats.pendingFeedback}
                  icon={MessageSquare}
                  color="bg-pink-500"
                  subtitle="Needs response"
                />
                <StatCard
                  title="Notifications"
                  value={notifications.length}
                  icon={Bell}
                  color="bg-cyan-500"
                  subtitle="New alerts"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <RevenueChart
                  data={dailyData}
                  title="Revenue Overview"
                  period="Last 24 hours"
                />
                <OrderStatusChart data={orderStatusData} />
              </div>

              {/* Additional Reports */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl shadow-sm"
                >
                  <h2 className="text-lg font-semibold mb-4">Top Selling Items</h2>
                  <div className="space-y-4">
                    {['Paneer Tikka', 'Veg Biryani', 'Masala Dosa'].map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-600">{item}</span>
                        <span className="font-semibold">{Math.floor(Math.random() * 50 + 20)} orders</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl shadow-sm"
                >
                  <h2 className="text-lg font-semibold mb-4">Peak Hours</h2>
                  <div className="space-y-4">
                    {['12 PM - 2 PM', '7 PM - 9 PM', '3 PM - 5 PM'].map((time, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-600">{time}</span>
                        <span className="font-semibold">{Math.floor(Math.random() * 30 + 10)} orders/hr</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl shadow-sm"
                >
                  <h2 className="text-lg font-semibold mb-4">Customer Satisfaction</h2>
                  <div className="space-y-4">
                    {['5★', '4★', '3★'].map((rating, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-600">{rating}</span>
                        <span className="font-semibold">{90 - index * 20}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          )}
        </AnimatePresence>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Dashboard;