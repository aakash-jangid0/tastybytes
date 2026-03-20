import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, ChefHat, Bell, Check, ArrowLeft, MapPin, Timer, 
  User, Utensils, ArrowRight, AlertCircle, Calendar,
  CreditCard, Coins, MessageSquare, Download
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import PageTransition from '../components/common/PageTransition';
import { supabase } from '../lib/supabase';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useAuth } from '../context/AuthContext';
import FeedbackForm from '../components/feedback/FeedbackForm';
import { SupportChatModal } from '../components/chat/SupportChatModal';

interface OrderStatus {
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  timestamp: Date;
}

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
  price: number;
}

interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

interface Invoice {
  id?: string;
  order_id?: string;
  items?: InvoiceItem[];
  total_amount?: number;
  created_at?: string;
  invoice_number?: string;
  status?: string;
  customer_name?: string;
  // Include other possible properties with specific types
  invoice_items?: InvoiceItem[];
  subtotal?: number;
  tax_amount?: number;
  payment_method?: string;
  due_date?: string;
  [key: string]: unknown; // For any other properties
}

interface TrackingOrder {
  id: string; // For displaying order number, use id.slice(-6)
  order_items: OrderItem[];
  table_number: string;
  status: OrderStatus['status'];
  estimated_completion_time: string;
  created_at: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  invoice_id?: string; // Add invoice_id to support direct invoice retrieval
  coupon_code?: string;
  coupon_discount_type?: 'percentage' | 'fixed_amount';
  coupon_discount_value?: number;
  coupon_discount_amount?: number;
}

const statusSteps = [
  { 
    status: 'pending', 
    label: 'Order Received', 
    icon: Clock,
    description: 'Your order has been received and is being processed'
  },
  { 
    status: 'preparing', 
    label: 'Preparing', 
    icon: ChefHat,
    description: 'Our chefs are preparing your delicious meal'
  },
  { 
    status: 'ready', 
    label: 'Ready to Serve', 
    icon: Bell,
    description: 'Your order is ready and will be served shortly'
  },
  { 
    status: 'delivered', 
    label: 'Delivered', 
    icon: Check,
    description: 'Enjoy your meal!'
  }
];

