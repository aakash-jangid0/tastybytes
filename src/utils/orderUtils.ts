import { OrderItem } from '../types/orders'; // Fixed import path
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface CouponData {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount_amount: number | null;
}

export const calculateOrderTotals = (
  items: OrderItem[] = [], 
  coupon: CouponData | null = null
) => {
  // Guard against null or undefined items
  if (!items || !Array.isArray(items)) {
    return { subtotal: 0, discount: 0, tax: 0, total: 0 };
  }
  
  const subtotal = items.reduce((sum, item) => {
    // Ensure item is an object and has valid price and quantity
    if (!item || typeof item !== 'object') return sum;
    
    const itemPrice = Number(item.price) || 0;
    const itemQuantity = Number(item.quantity) || 0;
    return sum + (itemPrice * itemQuantity);
  }, 0);

  // Calculate discount if coupon is applied
  const discount = coupon ? (() => {
    if (coupon.discount_type === 'percentage') {
      const discountAmount = (subtotal * coupon.discount_value) / 100;
      return coupon.max_discount_amount 
        ? Math.min(discountAmount, coupon.max_discount_amount)
        : discountAmount;
    } else {
      return Math.min(coupon.discount_value, subtotal); // Don't allow discount greater than subtotal
    }
  })() : 0;

  const discountedSubtotal = subtotal - discount;
  const tax = discountedSubtotal * 0.18; // 18% tax
  const total = discountedSubtotal + tax;

  return {
    subtotal,
    discount,
    tax,
    total
  };
};

export const generateOrderId = () => {
  // Create a format that looks like #5b9fd7 - alphanumeric 6 character code
  // We use only the last 6 characters for display throughout the application
  const randomPart = Math.random().toString(16).substring(2, 8);
  // Ensure it's exactly 6 characters
  const sixCharPart = randomPart.padEnd(6, '0').substring(0, 6);
  return `#${sixCharPart}`;
};

export const formatCurrency = (amount: number = 0) => {
  return `₹${amount.toFixed(2)}`;
};

/**
 * Updates an order's status in the database and optionally provides a callback for UI updates
 * @param orderId - The ID of the order to update
 * @param newStatus - The new status to set
 * @param onSuccess - Optional callback function to run after successful update
 * @returns Promise resolving to success status
 */
export const updateOrderStatus = async (
  orderId: string, 
  newStatus: string, 
  onSuccess?: (orderId: string, status: string, data?: unknown) => void
): Promise<boolean> => {
  try {
    // Prepare update data based on new status
    const updateData = {
      status: newStatus,
      ...(newStatus === 'preparing' ? {
        estimated_completion_time: new Date(Date.now() + 20 * 60000).toISOString()
      } : {})
    };

    // Update the order in the database
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    
    // Show success toast
    toast.success(`Order status updated to ${newStatus}`, {
      icon: '✅',
    });
    
    // Call success callback if provided
    if (onSuccess) {
      onSuccess(orderId, newStatus, data);
    }
    
    return true;
  } catch (error: unknown) {
    console.error('Error updating order status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order status';
    toast.error(errorMessage);
    return false;
  }
};

/**
 * Get the CSS color class for different order statuses
 * @param status - The order status
 * @returns CSS class string for the status
 */
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'preparing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ready':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'delivered':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getOrderActions = (status: string) => {
  switch (status) {
    case 'pending':
      return [
        { action: 'preparing', label: 'Start Preparing', color: 'bg-blue-500 hover:bg-blue-600' },
        { action: 'cancelled', label: 'Cancel Order', color: 'bg-red-500 hover:bg-red-600' }
      ];
    case 'preparing':
      return [
        { action: 'ready', label: 'Mark as Ready', color: 'bg-green-500 hover:bg-green-600' }
      ];
    case 'ready':
      return [
        { action: 'delivered', label: 'Mark as Delivered', color: 'bg-orange-500 hover:bg-orange-600' }
      ];
    default:
      return [];
  }
};