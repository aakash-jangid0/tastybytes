import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, AlertCircle, CheckCircle2, Timer, ChefHat, Search,
  User, Phone, MapPin, AlertTriangle,
  CheckCircle, XCircle, Clock4, Utensils, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../components/ui/dialog.jsx';
import { useGuestGuard } from '../../hooks/useGuestGuard';
import DashboardHeader from '../../components/common/DashboardHeader';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  preparation_status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  started_at?: string;
  completed_at?: string;
  estimated_time?: number;
}

interface Order {
  id: string;
  order_items: OrderItem[];
  customer_name: string;
  table_number?: string;
  order_type: 'dine-in' | 'takeaway';
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
  estimated_completion_time?: string;
  priority_level?: 'low' | 'normal' | 'high' | 'urgent';
  special_requirements?: string;
  assigned_chef?: string;
  preparation_notes?: string;
  delay_reason?: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  customer_phone?: string;
}

function KitchenDashboard() {
  const { isGuest, guardAction } = useGuestGuard();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<string>('all');
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });
  // State for cancellation confirmation dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    const subscription = setupRealtimeSubscription();
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const newStats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      preparingOrders: orders.filter(o => o.status === 'preparing').length,
      readyOrders: orders.filter(o => o.status === 'ready').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length
    };
    setStats(newStats);
  }, [orders]);

  const setupRealtimeSubscription = () => {
    return supabase
      .channel('kitchen_orders_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('id', payload.new.id)
              .single();

            if (!orderError && orderData) {
              setOrders(prev => [orderData, ...prev]);
              toast.success('New order received!', {
                icon: '🔔',
                style: {
                  background: '#10B981',
                  color: '#fff'
                }
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('id', payload.new.id)
              .single();

            if (!orderError && orderData) {
              setOrders(prev => 
                prev.map(order => 
                  order.id === payload.new.id ? orderData : order
                )
              );
            }
          }
        }
      )
      .subscribe();
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setError(null);
    } catch (error: unknown) {
      console.error('Error in fetchOrders:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch orders');
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updateData = { 
        status: newStatus,
        ...(newStatus === 'preparing' ? {
          estimated_completion_time: new Date(Date.now() + 20 * 60000).toISOString()
        } : {})
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      
      // Immediately update the local state for a responsive UI
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus, 
                ...(newStatus === 'preparing' ? {
                  estimated_completion_time: new Date(Date.now() + 20 * 60000).toISOString()
                } : {})
              } 
            : order
        )
      );
      
      toast.success(`Order status updated to ${newStatus}`, {
        icon: '✅',
        style: {
          background: '#10B981',
          color: '#fff'
        }
      });
    } catch (error: unknown) {
      console.error('Error updating order status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order status');
    }
  };

  const updateItemStatus = async (orderId: string, itemId: string, newStatus: OrderItem['preparation_status']) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ 
          preparation_status: newStatus,
          ...(newStatus === 'in_progress' ? { started_at: new Date().toISOString() } : {}),
          ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', itemId);

      if (error) throw error;

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? {
                ...order,
                order_items: order.order_items.map(item =>
                  item.id === itemId 
                    ? { ...item, preparation_status: newStatus }
                    : item
                )
              }
            : order
        )
      );

      toast.success(`Item status updated to ${newStatus}`, {
        icon: '👨‍🍳',
        style: {
          background: '#10B981',
          color: '#fff'
        }
      });
    } catch (error: unknown) {
      console.error('Error updating item status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update item status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'delivered':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 border-amber-200';
      case 'preparing':
        return 'bg-blue-50 border-blue-200';
      case 'ready':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesType = orderType === 'all' || order.order_type === orderType;
    const matchesSearch = searchQuery === '' || 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.slice(-6).toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_items.some(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesStatus && matchesType && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Orders</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Auth Header */}
      <DashboardHeader dashboardType="kitchen" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center">
                <div className="bg-emerald-500 p-3 rounded-lg mr-4">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
                  <p className="text-sm text-gray-500">
                    {orders.length} active orders • Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 md:min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="all">All Types</option>
                  <option value="dine-in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Utensils className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingOrders}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Preparing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.preparingOrders}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <ChefHat className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.readyOrders}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filteredOrders.map((order) => {
              const timeElapsed = new Date(order.created_at).toLocaleString();
              const isDelayed = order.status !== 'ready' && order.status !== 'delivered' && 
                order.estimated_completion_time && new Date(order.estimated_completion_time) < new Date();

              // Calculate completion percentage for visual indicator
              const completedItems = order.order_items?.filter(item => item.preparation_status === 'completed').length || 0;
              const totalItems = order.order_items?.length || 1;
              const completionPercentage = Math.round((completedItems / totalItems) * 100);

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ 
                    scale: 1.005, 
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                  }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${
                    order.status === 'pending' ? 'border-amber-500' : 
                    order.status === 'preparing' ? 'border-blue-500' : 
                    order.status === 'ready' ? 'border-emerald-500' : 
                    order.status === 'delivered' ? 'border-gray-400' : 
                    'border-red-500'
                  }`}
                >
                  {/* Order Header - Compact version */}
                  <div className={`px-4 py-2.5 ${getOrderBgColor(order.status)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${
                          order.status === 'pending' ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-200' : 
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-200' : 
                          order.status === 'ready' ? 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200' : 
                          order.status === 'delivered' ? 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' : 
                          'bg-red-100 text-red-600 ring-1 ring-red-200'
                        }`}>
                          {order.status === 'pending' ? <Clock className="w-4 h-4" /> :
                           order.status === 'preparing' ? <ChefHat className="w-4 h-4" /> :
                           order.status === 'ready' ? <CheckCircle2 className="w-4 h-4" /> :
                           order.status === 'delivered' ? <Check className="w-4 h-4" /> :
                           <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-bold">#{order.id.slice(-6)}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            {order.priority_level === 'urgent' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-md">
                                URGENT
                              </span>
                            )}
                            {order.priority_level === 'high' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold bg-amber-500 text-white rounded-md">
                                HIGH
                              </span>
                            )}
                            {isDelayed && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Delayed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">₹{order.total_amount.toFixed(2)}</div>
                          <div className="flex items-center justify-end gap-1">
                            <span className={`h-2 w-2 rounded-full ${
                              order.payment_status === 'paid' ? 'bg-emerald-500' : 
                              order.payment_status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                            }`}></span>
                            <div className="text-xs text-gray-500">{order.payment_status}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Content - Compact Layout */}
                  <div className="px-3 py-2">
                    <div className="flex flex-wrap gap-2 items-start">
                      {/* Customer Info - Left Column */}
                      <div className="w-auto flex-shrink-0 md:border-r md:pr-2 flex md:flex-col md:w-[160px]">
                        <div className="flex flex-wrap md:flex-col gap-1">
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{timeElapsed}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-700">
                            <User className="w-3 h-3 text-gray-500" />
                            <span className="font-medium text-xs">{order.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-700">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span className="text-xs">{order.order_type === 'dine-in' ? `Table ${order.table_number}` : 'Takeaway'}</span>
                          </div>
                          {order.customer_phone && (
                            <div className="flex items-center gap-1 text-gray-700">
                              <Phone className="w-3 h-3 text-gray-500" />
                              <span className="text-xs">{order.customer_phone}</span>
                            </div>
                          )}
                          {/* Progress bar */}
                          {completionPercentage > 0 && (
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <span className="text-xs font-medium text-gray-500">{completionPercentage}%</span>
                              <div className="w-10 bg-gray-200 rounded-full h-1.5 flex-shrink-0">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    completionPercentage === 100 ? 'bg-emerald-500' :
                                    completionPercentage > 50 ? 'bg-blue-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${completionPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Items - Center Column */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5">
                          {order.order_items?.map((item) => (
                            <div 
                              key={item.id} 
                              className={`flex items-center pr-1 rounded-md border ${
                                item.preparation_status === 'completed' 
                                  ? 'bg-emerald-50 border-emerald-100 shadow-sm' 
                                  : item.preparation_status === 'in_progress'
                                  ? 'bg-blue-50 border-blue-100 shadow-sm'
                                  : 'bg-gray-50 border-gray-100 shadow-sm'
                              }`}
                            >
                              <div className={`flex items-center gap-1 py-1.5 pl-2 pr-2 mr-0.5 ${
                                item.preparation_status === 'completed' 
                                  ? 'bg-emerald-100 text-emerald-700 rounded-l-md' 
                                  : item.preparation_status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-700 rounded-l-md'
                                  : 'text-gray-700 rounded-l-md'
                              }`}>
                                <span className="font-medium text-xs">{item.quantity}x</span>
                                <span className="max-w-[150px] truncate font-bold text-sm" title={item.name}>{item.name}</span>
                                {item.notes && (
                                  <div title={item.notes}>
                                    <AlertCircle className="w-3 h-3 text-amber-500 ml-0.5" />
                                  </div>
                                )}
                              </div>
                              
                              {item.preparation_status === 'not_started' && (
                                <button
                                  onClick={() => guardAction(() => updateItemStatus(order.id, item.id, 'in_progress'))}
                                  disabled={isGuest}
                                  className="ml-auto px-2.5 py-1.5 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={isGuest ? 'Login to perform this action' : 'Start preparation'}
                                >
                                  <Clock4 className="w-4 h-4" />
                                </button>
                              )}
                              {item.preparation_status === 'in_progress' && (
                                <button
                                  onClick={() => guardAction(() => updateItemStatus(order.id, item.id, 'completed'))}
                                  disabled={isGuest}
                                  className="ml-auto px-2.5 py-1.5 bg-emerald-500 text-white rounded-r-md hover:bg-emerald-600 transition-colors flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={isGuest ? 'Login to perform this action' : 'Mark as done'}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {item.preparation_status === 'completed' && (
                                <span className="ml-auto px-2.5 py-1.5 bg-emerald-100 text-emerald-700 rounded-r-md flex items-center">
                                  <CheckCircle className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Actions - Right Column */}
                      <div className="flex-none flex flex-row md:flex-col gap-1.5 self-center ml-auto">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => guardAction(() => updateOrderStatus(order.id, 'preparing'))}
                            disabled={isGuest}
                            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isGuest ? 'Login to perform this action' : 'Start preparing this order'}
                          >
                            <Timer className="w-4 h-4" />
                            <span>Start</span>
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => guardAction(() => updateOrderStatus(order.id, 'ready'))}
                            disabled={isGuest}
                            className="px-3 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isGuest ? 'Login to perform this action' : 'Mark this order as ready'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Ready</span>
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => guardAction(() => updateOrderStatus(order.id, 'delivered'))}
                            disabled={isGuest}
                            className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isGuest ? 'Login to perform this action' : 'Mark this order as delivered'}
                          >
                            <Check className="w-4 h-4" />
                            <span>Deliver</span>
                          </button>
                        )}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => guardAction(() => {
                              setOrderToCancel(order.id);
                              setCancelDialogOpen(true);
                            })}
                            disabled={isGuest}
                            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isGuest ? 'Login to perform this action' : 'Cancel this order'}
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Dialog for Order Cancellation */}
      <Dialog 
        open={cancelDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setCancelDialogOpen(false);
            setOrderToCancel(null);
          }
        }}
      >
        <DialogContent 
          open={cancelDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setCancelDialogOpen(false);
              setOrderToCancel(null);
            }
          }}
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Cancel Order?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone and the kitchen will stop preparing the order.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-row justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setCancelDialogOpen(false);
                setOrderToCancel(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              No, Keep Order
            </button>
            <button
              onClick={() => {
                if (orderToCancel) {
                  updateOrderStatus(orderToCancel, 'cancelled');
                }
                setCancelDialogOpen(false);
                setOrderToCancel(null);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
            >
              Yes, Cancel Order
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default KitchenDashboard;