function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Add useAuth hook
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isRegisteredCustomer, setIsRegisteredCustomer] = useState<boolean | null>(null);
  const [actualCustomerId, setActualCustomerId] = useState<string | null>(null);

  const fetchInvoice = useCallback(async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `)
        .eq('order_id', orderId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        setInvoice(data);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      // Don't show error toast here, it's not a critical failure
    }
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            name,
            quantity,
            price,
            notes
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Order not found');

      setOrder(orderData);

      // Check if feedback already exists (live check instead of stale has_feedback column)
      const { data: feedbackData } = await supabase
        .from('order_feedback')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();
      setHasFeedback(!!feedbackData);
      
      // Since only authenticated users can access order tracking, 
      // they are by definition registered customers
      setIsRegisteredCustomer(!!user);
      
      // Get the actual customer ID from the customers table
      if (user && orderData.customer_id) {
        setActualCustomerId(orderData.customer_id);
      } else if (user) {
        // Fallback: find customer by user_id
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (customerData) {
          setActualCustomerId(customerData.id);
        }
      }
      
      // Check if this order has an invoice
      fetchInvoice(orderData.id);
    } catch (err: Error | unknown) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId, fetchInvoice, user]);

  useEffect(() => {
    fetchOrder();
    
    // Set up automatic refresh every 5 seconds
    const intervalId = setInterval(() => {
      fetchOrder();
    }, 5000);
    
    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [orderId, fetchOrder]);

  // Setup real-time sync for order updates
  useRealtimeSync({
    table: 'orders',
    filter: `id=eq.${orderId}`,
    onUpdate: (updatedOrder: TrackingOrder) => {
      setOrder(prev => {
        if (prev && prev.status !== updatedOrder.status) {
          toast.success(`Order status updated to ${updatedOrder.status}`);
        }
        return prev ? { ...prev, ...updatedOrder } : updatedOrder;
      });
    }
  });

  // Kept for future use when we add a view invoice button
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleViewInvoice = async () => {
    try {
      setLoadingInvoice(true);
      
      if (invoice) {
        // Use the formal invoice from the database 
        // But use the consistent invoice generator function
        const { viewOrDownloadInvoice } = await import('../utils/invoiceUtils');
        await viewOrDownloadInvoice(order!.id, order!, false);
      } else {
        // Generate a simple receipt from order data
        const invoiceData = {
          invoiceNumber: order!.id.slice(-6).toUpperCase(),
          order_id: order!.id,
          display_order_id: `#${order!.id.slice(-6)}`,
          customerName: order!.customer_name || 'Guest',
          tableNumber: order!.table_number || undefined,
          items: order!.order_items?.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity * 1.18, // including tax
            tax_rate: 0.18,
            tax_amount: item.price * item.quantity * 0.18
          })) || [],
          subtotal: order!.total_amount,
          tax_amount: order!.total_amount * 0.18,
          cgst: order!.total_amount * 0.09, // 9% CGST
          sgst: order!.total_amount * 0.09, // 9% SGST
          total: order!.total_amount * 1.18, // Total with 18% tax
          paymentMethod: order!.payment_method || 'Online',
          date: new Date(order!.created_at)
        };
        
        // Use the same invoice generator as used during order creation
        const invoiceGenerator = await import('../utils/invoiceGenerator');
        const doc = await invoiceGenerator.generateInvoice(invoiceData);
        window.open(await doc.output('bloburl'));
      }
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setLoadingInvoice(true);
      
      if (invoice) {
        // Use the formal invoice from the database
        // But use the consistent invoice generator function
        const { viewOrDownloadInvoice } = await import('../utils/invoiceUtils');
        await viewOrDownloadInvoice(order!.id, order!, true); // true for download
      } else {
        // Generate a simple receipt from order data
        const invoiceData = {
          invoiceNumber: order!.id.slice(-6).toUpperCase(),
          order_id: order!.id,
          display_order_id: `#${order!.id.slice(-6)}`,
          customerName: order!.customer_name || 'Guest',
          tableNumber: order!.table_number || undefined,
          items: order!.order_items?.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            tax_rate: 0.18,
            tax_amount: item.price * item.quantity * 0.18,
            total: item.price * item.quantity * 1.18 // including tax
          })) || [],
          subtotal: order!.total_amount,
          tax_amount: order!.total_amount * 0.18, // 18% tax
          cgst: order!.total_amount * 0.09, // 9% CGST
          sgst: order!.total_amount * 0.09, // 9% SGST
          total: order!.total_amount * 1.18, // Total with 18% tax
          paymentMethod: order!.payment_method || 'Online',
          date: new Date(order!.created_at)
        };
        
        // Use the invoice utils to generate and download the invoice
        const invoiceUtils = await import('../utils/invoiceUtils');
        invoiceUtils.downloadInvoice(invoiceData);
      }
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const getCurrentStep = () => {
    if (!order) return 0;
    return statusSteps.findIndex(step => step.status === order.status);
  };

  const handleFeedbackSubmitted = () => {
    setHasFeedback(true);
    toast.success('Your feedback has been submitted. Thank you!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-4">{error || 'Unable to load order details'}</p>
        <Link
          to="/orders"
          className="text-green-600 hover:text-green-700 font-medium"
        >
          View All Orders
        </Link>
      </div>
    );
  }

  const progressPercentage = (getCurrentStep() / (statusSteps.length - 1)) * 100;

  // Calculate time remaining
  const estimatedTime = order.estimated_completion_time
    ? Math.max(0, Math.floor((new Date(order.estimated_completion_time).getTime() - Date.now()) / 60000))
    : 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-8">
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="bg-white shadow-sm sticky top-0 z-10"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-lg md:text-xl font-semibold">Order #{order.id.slice(-6)}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(order.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="container mx-auto px-4 py-6 space-y-4 md:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-4 md:p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1">
              <motion.div
                className="h-full bg-green-500"
                initial={{ width: '0%' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-3">
              <InfoCard
                icon={User}
                label="Customer"
                value={order.customer_name}
              />
              <InfoCard
                icon={MapPin}
                label="Table"
                value={order.table_number ? `#${order.table_number}` : 'Takeaway'}
              />
              <InfoCard
                icon={CreditCard}
                label="Payment"
                value={`${order.payment_method} (${order.payment_status})`}
              />
              <InfoCard
                icon={Coins}
                label="Total"
                value={`₹${order.total_amount.toFixed(2)}`}
              />
            </div>

            {estimatedTime > 0 && (
              <motion.div 
                className="flex items-center justify-center gap-3 bg-green-50 px-6 py-3 rounded-xl mb-8"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Timer className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">Estimated Time</p>
                  <p className="text-xl font-bold text-green-600">
                    {estimatedTime} mins
                  </p>
                </div>
              </motion.div>
            )}

            <div className="relative mt-8">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" />
              
              <div className="relative flex justify-between">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = getCurrentStep() >= index;
                  const isCurrent = getCurrentStep() === index;

                  return (
                    <div key={step.status} className="flex flex-col items-center relative">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${
                            isActive ? 'bg-green-500' : 'bg-gray-200'
                          } transition-colors duration-300`}
                        >
                          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        </motion.div>
                        <div className="mt-2 text-center">
                          <p className="text-xs md:text-sm font-medium">
                            {step.label}
                          </p>
                          {isCurrent && (
                            <motion.p
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-green-600 mt-1 w-24 md:w-32"
                            >
                              {step.description}
                            </motion.p>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Order Details</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-green-600 font-medium text-sm"
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                  <motion.div
                    animate={{ rotate: showDetails ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              </div>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 overflow-hidden mt-4"
                  >
                    {order.order_items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex justify-between items-start border-b last:border-0 pb-4 last:pb-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-green-50 p-2 rounded-lg">
                            <Utensils className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.quantity}x</span>
                              <span>{item.name}</span>
                            </div>
                            {item.notes && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                                <AlertCircle className="w-3 h-3" />
                                <p>{item.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </motion.div>
                    ))}

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span>₹{order.total_amount.toFixed(2)}</span>
                      </div>
                      {order.coupon_code && (
                        <div className="flex justify-between text-sm text-green-600">
                          <div className="flex items-center">
                            <span>Applied Coupon: {order.coupon_code}</span>
                          </div>
                          <span>
                            -
                            {order.coupon_discount_type === 'percentage'
                              ? `${order.coupon_discount_value}%`
                              : `Rs${order.coupon_discount_amount}`}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span>₹{order.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax (18%)</span>
                        <span>₹{(order.total_amount * 0.18).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>₹{(order.total_amount * 1.18).toFixed(2)}</span>
                      </div>

                      {/* Invoice Actions */}
                      <div className="pt-4 flex flex-wrap gap-3">
                        <button
                          onClick={handleDownloadInvoice}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          disabled={loadingInvoice}
                        >
                          {loadingInvoice ? (
                            <span className="flex items-center">
                              <div className="animate-spin h-4 w-4 mr-1 border-b-2 border-white rounded-full"></div>
                              Loading...
                            </span>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download Bill
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="sticky bottom-0 bg-white p-4 md:static md:flex md:space-x-4 border-t md:border-t-0 shadow-lg md:shadow-none z-10"
          >
            <button
              onClick={() => {
                if (isRegisteredCustomer) {
                  setShowChatModal(true);
                } else {
                  // Redirect to registration for non-registered customers
                  window.location.href = '/auth?mode=signup&redirect=' + encodeURIComponent(window.location.pathname);
                }
              }}
              className={`flex items-center justify-center gap-2 w-full py-4 md:py-3 rounded-full font-medium transition-colors mb-3 md:mb-0 text-base md:text-sm touch-manipulation ${
                isRegisteredCustomer 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <MessageSquare className="w-5 h-5 md:w-4 md:h-4" />
              {isRegisteredCustomer ? 'Need Help? Start Chat' : 'Sign Up for Live Chat'}
            </button>

            <button
              onClick={() => setFeedbackOpen(true)}
              disabled={hasFeedback}
              className={`flex items-center justify-center gap-2 w-full py-4 md:py-3 rounded-full font-medium transition-colors text-base md:text-sm touch-manipulation ${
                hasFeedback 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <MessageSquare className="w-5 h-5 md:w-4 md:h-4" />
              {hasFeedback ? 'Feedback Submitted' : 'Leave Feedback'}
            </button>
          </motion.div>
        </div>
      </div>

      {order && (
        <FeedbackForm 
          order={order}
          isOpen={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}

      {/* Support Chat Modal - Only for registered customers */}
      {order && isRegisteredCustomer && user && actualCustomerId && (
        <SupportChatModal
          orderId={order.id}
          customerId={actualCustomerId}
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </PageTransition>
  );
}

interface InfoCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function InfoCard({ icon: Icon, label, value }: InfoCardProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </span>
      <span className="text-sm font-medium truncate">{value}</span>
    </div>
  );
}

export default OrderTracking;