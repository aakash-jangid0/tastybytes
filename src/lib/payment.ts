import { supabase } from './supabase';
import { PaymentData, PaymentMethod, PaymentStatus, RazorpayResponse } from '../types/payment';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const verifyRazorpayPayment = async (
  paymentData: RazorpayResponse,
  orderId: string,
): Promise<{ verified: boolean; orderId: string; paymentId: string }> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_signature: paymentData.razorpay_signature,
      orderId,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Payment verification failed');
  return data;
};

export const savePaymentDetails = async (
  orderId: string,
  amount: number,
  method: PaymentMethod,
  status: PaymentStatus,
  transactionId?: string,
  transactionData?: Record<string, unknown>,
): Promise<{ success: boolean; data: PaymentData }> => {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      order_id: orderId,
      amount,
      method,
      status,
      transaction_id: transactionId,
      transaction_data: transactionData,
    })
    .select()
    .single();

  if (error) throw error;
  return { success: true, data };
};

export const processRazorpayPayment = async (
  orderId: string,
  amount: number,
  customerInfo: { name?: string; email?: string; phone?: string },
) => {
  try {
    const { initializeRazorpay, createRazorpayOrder, openRazorpayCheckout } = await import('./razorpay');

    const isRazorpayLoaded = await initializeRazorpay();
    if (!isRazorpayLoaded) throw new Error('Razorpay SDK failed to load. Please check your internet connection.');

    const order = await createRazorpayOrder(amount, orderId);

    const response = await openRazorpayCheckout({
      amount: amount * 100,
      currency: 'INR',
      orderId: order.id,
      name: import.meta.env.VITE_BUSINESS_NAME || 'TastyBites',
      description: `Order #${orderId}`,
      prefill: {
        name: customerInfo.name || 'Customer',
        email: customerInfo.email || '',
        contact: customerInfo.phone || '',
      },
      theme: { color: '#F97316' },
    });

    const verificationResult = await verifyRazorpayPayment(response, orderId);

    if (verificationResult.verified) {
      try {
        await savePaymentDetails(
          orderId,
          amount,
          'razorpay',
          'completed',
          response.razorpay_payment_id,
          response as unknown as Record<string, unknown>,
        );
      } catch (error) {
        console.error('Verified payment could not be recorded in the payments table:', error);
      }
    } else {
      throw new Error('Payment verification failed');
    }

    return {
      success: verificationResult.verified,
      paymentId: response.razorpay_payment_id,
      orderId,
    };
  } catch (error) {
    console.error('Razorpay payment processing failed:', error);
    throw error;
  }
};
