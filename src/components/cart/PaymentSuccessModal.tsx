import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  paymentMethod: string;
  amount: number;
  confirmationPending?: boolean;
}

export default function PaymentSuccessModal({
  isOpen,
  onClose,
  orderId,
  paymentMethod,
  amount,
  confirmationPending = false
}: PaymentSuccessModalProps) {
  const isCashPayment = paymentMethod === 'cash';

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
              <h2 className="text-xl font-semibold">
                {confirmationPending ? 'Payment Received' : isCashPayment ? 'Order Placed' : 'Payment Successful'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-6 mb-4">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-1">Thank You!</h3>
              <p className="text-gray-600 mb-4 text-center">
                {confirmationPending
                  ? 'Your payment was successful. We are confirming your order; use order tracking for updates.'
                  : isCashPayment
                    ? 'Your order has been placed. Please pay at the counter.'
                    : 'Your payment was successful and your order has been placed.'}
              </p>
              
              <div className="w-full bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{orderId.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {isCashPayment ? 'Amount Due:' : confirmationPending ? 'Amount:' : 'Amount Paid:'}
                  </span>
                  <span className="font-medium">₹{amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                to="/menu"
                className="flex-1 py-2 px-4 border border-orange-500 text-orange-500 rounded-lg font-semibold text-center hover:bg-orange-50"
              >
                Back to Menu
              </Link>
              <Link
                to={`/track/${orderId}`}
                className="flex-1 py-2 px-4 bg-orange-500 text-white rounded-lg font-semibold text-center hover:bg-orange-600"
              >
                Track Order
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
