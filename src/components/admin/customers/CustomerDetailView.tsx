import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, ShoppingBag, 
  Clock, CheckCircle, XCircle, AlertCircle, Eye, 
  ChevronDown, ChevronUp, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { viewOrDownloadInvoice } from '../../../utils/invoiceUtils';

interface Order {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  subtotal: number;
  tax: number;
  discount: number;
  customer_name: string;
  table_number?: string;
  order_type: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
    created_at: string;
  }>;
}

interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  amount: number;
  status: string;
  payment_status: string;
  due_date: string;
  issued_date: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id?: string;
  payment_date: string;
  created_at: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
}

interface CustomerDetailViewProps {
  customerId: string;
  onBack: () => void;
}

interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  created_at: string;
  last_visit?: string;
  total_orders: number;
  total_spent: number;
  loyalty_points?: number;
  notes?: string;
  status: 'active' | 'inactive' | 'blocked';
  tags?: string[];
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
  statistics: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: string;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
  };
}

export default function CustomerDetailView({ customerId, onBack }: CustomerDetailViewProps) {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchCustomerDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get customer basic info
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
    
      if (customerError) throw customerError;
      
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get customer orders with detailed information
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          payment_status,
          total_amount,
          subtotal,
          tax,
          discount,
          customer_name,
          table_number,
          order_type,
          payment_method,
          created_at,
          updated_at,
          order_items (
            id,
            name,
            quantity,
            price,
            notes,
            created_at
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get invoices for the customer's orders
      let invoices = [];
      if (orders && orders.length > 0) {
        const orderIds = orders.map(order => order.id);
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            id,
            order_id,
            invoice_number,
            amount,
            status,
            payment_status,
            due_date,
            issued_date,
            paid_date,
            notes,
            created_at,
            updated_at
          `)
          .in('order_id', orderIds)
          .order('created_at', { ascending: false });

        if (invoiceError) {
          console.warn('Failed to fetch invoices:', invoiceError);
          // Don't throw error for invoices, just log warning
        } else {
          invoices = invoiceData || [];
        }
      }

      // Get payment information
      let payments = [];
      if (orders && orders.length > 0) {
        const orderIds = orders.map(order => order.id);
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select(`
            id,
            order_id,
            amount,
            method,
            status,
            transaction_id,
            razorpay_payment_id,
            razorpay_order_id,
            created_at,
            updated_at
          `)
          .in('order_id', orderIds)
          .order('created_at', { ascending: false });

        if (paymentError) {
          console.warn('Failed to fetch payments:', paymentError);
          // Don't throw error for payments, just log warning
        } else {
          payments = paymentData || [];
        }
      }

      // Calculate statistics
      const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;
      const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;

      const customerDetails = {
        ...customer,
        orders: orders || [],
        invoices,
        payments,
        statistics: {
          totalOrders: orders?.length || 0,
          totalSpent,
          completedOrders,
          pendingOrders,
          averageOrderValue: orders?.length ? totalSpent / orders.length : 0
        }
      };

      setCustomer(customerDetails);
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customer details');
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'confirmed': case 'preparing': case 'ready': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      case 'paid': return 'text-green-600 bg-green-50';
      case 'unpaid': return 'text-red-600 bg-red-50';
      case 'partial': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': case 'unpaid': return <XCircle className="w-4 h-4" />;
      case 'pending': case 'partial': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed': case 'unpaid': return 'text-red-600 bg-red-50 border-red-200';
      case 'partial': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'failed': case 'unpaid': return <XCircle className="w-3 h-3" />;
      case 'pending': case 'partial': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const handleViewInvoice = async (orderId: string) => {
    try {
      // Find the order data to pass to viewOrDownloadInvoice
      const order = customer?.orders.find(o => o.id === orderId);
      if (!order) {
        toast.error('Order not found');
        return;
      }

      // Use the same approach as OrderManagement
      await viewOrDownloadInvoice(orderId, order, false);
      toast.success('Invoice opened successfully');
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast.error('Failed to view invoice');
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      // Find the order data to pass to viewOrDownloadInvoice
      const order = customer?.orders.find(o => o.id === orderId);
      if (!order) {
        toast.error('Order not found');
        return;
      }

      // Use the same approach as OrderManagement
      await viewOrDownloadInvoice(orderId, order, true);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Customers
          </button>
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Customer</h2>
            <p className="text-gray-600 mb-4">{error || 'Customer not found'}</p>
            <button
              onClick={fetchCustomerDetails}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Customers
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-gray-600">Customer Details</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-orange-100 p-3 rounded-full">
                  <User className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    customer.status === 'active' ? 'bg-green-100 text-green-800' :
                    customer.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {customer.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{customer.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{customer.phone}</span>
                </div>
                {customer.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{customer.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Joined {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
                {customer.last_visit && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      Last visit {format(new Date(customer.last_visit), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {customer.tags && customer.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {customer.notes && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{customer.notes}</p>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-semibold">{customer.statistics.totalOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Spent</span>
                  <span className="font-semibold">₹{customer.statistics.totalSpent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Order</span>
                  <span className="font-semibold">₹{customer.statistics.averageOrderValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed Orders</span>
                  <span className="font-semibold text-green-600">{customer.statistics.completedOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Orders</span>
                  <span className="font-semibold text-blue-600">{customer.statistics.pendingOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cancelled Orders</span>
                  <span className="font-semibold text-red-600">{customer.statistics.cancelledOrders}</span>
                </div>
                {customer.loyalty_points !== undefined && (
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-gray-600">Loyalty Points</span>
                    <span className="font-semibold text-orange-600">{customer.loyalty_points}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Orders & Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                      <p className="text-sm text-gray-500">
                        {customer.orders.length} orders • Total spent: ₹{customer.statistics.totalSpent.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {customer.statistics.completedOrders} completed
                    </span>
                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      {customer.statistics.pendingOrders} pending
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-4">
                  {customer.orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
                      <p className="text-gray-500">This customer hasn't placed any orders.</p>
                    </div>
                  ) : (
                    customer.orders.map((order) => {
                      return (
                        <motion.div
                          key={order.id}
                          layout
                          className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white"
                        >
                          <div 
                            className="cursor-pointer"
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          >
                            {/* Order Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                      #{order.id.slice(-6).toUpperCase()}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                      {getStatusIcon(order.status)}
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {format(new Date(order.created_at), 'MMM dd, yyyy • h:mm a')}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                {/* Payment Status */}
                                <div className="text-right">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                                      {getPaymentStatusIcon(order.payment_status)}
                                      {order.payment_status === 'paid' ? 'Payment Complete' : 
                                       order.payment_status === 'unpaid' ? 'Payment Pending' :
                                       order.payment_status === 'partial' ? 'Partially Paid' :
                                       order.payment_status === 'failed' ? 'Payment Failed' :
                                       order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                    </span>
                                  </div>
                                  <p className="text-lg font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</p>
                                  <div className="flex items-center gap-1">
                                    <p className="text-xs text-gray-500">{order.payment_method}</p>
                                    {order.payment_status === 'paid' && (
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                    )}
                                    {order.payment_status === 'unpaid' && (
                                      <XCircle className="w-3 h-3 text-red-500" />
                                    )}
                                  </div>
                                </div>
                                
                                {/* Invoice Actions */}
                                <div className="flex items-center gap-2">
                                  <button 
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                                    title="View Invoice"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewInvoice(order.id);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                                    title="Download Invoice"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadInvoice(order.id);
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <div className="ml-2">
                                  {expandedOrder === order.id ? 
                                    <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                  }
                                </div>
                              </div>
                            </div>
                            
                            {/* Quick Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Table:</span>
                                <span className="ml-2 font-medium">{order.table_number || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Type:</span>
                                <span className="ml-2 font-medium capitalize">{order.order_type}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Items:</span>
                                <span className="ml-2 font-medium">{order.order_items.length}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Payment:</span>
                                <span className={`ml-2 font-medium ${
                                  order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {order.payment_status === 'paid' ? 'Done' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedOrder === order.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 pt-6 border-t border-gray-200"
                              >
                                {/* Order Items */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4" />
                                    Order Items
                                  </h4>
                                  <div className="space-y-3">
                                    {order.order_items.map((item) => (
                                      <div key={item.id} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">{item.name}</p>
                                          {item.notes && (
                                            <p className="text-gray-500 text-sm mt-1">{item.notes}</p>
                                          )}
                                        </div>
                                        <div className="text-right ml-4">
                                          <p className="text-sm text-gray-600">{item.quantity} × ₹{item.price.toFixed(2)}</p>
                                          <p className="font-semibold text-gray-900">₹{(item.quantity * item.price).toFixed(2)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}