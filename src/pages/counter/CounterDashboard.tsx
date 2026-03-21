import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Clock, User, Box, Coins, Plus, Minus, Trash2, AlertCircle, Phone, X,
  XCircle, Filter, RefreshCcw, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { useOrderForm } from '../../hooks/useOrderForm';
import { useMenuItems } from '../../hooks/useMenuItems';
import { calculateOrderTotals } from '../../utils/orderUtils';
import { generateAndProcessInvoice } from '../../utils/orderInvoiceUtils';
import { formatDistanceToNow } from 'date-fns';
import { useGuestGuard } from '../../hooks/useGuestGuard';
import DashboardHeader from '../../components/common/DashboardHeader';

export default function CounterDashboard() {
  const { isGuest, guardAction } = useGuestGuard();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    max_discount_amount: number | null;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  // Order management state
  const [orders, setOrders] = useState<Array<{
    id: string;
    customer_name: string;
    customer_phone: string;
    table_number: string | null;
    order_type: string;
    payment_method: string;
    payment_status: string;
    status: string;
    created_at: string;
    total_amount: number;
    order_items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      notes?: string;
    }>;
  }>>([]);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'upi'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStats, setOrderStats] = useState({
    todayCount: 0,
    todayRevenue: 0,
    pendingCount: 0
  });
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'menu' | 'orders'>('menu');

  // Destructuring only the properties we need
  const { orderItems, addOrderItem, updateQuantity, clearOrder } = useOrderManagement();
  const { customerName, setCustomerName, tableNumber, setTableNumber, orderType, setOrderType, paymentMethod, setPaymentMethod, handleSubmit } = useOrderForm({
    orderItems,
    onSubmitOrder: async () => {
      if (!validatePhone()) {
        return;
      }

      if (orderItems.length === 0) {
        toast.error('Please add items to the order');
        return;
      }

      setIsLoading(true);
      try {
        const { subtotal, discount, tax, total } = calculateOrderTotals(orderItems, appliedCoupon);

        // First insert the order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: customerName,
            customer_phone: customerPhone,
            table_number: orderType === 'dine-in' ? tableNumber : null,
            order_type: orderType,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'cash' ? 'pending' : 'completed',
            total_amount: total,
            status: 'pending',
            subtotal,
            tax,
            discount: discount,
            coupon_id: appliedCoupon?.id || null,
            coupon_code: appliedCoupon?.code || null,
            coupon_discount_value: appliedCoupon?.discount_value || null,
            coupon_discount_type: appliedCoupon?.discount_type || null
          })
          .select()
          .single();

        if (orderError) throw orderError;
        
        // Then insert all order items to ensure they're associated with the order
        const orderItemsToInsert = orderItems.map(item => ({
          order_id: order.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          tax_rate: 0.18,
          notes: item.notes || ''
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsToInsert);
          
        if (itemsError) {
          console.error('Error inserting order items:', itemsError);
          // Continue even if there's an error with items, as the order was created
        }

        // Generate the invoice using our unified utility function
        try {
          // Adapt order items to match OrderItem interface from types/orders.ts
          const adaptedOrderItems = orderItems.map(item => ({
            id: String(item.id),
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image || '',  // Provide default for missing image property
            specialInstructions: item.notes
          }));

          // Use the utility function to handle all invoice processing consistently
          const invoiceResult = await generateAndProcessInvoice(
            order,              // order object
            adaptedOrderItems,  // adapted order items 
            subtotal,           // subtotal
            tax,                // tax
            total,              // total
            customerName,       // customer name
            customerPhone,      // customer phone
            orderType === 'dine-in' ? tableNumber : undefined, // table number
            paymentMethod       // payment method
          );
          
          if (invoiceResult) {
            // Print the invoice
            invoiceResult.print();
            
            // Show success message with invoice info
            toast.success("Order created successfully! " + 
              (window.innerWidth < 768 ? 'Check for download or print prompt' : 'Invoice is being printed/downloaded'),
              { duration: 5000 }
            );
          } else {
            // Fall back to showing a generic success message if invoice processing failed
            toast.success("Order created successfully!", { duration: 3000 });
          }
        } catch (err: Error | unknown) {
          console.error('Error processing invoice:', err);
          // Show more detailed error
          toast.error(
            `Failed to process invoice. ${err instanceof Error ? err.message : 'Please check if popups are allowed'}`,
            { duration: 5000 }
          );
        }
        clearOrder();
        setCustomerName('');
        setCustomerPhone('');
        setTableNumber('');
      } catch (error: Error | unknown) {
        console.error('Error creating order:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to create order');
      } finally {
        setIsLoading(false);
      }
    }
  });

  const validatePhone = (): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!customerPhone) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(customerPhone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCustomerPhone(value);
    if (value.length === 10) {
      validatePhone();
    } else {
      setPhoneError(value.length > 0 ? 'Please enter a valid 10-digit phone number' : '');
    }
  };

  // Get menu items from Supabase
  const { menuItems } = useMenuItems();
  
  // Filter menu items based on search and category (but show all availability states)
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate order totals
  const { subtotal, discount, tax, total } = calculateOrderTotals(orderItems, appliedCoupon);

  const categories = [
    { id: 'all', name: 'All Items', icon: Box },
    { id: 'main', name: 'Main Course', icon: Package },
    { id: 'appetizer', name: 'Appetizers', icon: Package },
    { id: 'dessert', name: 'Desserts', icon: Package },
    { id: 'beverage', name: 'Beverages', icon: Package },
  ];

  const handleCustomerLookup = async () => {
    if (!validatePhone()) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', customerPhone)
        .single();

      if (error) throw error;

      if (data) {
        setCustomerName(data.name);
        toast.success('Customer found!');
      } else {
        toast.error('Customer not found');
      }
    } catch (error) {
      console.error('Customer lookup error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to lookup customer');
    }
  };
  
  // Fetch orders based on filter criteria
  const fetchOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .order('created_at', { ascending: false });
      
      // Apply status filter
      if (orderFilter !== 'all') {
        query = query.eq('status', orderFilter);
      }

      // Apply payment method filter
      if (paymentFilter !== 'all') {
        query = query.eq('payment_method', paymentFilter);
      }
      
      // Apply search filter if present
      if (orderSearchQuery) {
        query = query.or(`customer_name.ilike.%${orderSearchQuery}%,customer_phone.ilike.%${orderSearchQuery}%,id.ilike.%${orderSearchQuery}%`);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      
      setOrders(data || []);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch orders');
    } finally {
      setIsOrdersLoading(false);
    }
  }, [orderFilter, paymentFilter, orderSearchQuery]);
  
  // Calculate and update order statistics
  const updateOrderStats = async () => {
    try {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISOString = today.toISOString();
      
      // Get today's orders count
      const { count: todayCount, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISOString);
      
      if (countError) throw countError;
      
      // Get today's revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', todayISOString);
      
      if (revenueError) throw revenueError;
      
      const todayRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      // Get pending orders count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (pendingError) throw pendingError;
      
      setOrderStats({
        todayCount: todayCount || 0,
        todayRevenue,
        pendingCount: pendingCount || 0
      });
      
    } catch (error) {
      console.error('Error updating order stats:', error);
    }
  };
  
  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast.success(`Order #${orderId.slice(-6)} ${newStatus}`);
      
      // Refresh orders and stats
      fetchOrders();
      updateOrderStats();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order status');
    }
  };

  // Update payment status
  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast.success(`Payment for Order #${orderId.slice(-6)} marked as ${newPaymentStatus}`);
      
      // Refresh orders and stats
      fetchOrders();
      updateOrderStats();
      
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update payment status');
    }
  };

  // Handle payment status toggle with confirmation
  const handlePaymentToggle = async (orderId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' || currentStatus === 'paid' ? 'pending' : 'completed';
    
    // Show confirmation dialog when changing from paid to unpaid
    if (newStatus === 'pending') {
      const confirmed = window.confirm(
        `Are you sure you want to mark this payment as unpaid? This will change the order status from paid to pending.`
      );
      if (!confirmed) {
        return;
      }
    }
    
    await updatePaymentStatus(orderId, newStatus);
  };
  
  // Fetch orders on initial load and when filter/search changes
  useEffect(() => {
    fetchOrders();
  }, [orderFilter, paymentFilter, orderSearchQuery, fetchOrders]);
  
  // Update order stats on initial load
  useEffect(() => {
    updateOrderStats();
    
    // Set up a timer to refresh stats every minute
    const intervalId = setInterval(() => {
      updateOrderStats();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Auth Header */}
      <DashboardHeader dashboardType="counter" />

      {/* Header Stats */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Orders</p>
                <p className="text-xl font-semibold">{orderStats.todayCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <Coins className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-xl font-semibold">₹{orderStats.todayRevenue.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-xl font-semibold">{orderStats.pendingCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Toggle between menu and orders */}
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewMode('menu')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              viewMode === 'menu'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="font-medium">Menu</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setViewMode('orders');
              fetchOrders();
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              viewMode === 'orders'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="font-medium">Orders</span>
            {orderStats.pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-medium rounded-full px-2 py-0.5">
                {orderStats.pendingCount}
              </span>
            )}
          </motion.button>
          
          {viewMode === 'orders' && (
            <button
              onClick={() => fetchOrders()}
              className="ml-auto flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          )}
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Categories */}
          <div className="w-20 flex-shrink-0">
            <div className="space-y-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center p-2 ${
                    selectedCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <category.icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {viewMode === 'menu' ? (
              <>
                {/* Search Bar */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search menu items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    onClick={() => guardAction(handleCustomerLookup)}
                    disabled={isGuest}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <User className="w-5 h-5" />
                    <span>Customer Lookup</span>
                  </button>
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      className={`bg-white rounded-lg shadow-sm overflow-hidden ${!item.isAvailable ? 'opacity-75' : ''}`}
                    >
                      <div className="relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-40 object-cover"
                        />
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-lg font-medium text-sm">
                              Unavailable
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{item.name}</h3>
                          <span className="text-orange-500 font-semibold">₹{item.price}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{item.description}</p>
                        <button
                          onClick={() => guardAction(() => addOrderItem(item))}
                          disabled={!item.isAvailable || isGuest}
                          className={`w-full py-2 rounded-lg ${
                            !item.isAvailable || isGuest
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          {!item.isAvailable ? 'Unavailable' : isGuest ? 'Login to Add' : 'Add to Order'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              /* Order Management View */
              <div className="bg-white rounded-lg shadow">
                {/* Order Filter and Search */}
                <div className="p-4 border-b">
                  {/* Status Filter */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 mr-4">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Status:</span>
                    </div>
                    
                    {(['all', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setOrderFilter(filter)}
                        className={`px-3 py-1 text-sm rounded-full capitalize ${
                          orderFilter === filter
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  
                  {/* Payment Method Filter */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 mr-4">
                      <Coins className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Payment:</span>
                    </div>
                    
                    {(['all', 'cash', 'card', 'upi'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setPaymentFilter(filter)}
                        className={`px-3 py-1 text-sm rounded-full capitalize ${
                          paymentFilter === filter
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${filter === 'cash' ? 'ring-2 ring-yellow-400' : ''}`}
                      >
                        {filter === 'cash' ? '💰 Cash' : filter === 'card' ? '💳 Card' : filter === 'upi' ? '📱 UPI' : 'All Payments'}
                      </button>
                    ))}
                  </div>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-64 pl-9 pr-4 py-1.5 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                
                {/* Orders List */}
                <div className="overflow-x-auto">
                  {isOrdersLoading ? (
                    <div className="p-12 flex justify-center">
                      <p className="text-gray-500">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300 mb-2" />
                      <p className="text-gray-500">No orders found</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.map(order => (
                          <tr 
                            key={order.id}
                            className={selectedOrder === order.id ? "bg-orange-50" : "hover:bg-gray-50"}
                            onClick={() => setSelectedOrder(order.id)}
                          >
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium"># {order.id.slice(-6)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium">{order.customer_name}</p>
                                <p className="text-xs text-gray-500">{order.customer_phone}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-800">
                                {order.order_type}
                                {order.table_number && ` - Table ${order.table_number}`}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium">₹{order.total_amount.toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize
                                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                  order.status === 'delivered' ? 'bg-gray-100 text-gray-800' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'}`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize
                                  ${order.payment_status === 'completed' || order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                                    order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'}`}
                                >
                                  {order.payment_status === 'completed' || order.payment_status === 'paid' ? 'Paid' : order.payment_status}
                                </span>
                                <span className="text-xs text-gray-500">({order.payment_method})</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm">{new Date(order.created_at).toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end items-center space-x-2">
                                {/* Payment Status Toggle */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    guardAction(() => handlePaymentToggle(order.id, order.payment_status));
                                  }}
                                  disabled={isGuest}
                                  className={`px-3 py-1 text-xs font-medium rounded border disabled:opacity-50 disabled:cursor-not-allowed ${
                                    order.payment_status === 'completed' || order.payment_status === 'paid'
                                      ? 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200'
                                      : 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
                                  }`}
                                  title={isGuest ? 'Login to perform this action' : (order.payment_status === 'completed' || order.payment_status === 'paid'
                                    ? 'Mark as Unpaid'
                                    : 'Mark as Paid')
                                  }
                                >
                                  {order.payment_status === 'completed' || order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                                </button>
                                {(order.status === 'pending' || order.status === 'preparing') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      guardAction(() => updateOrderStatus(order.id, 'cancelled'));
                                    }}
                                    disabled={isGuest}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={isGuest ? 'Login to perform this action' : 'Cancel Order'}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    // Regenerate invoice
                                    const orderItems = order.order_items;
                                    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                    const tax = subtotal * 0.18;
                                    const total = subtotal + tax;
                                    
                                    // Adapt order items to match OrderItem interface from types/orders.ts
                                    const adaptedItems = orderItems.map(item => ({
                                      id: String(item.id),
                                      name: item.name,
                                      quantity: item.quantity,
                                      price: item.price,
                                      image: '', // Add missing image property
                                      specialInstructions: item.notes
                                    }));
                                    
                                    generateAndProcessInvoice(
                                      order, 
                                      adaptedItems, 
                                      subtotal,
                                      tax,
                                      total,
                                      order.customer_name,
                                      order.customer_phone,
                                      order.table_number || undefined,
                                      order.payment_method
                                    ).then(invoice => {
                                      if (invoice) {
                                        invoice.print();
                                        toast.success('Invoice printed');
                                      } else {
                                        toast.error('Failed to generate invoice');
                                      }
                                    }).catch(err => {
                                      toast.error(`Error: ${err.message || 'Failed to process invoice'}`);
                                    });
                                  }}
                                  className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                  title="Print Invoice"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                
                {/* Order Details Section (when an order is selected) */}
                {selectedOrder !== null && (
                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Order Details - #{orders.find(o => o.id === selectedOrder)?.id.slice(-6)}</h3>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {orders.find(o => o.id === selectedOrder) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Customer Information</h4>
                          <div className="bg-white p-3 rounded border">
                            <p>Name: {orders.find(o => o.id === selectedOrder)?.customer_name}</p>
                            <p>Phone: {orders.find(o => o.id === selectedOrder)?.customer_phone}</p>
                            {orders.find(o => o.id === selectedOrder)?.table_number && (
                              <p>Table: {orders.find(o => o.id === selectedOrder)?.table_number}</p>
                            )}
                            <p className="mt-2">Order Type: <span className="capitalize">{orders.find(o => o.id === selectedOrder)?.order_type}</span></p>
                            <p>Payment: <span className="capitalize">{orders.find(o => o.id === selectedOrder)?.payment_method}</span></p>
                            <p>Payment Status: <span className="capitalize">{orders.find(o => o.id === selectedOrder)?.payment_status}</span></p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Order Items</h4>
                          <div className="bg-white p-3 rounded border">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2">Item</th>
                                  <th className="text-center py-2">Qty</th>
                                  <th className="text-right py-2">Price</th>
                                  <th className="text-right py-2">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders.find(o => o.id === selectedOrder)?.order_items.map((item) => (
                                  <tr key={item.id} className="border-b last:border-0">
                                    <td className="py-2">{item.name}</td>
                                    <td className="text-center py-2">{item.quantity}</td>
                                    <td className="text-right py-2">₹{item.price}</td>
                                    <td className="text-right py-2">₹{(item.price * item.quantity).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="font-medium">
                                <tr className="border-t">
                                  <td colSpan={3} className="text-right py-2">Total:</td>
                                  <td className="text-right py-2">₹{orders.find(o => o.id === selectedOrder)?.total_amount.toFixed(2)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - Order Details */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Order Details</h2>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setOrderType('dine-in')}
                  className={`flex-1 py-2 rounded-lg ${
                    orderType === 'dine-in'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Dine In
                </button>
                <button
                  onClick={() => setOrderType('takeaway')}
                  className={`flex-1 py-2 rounded-lg ${
                    orderType === 'takeaway'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Takeaway
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    onBlur={validatePhone}
                    placeholder="Phone Number (10 digits)"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                      phoneError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {phoneError && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {phoneError}
                    </p>
                  )}
                </div>
                {orderType === 'dine-in' && (
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Table Number"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    required={orderType === 'dine-in'}
                  />
                )}
              </div>

              <div className="border-t pt-4">
                {orderItems.length === 0 ? (
                  <p className="text-gray-500 text-center">No items added to order</p>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">₹{item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => guardAction(() => updateQuantity(item.id, item.quantity - 1))}
                            disabled={isGuest}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => guardAction(() => updateQuantity(item.id, item.quantity + 1))}
                            disabled={isGuest}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => guardAction(() => updateQuantity(item.id, 0))}
                            disabled={isGuest}
                            className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6">
                {/* Coupon Input Section */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      disabled={appliedCoupon !== null || validatingCoupon}
                      className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                    />
                    <button
                      onClick={async () => {
                        if (!couponCode) return;
                        setValidatingCoupon(true);
                        try {
                          const { data: coupon, error } = await supabase
                            .from('coupons')
                            .select('*')
                            .eq('code', couponCode.toUpperCase())
                            .eq('is_active', true)
                            .single();

                          if (error) throw error;
                          if (!coupon) throw new Error('Coupon not found');

                          // Validate coupon
                          if (new Date(coupon.expiry_date) < new Date()) {
                            toast.error('This coupon has expired');
                            return;
                          }

                          if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
                            toast.error(`Minimum order amount for this coupon is Rs${coupon.min_order_amount}`);
                            return;
                          }

                          if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
                            toast.error('This coupon has reached its usage limit');
                            return;
                          }

                          setAppliedCoupon(coupon);
                          setCouponCode('');
                          toast.success('Coupon applied successfully!');
                        } catch (error: Error | unknown) {
                          console.error('Error applying coupon:', error);
                          toast.error(error instanceof Error ? error.message : 'Invalid coupon code');
                        } finally {
                          setValidatingCoupon(false);
                        }
                      }}
                      disabled={!couponCode || validatingCoupon || appliedCoupon !== null}
                      className={`px-4 py-2 rounded-md font-medium ${
                        !couponCode || validatingCoupon || appliedCoupon !== null
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      {validatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>

                  {appliedCoupon && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-md flex justify-between items-center">
                      <span className="text-sm text-green-800">
                        {appliedCoupon.code} - {appliedCoupon.discount_type === 'percentage' 
                          ? `${appliedCoupon.discount_value}% off` 
                          : `Rs${appliedCoupon.discount_value} off`}
                      </span>
                      <button
                        onClick={() => {
                          setAppliedCoupon(null);
                          toast.success('Coupon removed');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'card', 'upi'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-lg capitalize ${
                        paymentMethod === method
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => guardAction(handleSubmit)}
                  disabled={isLoading || isGuest || orderItems.length === 0 || !customerName || (orderType === 'dine-in' && !tableNumber)}
                  className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : isGuest ? 'Login to Place Order' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}