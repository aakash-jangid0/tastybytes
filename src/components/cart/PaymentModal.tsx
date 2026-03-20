import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Wallet, IndianRupee } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { initializeRazorpay, createRazorpayOrder, openRazorpayCheckout } from '../../lib/razorpay';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onPaymentComplete: (paymentMethod?: string) => void;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  onPaymentComplete,
  customerName,
  customerEmail,
  customerPhone
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<'razorpay' | 'cash'>('razorpay');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      if (selectedMethod === 'cash') {
        // Handle cash payment
        toast.success('Cash payment selected. Please pay at counter.');
        onPaymentComplete('cash'); // Pass the payment method
        onClose();
        return;
      }

      // Initialize Razorpay
      const isRazorpayLoaded = await initializeRazorpay();
      if (!isRazorpayLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      // Create order
      const order = await createRazorpayOrder(amount);

      // Open Razorpay checkout
      const response = await openRazorpayCheckout({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        orderId: order.id,
        name: 'TastyBites',
        description: 'Food Order Payment',
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone
        },
        theme: {
          color: '#F97316'
        }
      });

      // Handle successful payment
      toast.success('Payment successful!');
      onPaymentComplete('razorpay'); // Pass the payment method
      onClose();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
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
            className="bg-white rounded-xl w-full max-w-md p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Payment Method</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <button
                onClick={() => setSelectedMethod('razorpay')}
                className={`w-full flex items-center p-4 rounded-lg border-2 transition-colors ${
                  selectedMethod === 'razorpay'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-200'
                }`}
              >
                <CreditCard className="w-6 h-6 mr-3 text-orange-500" />
                <div className="flex-1 text-left">
                  <h3 className="font-medium">Pay Online</h3>
                  <p className="text-sm text-gray-500">Credit/Debit Card, UPI, Net Banking</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('cash')}
                className={`w-full flex items-center p-4 rounded-lg border-2 transition-colors ${
                  selectedMethod === 'cash'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-200'
                }`}
              >
                <IndianRupee className="w-6 h-6 mr-3 text-orange-500" />
                <div className="flex-1 text-left">
                  <h3 className="font-medium">Pay with Cash</h3>
                  <p className="text-sm text-gray-500">Pay at counter after ordering</p>
                </div>
              </button>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-600">Amount to Pay</span>
                <span className="text-xl font-semibold">₹{amount.toFixed(2)}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <Wallet className="w-5 h-5 mr-2 animate-pulse" />
                    Processing...
                  </span>
                ) : (
                  <span>Proceed to Pay</span>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}