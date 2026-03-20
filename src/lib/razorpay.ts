import { loadScript } from '../utils/loadScript';
import { RazorpayResponse } from '../types/payment';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_OjVlCpSLytdwMx';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

declare global {
  interface Window {
    Razorpay: new (options: unknown) => {
      open: () => void;
      on: (event: string, callback: (response: unknown) => void) => void;
    };
  }
}

export interface RazorpayOptions {
  amount: number;
  currency?: string;
  orderId: string;
  name: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

export const initializeRazorpay = async () => {
  return await loadScript('https://checkout.razorpay.com/v1/checkout.js');
};

export const createRazorpayOrder = async (amount: number, orderId?: string) => {
  if (!amount || amount <= 0) throw new Error('Invalid amount for Razorpay order');
  if (!orderId?.trim()) throw new Error('Order ID is required for Razorpay payment');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, orderId }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to create order');
  return data;
};

export const openRazorpayCheckout = (options: RazorpayOptions): Promise<RazorpayResponse> => {
  return new Promise((resolve, reject) => {
    try {
      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY,
        amount: options.amount,
        currency: options.currency || 'INR',
        order_id: options.orderId,
        name: options.name,
        description: options.description || 'Order Payment',
        prefill: options.prefill || {},
        theme: options.theme || { color: '#F97316' },
        handler: (response: RazorpayResponse) => {
          if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
            reject(new Error('Invalid payment response'));
            return;
          }
          resolve(response);
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled by user')),
          escape: true,
          animation: true,
        },
        notes: { order_id: options.orderId },
      });

      rzp.on('payment.failed', (response: { error: { description?: string } }) => {
        reject(new Error(response.error.description || 'Payment failed'));
      });

      rzp.open();
    } catch (error) {
      reject(error || new Error('Failed to initialize payment'));
    }
  });
};
