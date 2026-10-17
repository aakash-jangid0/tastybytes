import { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { toast } from 'react-hot-toast';
import PageTransition from '../components/common/PageTransition';
import EnhancedPaymentModal from '../components/cart/EnhancedPaymentModal';
import PaymentSuccessModal from '../components/cart/PaymentSuccessModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import NetworkErrorAlert from '../components/ui/NetworkErrorAlert';
import { generateAndProcessInvoice } from '../utils/orderInvoiceUtils';
import { supabase } from '../lib/supabase';
import { PaymentStatus } from '../types/payment';

// Interface for coupon data
interface CouponData {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
}

// Utility function to increment coupon usage count
const incrementCouponUsage = async (couponId: number): Promise<void> => {
  try {
    const isDevelopment = import.meta.env.MODE === 'development' || window.location.hostname === 'localhost';
    const API_URL = isDevelopment 
      ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
      : `${window.location.origin}/api`;
    const response = await fetch(`${API_URL}/coupons/${couponId}/increment-usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Failed to increment coupon usage:', response.statusText);
      // Don't throw an error here as we don't want to break the order flow
      // if coupon increment fails - just log it
    } else {
      console.log(`Successfully incremented usage for coupon ID: ${couponId}`);
    }
  } catch (error) {
    console.error('Error incrementing coupon usage:', error);
    // Don't throw an error here as we don't want to break the order flow
  }
};

function Cart() {
  const { cartItems, maxItemQuantity, updateQuantity, removeFromCart, clearCartSilently } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const [tableNumber, setTableNumber] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentConfirmationPending, setPaymentConfirmationPending] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [paymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [createdOrderId, setCreatedOrderId] = useState<string>();
  const [completedPaymentData, setCompletedPaymentData] = useState<{
    method: string;
    amount: number;
    orderId: string;
  }>();
  
  // Coupon related states
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate discount amount if coupon is applied
  const discountAmount = appliedCoupon 
    ? appliedCoupon.discount_type === 'percentage' 
      ? Math.min(
          subtotal * (appliedCoupon.discount_value / 100), 
          appliedCoupon.max_discount_amount || Infinity
        )
      : appliedCoupon.discount_value
    : 0;
  
  // Apply minimum order amount check
  const discountedSubtotal = subtotal - (
    appliedCoupon && subtotal >= (appliedCoupon.min_order_amount || 0) 
      ? discountAmount 
      : 0
  );
  
  const tax = discountedSubtotal * 0.18; // 18% tax
  const total = discountedSubtotal + tax;

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/auth');
      return;
    }

    if (orderType === 'dine-in' && !tableNumber.trim()) {
      toast.error('Please enter your table number');
      return;
    }
    
    // Instead of creating the order immediately, just show the payment modal
    setCompletedPaymentData(undefined);
    setPaymentConfirmationPending(false);
    setCreatedOrderId(undefined);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (
    receivedPaymentMethod?: string, 
    paymentStatus?: PaymentStatus,
    paymentData?: Record<string, unknown>
  ) => {
    console.log('Payment complete callback received:', { 
      receivedPaymentMethod, 
      paymentStatus, 
      paymentData 
    });
    
    if (!user?.id) {
      console.error('User authentication error - no user ID');
      toast.error('User authentication error. Please try logging in again.');
      navigate('/auth');
      return;
    }
    
    // Check if we received an orderId in the payment data
    const paymentOrderId = paymentData?.orderId as string | undefined;
    console.log('Order IDs available:', { paymentOrderId, createdOrderId });
    
    // Use either the existing createdOrderId or the one received in paymentData
    const finalOrderId = createdOrderId || paymentOrderId;
    
    if (!finalOrderId) {
      console.error('No order ID found in either state or payment data');
      toast.error('Order ID not found. Please try again.');
      return;
    }
    
    // Update the createdOrderId state if needed
    if (paymentOrderId && !createdOrderId) {
      console.log('Updating createdOrderId state with:', paymentOrderId);
      setCreatedOrderId(paymentOrderId);
    }

    setIsProcessing(true);
    try {
      // Use the received payment method if provided, otherwise use the selected one from state
      // Ensure payment method is one of the valid types
      let finalPaymentMethod: 'cash' | 'card' | 'upi' | 'razorpay' = paymentMethod;
      
      // If we received an external payment method, validate it
      if (receivedPaymentMethod) {
        if (['cash', 'card', 'upi', 'razorpay'].includes(receivedPaymentMethod)) {
          finalPaymentMethod = receivedPaymentMethod as 'cash' | 'card' | 'upi' | 'razorpay';
        }
      }
      
      console.log('Processing payment:', {
        orderId: finalOrderId,
        paymentMethod: finalPaymentMethod,
        paymentStatus: paymentStatus || 'completed',
        paymentData
      });
      
      // Different flow based on payment method
      let order;
      
      // For online payments that were successful, finalize the order
      if (finalPaymentMethod === 'razorpay' && paymentData?.finalizeOrder) {
        if (paymentData?.success) {
          console.log('Online payment successful, finalizing order');
          
          // Update order with payment details
          const { data: orderData, error: updateError } = await supabase
            .from('orders')
            .update({
              payment_method: finalPaymentMethod,
              payment_status: 'completed',
              payment_details: {
                paymentId: paymentData.paymentId,
                timestamp: new Date().toISOString(),
                ...paymentData
              }
            })
            .eq('id', finalOrderId)
            .select()
            .single();
            
          if (updateError) {
            console.error('Error updating order with payment details:', updateError);
            throw new Error(`Failed to update order: ${updateError.message}`);
          }
          
          order = orderData;
        } else {
          throw new Error('Payment was not successful');
        }
      }
      // For cash payments, handle differently
      else if (finalPaymentMethod === 'cash' && paymentData?.skipErrorHandling) {
        console.log('Cash payment - skipping order update in database');
        // For cash payments, try to fetch the order instead of updating it
        const { data: orderData, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', finalOrderId)
          .single();
          
        if (fetchError) {
          console.warn('Could not fetch order details, but continuing with payment flow:', fetchError);
          // Create a minimal order object with the ID to continue the flow
          order = { id: finalOrderId };
        } else {
          order = orderData;
        }
      } 
      // For any other payment methods, update the order as usual
      else {
        console.log('Updating order with payment details in database');
        const { data: orderData, error: updateError } = await supabase
          .from('orders')
          .update({
            payment_method: finalPaymentMethod,
            payment_status: paymentStatus || 'completed',
            payment_details: paymentData || null
          })
          .eq('id', finalOrderId)
          .select()
          .single();
          
        if (updateError) {
          console.error('Error updating order with payment details:', updateError);
          throw new Error(`Failed to update order: ${updateError.message}`);
        }
        
        order = orderData;
      }
      
      if (!order) {
        console.error('No order data available');
        if (finalPaymentMethod === 'cash' && paymentData?.skipErrorHandling) {
          // For cash payments, continue even without order data
          order = { id: finalOrderId };
        } else {
          throw new Error('Failed to process order: No data available');
        }
      }
      
      console.log('Order successfully updated with payment details:', order);
      
      // Use our consistent utility function to handle invoice generation, saving, and printing
      try {
        const invoiceResult = await generateAndProcessInvoice(
          order,               // order object
          cartItems,           // order items
          subtotal,            // subtotal
          tax,                 // tax
          total,               // total
          user?.user_metadata?.name || user?.email || 'Guest', // customer name
          undefined,           // customer phone (not captured in this flow)
          orderType === 'dine-in' ? tableNumber : 'Takeaway', // table number
          finalPaymentMethod,  // payment method
          false                // invoice failures are logged; checkout reports the order outcome once
        );
        
        // Invoice has been generated and saved to database, but we don't auto-print it
        // The invoice can be viewed/printed/downloaded from the order tracking page
        if (!invoiceResult) {
          // Only show a message if invoice creation failed
          console.warn('Could not generate invoice but order was placed successfully.');
        }
      } catch (invoiceError) {
        console.error('Error processing invoice:', invoiceError);
      }
      
      // Store payment completion data for success modal
      setCompletedPaymentData({
        method: finalPaymentMethod,
        amount: total,
        orderId: finalOrderId
      });
      
      // Increment coupon usage if a coupon was applied
      if (appliedCoupon) {
        try {
          await incrementCouponUsage(appliedCoupon.id);
        } catch (error) {
          console.error('Error incrementing coupon usage:', error);
          // Don't block the order completion flow if coupon usage increment fails
        }
      }
      
      clearCartSilently();
      
      // Close payment modal and show success modal
      setShowPaymentModal(false);
      setShowSuccessModal(true);
    } catch (error: unknown) {
      console.error('Error placing order:', error);

      if (receivedPaymentMethod === 'razorpay' && paymentData?.success) {
        setCompletedPaymentData({
          method: receivedPaymentMethod,
          amount: total,
          orderId: finalOrderId
        });
        setPaymentConfirmationPending(true);
        clearCartSilently();
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        return;
      }
      
      // For cash payments or if skipErrorHandling flag is set, we don't want to show the error 
      // Since cash orders are more forgiving (payment happens later at counter)
      if (receivedPaymentMethod === 'cash' || paymentData?.skipErrorHandling) {
        console.log('Ignoring error for cash/counter payment and proceeding with success flow');
        
        // Store payment completion data for success modal even if there was an error updating
        setCompletedPaymentData({
          method: receivedPaymentMethod || 'cash',
          amount: total,
          orderId: finalOrderId
        });
        
        clearCartSilently();
        
        // Close payment modal and show success modal
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        
        return; // Exit early to avoid showing error for cash payments
      }
      
      // For other payment methods, show appropriate error messages
      let errorMessage = 'Failed to place order. Please try again.';
      
      const isErrorWithMessage = (err: unknown): err is { message: string } => 
        typeof err === 'object' && err !== null && 'message' in err;
      
      const isErrorWithCode = (err: unknown): err is { code: string } =>
        typeof err === 'object' && err !== null && 'code' in err;
      
      if (isErrorWithMessage(error)) {
        if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Order not found. Please try again.';
        } else if (error.message.includes('permission') || error.message.includes('403')) {
          errorMessage = 'You don\'t have permission to update this order. Please try again or contact support.';
        } 
      }
      
      if (isErrorWithCode(error) && error.code === '23505') {
        errorMessage = 'This order has already been processed.';
      }
      
      toast.error(errorMessage, {
        duration: 4000,
        icon: '⚠️',
      });
    } finally {
      setIsProcessing(false);
      setShowPaymentModal(false);
    }
  };

  return (
    <PageTransition>
      <NetworkErrorAlert />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-2xl font-bold">Your Cart</h1>
          </div>

          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-gray-500">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Minus className="w-4 h-4" />
                      </motion.button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= maxItemQuantity}
                        aria-label={`Add one ${item.name}`}
                        title={item.quantity >= maxItemQuantity
                          ? `Maximum ${maxItemQuantity} per dish`
                          : `Add one ${item.name}`}
                        className="p-1 hover:bg-gray-100 rounded-full disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                  <h2 className="text-xl font-bold mb-5 flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 text-orange-500" /> 
                    Order Summary
                  </h2>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Order Type</h3>
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => setOrderType('dine-in')}
                        className={`flex-1 py-2 rounded-lg transition-all ${
                          orderType === 'dine-in'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Dine In
                      </button>
                      <button
                        onClick={() => setOrderType('takeaway')}
                        className={`flex-1 py-2 rounded-lg transition-all ${
                          orderType === 'takeaway'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Takeaway
                      </button>
                    </div>

                    {orderType === 'dine-in' && (
                      <div className="mt-3">
                        <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Table Number
                        </label>
                        <div className="relative">
                          <input
                            id="tableNumber"
                            type="text"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder="Enter your table number"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>                    {/* Coupon Section */}
                    <div className="mb-4">
                      <div className="flex gap-2 mb-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Enter coupon code"
                            disabled={appliedCoupon !== null || couponLoading}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            if (!couponCode) return;
                            setCouponLoading(true);
                            try {
                              const { data: coupon, error } = await supabase
                                .from('coupons')
                                .select('*')
                                .eq('code', couponCode.toUpperCase())
                                .eq('is_active', true)
                                .single();
                              
                              if (error) throw error;
                              if (!coupon) throw new Error('Coupon not found');
                              
                              // Check if coupon is expired
                              if (new Date(coupon.expiry_date) < new Date()) {
                                toast.error('This coupon has expired');
                                return;
                              }
                              
                              // Check minimum order amount
                              if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
                                toast.error(`Minimum order amount for this coupon is Rs${coupon.min_order_amount}`);
                                return;
                              }
                              
                              // Check if coupon has reached its usage limit
                              if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
                                toast.error('This coupon has reached its usage limit');
                                return;
                              }
                              
                              setAppliedCoupon(coupon);
                              setCouponCode('');
                              toast.success('Coupon applied successfully!', { 
                                duration: 3000,
                                style: { cursor: 'pointer' }
                              });
                            } catch (error: unknown) {
                              console.error('Error applying coupon:', error);
                              const errorMsg = error instanceof Error ? error.message : 'Invalid coupon code';
                              toast.error(errorMsg, { 
                                duration: 4000,
                                style: { cursor: 'pointer' }
                              });
                            } finally {
                              setCouponLoading(false);
                            }
                          }}
                          disabled={!couponCode || couponLoading || appliedCoupon !== null}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            !couponCode || couponLoading || appliedCoupon !== null
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          {couponLoading ? <LoadingSpinner size="small" color="orange" /> : 'Apply'}
                        </button>
                      </div>

                      {appliedCoupon && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              <span className="text-sm font-medium text-green-800">
                                {appliedCoupon.code} - {appliedCoupon.discount_type === 'percentage' 
                                  ? `${appliedCoupon.discount_value}% off` 
                                  : `Rs${appliedCoupon.discount_value} off`}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setAppliedCoupon(null);
                                toast.success('Coupon removed', { 
                                  duration: 2000,
                                  style: { cursor: 'pointer' }
                                });
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Tax (18%)</span>
                        <span>₹{tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-3 border-t border-orange-200 text-gray-900">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>

                  {/* Payment preference section removed to simplify checkout process */}

                  <motion.button
                    whileHover={isProcessing ? {} : { scale: 1.02 }}
                    whileTap={isProcessing ? {} : { scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 mt-6 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md"
                  >
                    {isProcessing ? (
                      <>
                        <LoadingSpinner size="small" color="white" />
                        <span className="ml-2">Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        <span>Proceed to Checkout</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/menu')}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
              >
                Browse Menu
              </motion.button>
            </div>
          )}
        </div>

        <EnhancedPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={total}
          orderId={createdOrderId}
          createOrder={async (paymentMethod) => {
            console.log('Creating order for payment:', { user, cartItems, orderType, paymentMethod });
            setIsProcessing(true);
            try {
              // Create order to get the ID
              const order = await createOrder({
                items: cartItems.map(item => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price
                })),
                totalAmount: total,
                user_id: user?.id, // Make this optional in case user object is incomplete
                customerName: user?.user_metadata?.name || user?.email || 'Guest',
                customerEmail: user?.email,
                tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
                orderType,
                // Include coupon information if a coupon is applied
                coupon: appliedCoupon ? {
                  id: appliedCoupon.id,
                  code: appliedCoupon.code,
                  discount_type: appliedCoupon.discount_type,
                  discount_value: appliedCoupon.discount_value,
                  discount_amount: discountAmount
                } : null,
                // Set payment method based on the current payment flow
                paymentMethod: 'pending' as 'cash' | 'card' | 'upi' | 'razorpay' | 'pending' // Initially set as pending, will be updated after payment
              });
              
              if (!order || !order.id) {
                console.error('Order creation failed - no order ID returned');
                return null;
              }
              
              setCreatedOrderId(order.id);
              console.log('Created order with ID:', order.id);
              return order.id;
            } catch (error) {
              console.error('Error creating order:', error);
              return null;
            } finally {
              setIsProcessing(false);
            }
          }} 
          onPaymentComplete={handlePaymentComplete}
          customerName={user?.user_metadata?.name}
          customerEmail={user?.email}
        />
        
        {completedPaymentData && (
          <PaymentSuccessModal
            isOpen={showSuccessModal}
            onClose={() => {
              setShowSuccessModal(false);
              navigate(`/track/${completedPaymentData.orderId}`);
            }}
            orderId={completedPaymentData.orderId}
            paymentMethod={completedPaymentData.method}
            amount={completedPaymentData.amount}
            confirmationPending={paymentConfirmationPending}
          />
        )}
      </div>
    </PageTransition>
  );
}

export default Cart;