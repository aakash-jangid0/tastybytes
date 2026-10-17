import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Wallet, IndianRupee, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { processRazorpayPayment } from '../../lib/payment';
import { PaymentMethod, PaymentStatus } from '../../types/payment';

interface PaymentOption {
  id: PaymentMethod;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface PaymentData {
  [key: string]: unknown;
  orderId?: string;
  paymentId?: string;
  paymentMessage?: string;
  skipErrorHandling?: boolean;
  skipInvoice?: boolean;
  isCashPayment?: boolean;
  success?: boolean;
  isPreOrder?: boolean;
  finalizeOrder?: boolean;
  error?: string;
}

// Enhanced Payment Modal Props combines the props from both previous components
interface EnhancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId?: string;
  createOrder?: (paymentMethod?: string) => Promise<string | null>;
  onPaymentComplete: (paymentMethod?: string, paymentStatus?: PaymentStatus, paymentData?: PaymentData) => void | Promise<void>;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  // Mode determines which payment options to show
  mode?: 'website' | 'counter';
  businessName?: string;
  orderDescription?: string;
}

export default function EnhancedPaymentModal({
  isOpen,
  onClose,
  amount,
  orderId,
  createOrder,
  onPaymentComplete,
  customerName,
  customerEmail,
  customerPhone,
  mode = 'website',
  orderDescription = 'Food Order Payment'
}: EnhancedPaymentModalProps) {
  // State variables for order management
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false);
  const [generatedOrderId, setGeneratedOrderId] = React.useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = React.useState<'razorpay' | 'cash' | 'card' | 'upi'>(
    mode === 'website' ? 'razorpay' : 'cash'
  );
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Function to get or create order ID when payment is initiated
  const getOrderId = async (paymentMethod?: string): Promise<string | null> => {
    // If we already have an order ID from props, use it
    if (orderId) {
      return orderId;
    }
    
    // If we've already generated an order ID in this session, use it
    if (generatedOrderId) {
      return generatedOrderId;
    }
    
    // If no order ID yet and we have a create function, call it
    if (createOrder) {
      setIsCreatingOrder(true);
      try {
        const newOrderId = await createOrder(paymentMethod);
        if (newOrderId) {
          setGeneratedOrderId(newOrderId);
          return newOrderId;
        }
        return null;
      } catch (error) {
        console.error('Failed to create order:', error);
        return null;
      } finally {
        setIsCreatingOrder(false);
      }
    }
    
    return null;
  };

  // Define payment methods based on mode
  const paymentMethods: PaymentOption[] = React.useMemo(() => {
    const methods: PaymentOption[] = [];

    // Online payment via Razorpay is available in both modes
    methods.push({
      id: 'razorpay',
      title: 'Online Payment',
      description: 'Pay online with Card/UPI/Net Banking',
      icon: <CreditCard className="w-6 h-6 mr-3 text-orange-500" />
    });

    // Cash payment is available in both modes, but with different descriptions
    methods.push({
      id: 'cash',
      title: 'Cash Payment',
      description: mode === 'website' ? 'Pay at counter after ordering' : 'Collect cash at counter',
      icon: <IndianRupee className="w-6 h-6 mr-3 text-orange-500" />
    });

    // Counter-specific payment options
    if (mode === 'counter') {
      methods.push({
        id: 'card',
        title: 'Card Payment (Counter POS)',
        description: 'Process card payment at counter',
        icon: <CreditCard className="w-6 h-6 mr-3 text-orange-500" />
      });

      methods.push({
        id: 'upi',
        title: 'UPI Payment (Counter QR)',
        description: 'Show UPI QR at counter',
        icon: <Wallet className="w-6 h-6 mr-3 text-orange-500" />
      });
    }
    
    return methods;
  }, [mode]);
  
  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Validate amount first
      if (!amount || amount <= 0) {
        toast.error('Invalid payment amount');
        setIsProcessing(false);
        return;
      }
      
      // Handle cash/card/upi payments at counter
      if (selectedMethod === 'cash' || (mode === 'counter' && (selectedMethod === 'card' || selectedMethod === 'upi'))) {
        try {
          console.log('Processing cash/card/upi payment');
          // For cash/card/upi, make sure we create an order if needed
          let paymentOrderId = orderId || generatedOrderId;
          
          // If we don't have an order ID yet and getOrderId is available, call it
          if (!paymentOrderId) {
            console.log('No order ID yet, creating one for cash payment...');
            setIsProcessing(true);
            try {
              paymentOrderId = await getOrderId(selectedMethod);
              console.log('Order created with ID:', paymentOrderId);
              
              if (!paymentOrderId) {
                console.error('Failed to get order ID');
                toast.error('Failed to create order. Please try again.');
                setIsProcessing(false);
                return;
              }
            } catch (orderError) {
              console.error('Error in getOrderId():', orderError);
              toast.error('Failed to create order. Please try again later.');
              setIsProcessing(false);
              return;
            }
          }
          
          if (!paymentOrderId) {
            console.error('No order ID available for payment completion');
            toast.error('Cannot process payment without an order. Please try again.');
            setIsProcessing(false);
            return;
          }
          
          const methodName = selectedMethod.toUpperCase();
          // Store payment method message to pass to payment handler instead of showing toast here
          const paymentMessage = `${methodName} payment selected. ${mode === 'website' ? 'Pay at counter.' : 'Collect payment at counter.'}`;
          
          // Pass the order ID and payment message in payment data with special flags for cash payments
          console.log('Completing payment with order ID:', paymentOrderId);
          await onPaymentComplete(selectedMethod, 'pending', { 
            orderId: paymentOrderId,
            paymentMessage: paymentMessage,
            skipErrorHandling: true, // Flag to skip error handling for cash payments
            skipInvoice: true, // Skip detailed invoice for cash payments
            isCashPayment: true // Explicitly mark as cash payment
          });
          onClose();
        } catch (error) {
          console.error('Error handling cash/card/upi payment:', error);
          toast.error('Failed to process payment. Please try again.');
          setIsProcessing(false);
        }
        return;
      }
      
      // For Razorpay online payments
      if (selectedMethod === 'razorpay') {
        try {
          // For Razorpay, we'll create a temporary order ID for payment processing
          // The actual order creation will happen after successful payment
          let paymentOrderId = orderId || generatedOrderId;
          let isPreOrder = false; // Flag to track if this is a pre-order (not fully created yet)
          
          // If we don't have an order ID yet and getOrderId is available, call it
          if (!paymentOrderId) {
            setIsProcessing(true);
            
            // For online payments, we just need a temporary order ID
            // The full order will be created after successful payment
            paymentOrderId = await getOrderId();
            isPreOrder = true;
            
            if (!paymentOrderId) {
              toast.error('Failed to initialize payment. Please try again.');
              setIsProcessing(false);
              return;
            }
          }
          
          // Validate that we have an orderId before proceeding
          if (!paymentOrderId) {
            console.error('No order ID provided for Razorpay payment');
            toast.error('Payment failed: Missing order ID');
            setIsProcessing(false);
            return;
          }

          console.log(`Starting Razorpay payment flow for order: ${paymentOrderId}, amount: ${amount}`);
          
          // Process the payment using our utility function
          const result = await processRazorpayPayment(
            paymentOrderId,
            amount,
            {
              name: customerName || 'Customer',
              email: customerEmail || '',
              phone: customerPhone || ''
            }
          );
          
          // The checkout handler owns the single customer-facing success message.
          await onPaymentComplete('razorpay', 'completed', {
            paymentId: result.paymentId,
            orderId: result.orderId,
            success: result.success,
            isPreOrder: isPreOrder, // Let the handler know if this was a pre-order
            finalizeOrder: true // Signal that the order should be finalized now
          });
          onClose();
        } catch (error: unknown) {
          setIsProcessing(false);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          
          if (errorMessage === 'Payment cancelled by user') {
            toast.error('Payment was cancelled.');
          } else if (errorMessage?.includes('SDK failed to load')) {
            toast.error('Payment service unavailable. Please check your internet connection and try again.', {
              duration: 5000,
              icon: '🌐',
            });
          } else if (errorMessage?.includes('verification failed')) {
            toast.error('Payment verification failed. The payment may have been processed. Please check with customer service.', {
              duration: 6000,
              icon: '⚠️',
            });
          } else if (errorMessage?.includes('Failed to fetch') || errorMessage?.includes('Network')) {
            toast.error('Network error. Please check your internet connection and try again.', {
              icon: '📶',
              duration: 4000,
            });
          } else {
            console.error('Razorpay payment error:', error);
            toast.error(errorMessage || 'Payment processing failed. Please try again.', {
              duration: 4000,
            });
          }
        }
      }
    } catch (error: unknown) {
      console.error('Payment error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Provide more specific error messages based on error types
      if (errorMessage?.includes('network') || errorMessage?.includes('connection')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (errorMessage?.includes('authentication') || errorMessage?.includes('auth')) {
        toast.error('Authentication error. Please try again or contact support.');
      } else {
        toast.error(errorMessage || 'Payment processing failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Complete Your Payment</h2>
                <p className="text-gray-500 text-sm">
                  {(orderId || generatedOrderId) ? `Order #${(orderId || generatedOrderId)?.substring(0, 8)}` : orderDescription}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-orange-700">
                <p className="font-medium">Secure Payment</p>
                <p>All transactions are secure and encrypted</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">Amount to Pay</h3>
                <span className="text-xl font-bold">₹{amount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-200 w-full my-3"></div>
            </div>
            
            <h3 className="font-medium mb-3 text-gray-700">Select Payment Method</h3>
            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full p-3 border rounded-lg flex items-center ${
                    selectedMethod === method.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {method.icon}
                  <div className="text-left">
                    <div className="font-medium">{method.title}</div>
                    <div className="text-sm text-gray-500">{method.description}</div>
                  </div>
                  {selectedMethod === method.id && (
                    <div className="ml-auto bg-orange-500 rounded-full w-4 h-4"></div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <motion.button
                onClick={handlePayment}
                disabled={isProcessing || isCreatingOrder}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              >
                {isProcessing || isCreatingOrder ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  `Pay Rs${amount.toFixed(2)}`
                )}
              </motion.button>
              <p className="text-xs text-gray-500 text-center mt-3">
                By proceeding, you agree to our terms and conditions
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
