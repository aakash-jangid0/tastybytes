import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useRealtimeSync } from './useRealtimeSync';
import { upsertCustomer } from '../utils/customerUtils';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string; // To get a standardized order number, use id.slice(-6)
  customer_name: string;
  table_number?: string;
  order_type: 'dine-in' | 'takeaway';
  payment_method: 'cash' | 'card' | 'upi' | 'razorpay' | 'pending';
  payment_status: 'pending' | 'completed' | 'failed';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  discount: number;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  order_items?: OrderItem[];
  [key: string]: unknown; // For any additional fields from the database
}

interface CreateOrderParams {
  items: OrderItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  totalAmount: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  tableNumber?: string;
  orderType: 'dine-in' | 'takeaway';
  paymentMethod: 'cash' | 'card' | 'upi' | 'razorpay' | 'pending';
  user_id?: string; // Added user_id property to fix type error
  coupon?: {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    discount_amount: number;
  } | null;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Setup real-time sync for orders
  useRealtimeSync<Order>({
    table: 'orders',
    onInsert: (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      toast.success('New order received!');
    },
    onUpdate: (updatedOrder) => {
      setOrders(prev => 
        prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
      if (updatedOrder.status === 'ready') {
        toast.success('Your order is ready!');
      }
    },
    onDelete: (deletedOrder) => {
      setOrders(prev => prev.filter(order => order.id !== deletedOrder.id));
    }
  });

  const fetchOrders = useCallback(async () => {
    try {
      if (!user) return;

      // First try to fetch orders using user_id if the column exists
      let orderData;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error) {
          orderData = data;
        }
      } catch {
        console.log('Falling back to customer_name field for orders');
      }

      // If user_id query failed, try using customer_name as a fallback
      if (!orderData) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('customer_name', user.user_metadata?.name || user.email)
          .order('created_at', { ascending: false });

        if (error) throw error;
        orderData = data;
      }

      setOrders(orderData || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async ({
    items,
    subtotal = 0,
    tax = 0,
    discount = 0,
    totalAmount,
    customerName,
    customerPhone,
    tableNumber,
    orderType,
    paymentMethod
  }: CreateOrderParams) => {
    try {
      if (!user) {
        throw new Error('User must be logged in to create an order');
      }

      // Get customer details from profiles table first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, phone')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile data:', profileError);
      }
      
      // Use profile data if available, fallback to provided data
      const customerNameFromProfile = profileData?.name || null;
      
      const customerEmailFromProfile = profileData?.email;
      const customerPhoneFromProfile = profileData?.phone;

      // Validate phone number format if provided
      const finalCustomerPhone = customerPhoneFromProfile || customerPhone;
      if (finalCustomerPhone && !/^[0-9]{10}$/.test(finalCustomerPhone)) {
        throw new Error('Invalid phone number format. Please enter 10 digits only.');
      }

      // First, ensure a customer record exists in the customers table
      // This is required for the foreign key constraint on orders.customer_id
      const customerData = {
        name: customerNameFromProfile || customerName || user?.user_metadata?.name || user?.email || 'Guest',
        email: customerEmailFromProfile || user?.email,
        phone: finalCustomerPhone,
        user_id: user.id,
        customer_source: 'website'
      };
      
      // Create or update customer record
      const customerId = await upsertCustomer(customerData);
      
      if (!customerId) {
        console.error('Customer creation failed with data:', customerData);
        throw new Error('Failed to create customer record. Please check your details and try again.');
      }

      console.log('Customer created/updated successfully with ID:', customerId);

      // Check if user_id column exists
      const orderData = {
        // Always include these fields
        customer_name: customerNameFromProfile || customerName || user?.user_metadata?.name || user?.email || 'Guest',
        subtotal,
        tax,
        discount,
        total_amount: totalAmount,
        status: 'pending',
        // For cash and pending payments, always set to 'pending'
        payment_status: (paymentMethod === 'cash' || paymentMethod === 'pending') ? 'pending' : 'completed',
        customer_phone: finalCustomerPhone,
        table_number: tableNumber,
        order_type: orderType,
        payment_method: paymentMethod === 'pending' ? 'cash' : paymentMethod // Default to cash for pending payments
      };

      // First, try creating the order with user_id and customer_id
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([{
            ...orderData,
            user_id: user.id,
            customer_id: customerId // Use the customer ID from the customers table
          }])
          .select()
          .single();

        if (!error) {
          // Successfully created order with user_id
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(
              items.map(item => ({
                order_id: data.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes
              }))
            );

          if (itemsError) throw itemsError;
          toast.success('Order placed successfully!');
          return data;
        }
      } catch {
        // If the user_id column doesn't exist, try without it
        console.log('Falling back to order creation without user_id');
      }

      // Fallback: Insert without user_id if the previous attempt failed
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          ...orderData,
          customer_id: customerId // Use the customer ID from the customers table
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          items.map(item => ({
            order_id: order.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes
          }))
        );

      if (itemsError) throw itemsError;

      // Remove this toast to avoid duplicate success messages
      // The success message will be shown in the payment completion handler
      return order;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating order';
      toast.error(errorMessage);
      throw error;
    }
  };

  return {
    orders,
    loading,
    createOrder,
    fetchOrders
  };
}