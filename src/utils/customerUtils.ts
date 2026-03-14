import { supabase } from '../lib/supabase';

export interface CustomerData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  user_id?: string; // For registered users
  customer_source?: string; // counter, website, app
}

export interface CustomerStats {
  total_orders: number;
  total_spent: number;
  last_visit: string;
}

/**
 * Create or update customer record in customers table
 * This function is used for both counter orders and registered users
 */
export const upsertCustomer = async (customerData: CustomerData): Promise<string | null> => {
  try {
    const { name, phone, email, address, user_id, customer_source } = customerData;

    // Generate referral code for new customers
    const generateReferralCode = () => {
      return `REF${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    };

    // Determine customer source if not provided
    const source = customer_source || (user_id ? 'website' : 'counter');

    // First, try to find existing customer by user_id (if provided)
    let existingCustomer = null;
    
    if (user_id) {
      const { data: userCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user_id)
        .single();
      existingCustomer = userCustomer;
    }
    
    // If not found by user_id, try by phone
    if (!existingCustomer && phone) {
      const { data: phoneCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();
      existingCustomer = phoneCustomer;
    }
    
    // If not found by phone, try by email (only if email is provided)
    if (!existingCustomer && email) {
      const { data: emailCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single();
      existingCustomer = emailCustomer;
    }

    if (existingCustomer) {
      // Update existing customer
      const updateData: Record<string, unknown> = {
        name: name || existingCustomer.name,
        phone: phone || existingCustomer.phone,
        address: address || existingCustomer.address,
        last_visit: new Date().toISOString(),
        customer_source: existingCustomer.customer_source || source,
        updated_at: new Date().toISOString(),
      };

      // Only update email if provided and different
      if (email && email !== existingCustomer.email) {
        updateData.email = email;
      }

      // Only update user_id if provided and different
      if (user_id && user_id !== existingCustomer.user_id) {
        updateData.user_id = user_id;
        updateData.last_login_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', existingCustomer.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
        throw error;
      }
      return data.id;
    } else {
      // Create new customer
      const now = new Date().toISOString();
      
      // Generate unique referral code
      let referralCode = generateReferralCode();
      let attempts = 0;
      const maxAttempts = 5;
      
      // Ensure referral code is unique
      while (attempts < maxAttempts) {
        const { data: existingCode } = await supabase
          .from('customers')
          .select('id')
          .eq('referral_code', referralCode)
          .single();
        
        if (!existingCode) break;
        referralCode = generateReferralCode();
        attempts++;
      }

      // Create base customer data with required fields only
      const newCustomerData: Record<string, unknown> = {
        name,
        phone: phone || null,
        address: address || null,
        user_id: user_id || null,
        customer_source: source,
        referral_code: referralCode,
        last_visit: now,
        status: 'active',
        created_at: now,
        updated_at: now,
        total_orders: 0,
        total_spent: 0,
        order_count: 0,
        average_order_value: 0,
        loyalty_points: 0,
        loyalty_tier: 'bronze',
        visit_frequency: 'new',
        spice_preference: 'medium',
        language_preference: 'en',
      };

      // Only add email if provided (to avoid unique constraint issues)
      if (email) {
        newCustomerData.email = email;
      }

      // Set dates based on customer type
      if (user_id) {
        newCustomerData.last_login_date = now;
      }

      try {
        const { data, error } = await supabase
          .from('customers')
          .insert(newCustomerData)
          .select()
          .single();

        if (error) {
          console.error('Error creating customer:', error);
          throw error;
        }
        return data.id;
      } catch (insertError) {
        console.error('Customer creation failed:', insertError);
        
        // If it's a unique constraint violation, try to find the existing customer
        if ((insertError as { code?: string })?.code === '23505') {
          console.log('Unique constraint violation, attempting to find existing customer');
          
          // Try to find by user_id first
          if (user_id) {
            const { data: existingUser } = await supabase
              .from('customers')
              .select('id')
              .eq('user_id', user_id)
              .single();
            if (existingUser) return existingUser.id;
          }
          
          // Try to find by email
          if (email) {
            const { data: existingEmail } = await supabase
              .from('customers')
              .select('id')
              .eq('email', email)
              .single();
            if (existingEmail) return existingEmail.id;
          }
        }
        
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Error upserting customer:', error);
    return null;
  }
};

/**
 * Update customer statistics after order completion
 */
export const updateCustomerStats = async (
  customerId: string, 
  orderAmount: number, 
  increment: number = 1
): Promise<void> => {
  try {
    // Get current customer data
    const { data: currentCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('total_orders, total_spent, first_order_date, last_order_date, order_count')
      .eq('id', customerId)
      .single();

    if (fetchError) throw fetchError;

    const now = new Date().toISOString();
    const newTotalOrders = (currentCustomer.total_orders || 0) + increment;
    const newTotalSpent = (currentCustomer.total_spent || 0) + orderAmount;
    const newOrderCount = (currentCustomer.order_count || 0) + increment;
    const newAverageOrderValue = newTotalSpent / newOrderCount;
    
    // Calculate average order frequency (days between orders)
    let avgOrderFrequencyDays = 0;
    if (currentCustomer.last_order_date && currentCustomer.first_order_date) {
      const daysBetween = Math.ceil(
        (new Date(now).getTime() - new Date(currentCustomer.first_order_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      avgOrderFrequencyDays = Math.ceil(daysBetween / newOrderCount);
    }

    // Determine visit frequency category
    let visitFrequency = 'occasional';
    if (avgOrderFrequencyDays <= 3) visitFrequency = 'daily';
    else if (avgOrderFrequencyDays <= 10) visitFrequency = 'weekly';
    else if (avgOrderFrequencyDays <= 40) visitFrequency = 'monthly';

    // Calculate loyalty points (1 point per dollar spent)
    const loyaltyPoints = Math.floor(newTotalSpent);
    
    // Determine loyalty tier
    let loyaltyTier = 'bronze';
    if (loyaltyPoints >= 1000) loyaltyTier = 'platinum';
    else if (loyaltyPoints >= 500) loyaltyTier = 'gold';
    else if (loyaltyPoints >= 200) loyaltyTier = 'silver';

    // Update customer statistics
    const { error: statsUpdateError } = await supabase
      .from('customers')
      .update({
        total_orders: newTotalOrders,
        total_spent: newTotalSpent,
        order_count: newOrderCount,
        average_order_value: newAverageOrderValue,
        last_visit: now,
        last_order_date: now,
        first_order_date: currentCustomer.first_order_date || now,
        loyalty_points: loyaltyPoints,
        loyalty_tier: loyaltyTier,
        visit_frequency: visitFrequency,
        avg_order_frequency_days: avgOrderFrequencyDays
      })
      .eq('id', customerId);

    if (statsUpdateError) throw statsUpdateError;
  } catch (error) {
    console.error('Error updating customer stats:', error);
  }
};

/**
 * Get customer by phone number for lookup
 */
export const getCustomerByPhone = async (phone: string) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching customer by phone:', error);
    return null;
  }
};

/**
 * Get customer by email for lookup
 */
export const getCustomerByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching customer by email:', error);
    return null;
  }
};

export interface OrderItemData {
  name: string;
  quantity: number;
  price: number;
}

export interface UserData {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    phone?: string;
  };
}

/**
 * Track customer food preferences based on order history
 */
export const trackCustomerPreferences = async (customerId: string, orderItems: OrderItemData[]): Promise<void> => {
  try {
    // Get customer's order history to analyze preferences
    const { data: orderHistory, error: historyError } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        payment_method,
        order_items (
          name,
          quantity,
          price
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(50); // Last 50 orders for analysis

    if (historyError) throw historyError;

    // Analyze favorite items (most frequently ordered)
    const itemFrequency: { [key: string]: number } = {};
    const cuisineFrequency: { [key: string]: number } = {};
    const paymentMethodFrequency: { [key: string]: number } = {};
    const orderTimes: Date[] = [];
    
    // Add current order items to analysis
    const allItems = [...orderItems];
    
    // Add historical order items
    if (orderHistory) {
      orderHistory.forEach(order => {
        orderTimes.push(new Date(order.created_at));
        
        // Track payment methods
        if (order.payment_method) {
          paymentMethodFrequency[order.payment_method] = (paymentMethodFrequency[order.payment_method] || 0) + 1;
        }
        
        if (order.order_items) {
          order.order_items.forEach(item => {
            allItems.push({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            });
          });
        }
      });
    }

    // Analyze items and cuisines
    allItems.forEach(item => {
      itemFrequency[item.name] = (itemFrequency[item.name] || 0) + item.quantity;
      
      // Simple cuisine detection based on item names
      const itemName = item.name.toLowerCase();
      if (itemName.includes('pizza') || itemName.includes('pasta') || itemName.includes('lasagna')) {
        cuisineFrequency['Italian'] = (cuisineFrequency['Italian'] || 0) + 1;
      } else if (itemName.includes('curry') || itemName.includes('biryani') || itemName.includes('naan')) {
        cuisineFrequency['Indian'] = (cuisineFrequency['Indian'] || 0) + 1;
      } else if (itemName.includes('burger') || itemName.includes('fries') || itemName.includes('sandwich')) {
        cuisineFrequency['American'] = (cuisineFrequency['American'] || 0) + 1;
      } else if (itemName.includes('sushi') || itemName.includes('ramen') || itemName.includes('teriyaki')) {
        cuisineFrequency['Japanese'] = (cuisineFrequency['Japanese'] || 0) + 1;
      } else if (itemName.includes('taco') || itemName.includes('burrito') || itemName.includes('quesadilla')) {
        cuisineFrequency['Mexican'] = (cuisineFrequency['Mexican'] || 0) + 1;
      } else if (itemName.includes('pad thai') || itemName.includes('tom yum') || itemName.includes('thai')) {
        cuisineFrequency['Thai'] = (cuisineFrequency['Thai'] || 0) + 1;
      } else {
        cuisineFrequency['Other'] = (cuisineFrequency['Other'] || 0) + 1;
      }
      
      // Detect spice preference
      if (itemName.includes('spicy') || itemName.includes('hot') || itemName.includes('jalapeño')) {
        // Customer likes spicy food
      }
    });

    // Get top favorite items (top 5)
    const favoriteItems = Object.entries(itemFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    // Get favorite cuisines (top 3)
    const favoriteCuisines = Object.entries(cuisineFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cuisine]) => cuisine);

    // Detect spice preference from item names
    const spicyItemCount = allItems.filter(item => 
      item.name.toLowerCase().includes('spicy') || 
      item.name.toLowerCase().includes('hot') ||
      item.name.toLowerCase().includes('jalapeño') ||
      item.name.toLowerCase().includes('chili')
    ).length;
    
    let spicePreference = 'medium';
    if (spicyItemCount > allItems.length * 0.3) spicePreference = 'hot';
    else if (spicyItemCount < allItems.length * 0.1) spicePreference = 'mild';

    // Analyze preferred dining time from order timestamps
    const timeSlots = { breakfast: 0, lunch: 0, dinner: 0, latenight: 0 };
    orderTimes.forEach(time => {
      const hour = time.getHours();
      if (hour >= 6 && hour < 11) timeSlots.breakfast++;
      else if (hour >= 11 && hour < 16) timeSlots.lunch++;
      else if (hour >= 16 && hour < 22) timeSlots.dinner++;
      else timeSlots.latenight++;
    });
    
    const preferredDiningTime = Object.entries(timeSlots)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'dinner';

    // Get most used payment method
    const preferredPaymentMethod = Object.entries(paymentMethodFrequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'cash';

    // Detect dietary restrictions from order patterns
    const dietaryRestrictions: string[] = [];
    const vegetarianItems = allItems.filter(item => {
      const name = item.name.toLowerCase();
      return name.includes('vegetarian') || name.includes('vegan') || 
             (!name.includes('chicken') && !name.includes('beef') && 
              !name.includes('pork') && !name.includes('fish') && 
              !name.includes('meat'));
    });
    
    if (vegetarianItems.length > allItems.length * 0.8) {
      dietaryRestrictions.push('vegetarian');
    }
    
    if (allItems.some(item => item.name.toLowerCase().includes('vegan'))) {
      dietaryRestrictions.push('vegan');
    }
    
    if (allItems.some(item => item.name.toLowerCase().includes('gluten-free'))) {
      dietaryRestrictions.push('gluten-free');
    }

    // Update customer preferences
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        favorite_items: favoriteItems,
        favorite_cuisines: favoriteCuisines,
        spice_preference: spicePreference,
        preferred_dining_time: preferredDiningTime,
        preferred_payment_method: preferredPaymentMethod,
        dietary_restrictions: dietaryRestrictions
      })
      .eq('id', customerId);

    if (updateError) throw updateError;

    // Track activity for this order
    for (const item of orderItems) {
      const { error } = await supabase
        .from('customer_activities')
        .insert({
          customer_id: customerId,
          activity_type: 'food_preference',
          description: `Ordered: ${item.name} (${item.quantity}x)`,
          created_at: new Date().toISOString(),
        });

      if (error) console.error('Error tracking food preference:', error);
    }

    // Track visit activity
    const { error: visitError } = await supabase
      .from('customer_activities')
      .insert({
        customer_id: customerId,
        activity_type: 'visit',
        description: `Order placed - Total items: ${orderItems.length}`,
        created_at: new Date().toISOString(),
      });

    if (visitError) console.error('Error tracking visit:', visitError);
  } catch (error) {
    console.error('Error tracking customer preferences:', error);
  }
};

/**
 * Sync registered user with customer table
 * Call this when user signs up or logs in
 */
export const syncRegisteredUserWithCustomer = async (user: UserData, additionalData?: Partial<CustomerData>): Promise<string | null> => {
  if (!user) return null;

  const customerData: CustomerData = {
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    email: user.email,
    phone: user.user_metadata?.phone || additionalData?.phone || '',
    address: additionalData?.address || '',
    user_id: user.id,
    customer_source: 'website',
  };

  return await upsertCustomer(customerData);
};

/**
 * Backfill existing customer analytics data
 * Run this after migration to populate new fields for existing customers
 */
export const backfillCustomerAnalytics = async (): Promise<void> => {
  try {
    console.log('Starting customer analytics backfill...');
    
    // Get all customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .order('created_at', { ascending: true });

    if (customersError) throw customersError;

    if (!customers || customers.length === 0) {
      console.log('No customers found to backfill');
      return;
    }

    console.log(`Found ${customers.length} customers to analyze`);

    // Process each customer
    for (const customer of customers) {
      try {
        console.log(`Processing customer: ${customer.name} (${customer.id})`);
        
        // Get customer's order history
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            total_amount,
            payment_method,
            created_at,
            order_items (
              name,
              quantity,
              price
            )
          `)
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: true });

        if (ordersError) {
          console.error(`Error fetching orders for customer ${customer.id}:`, ordersError);
          continue;
        }

        if (!orders || orders.length === 0) {
          console.log(`No orders found for customer ${customer.name}`);
          continue;
        }

        // Calculate customer statistics
        const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalSpent / totalOrders;
        const firstOrderDate = orders[0].created_at;
        const lastOrderDate = orders[orders.length - 1].created_at;
        
        // Calculate loyalty points and tier
        const loyaltyPoints = Math.floor(totalSpent);
        let loyaltyTier = 'bronze';
        if (loyaltyPoints >= 1000) loyaltyTier = 'platinum';
        else if (loyaltyPoints >= 500) loyaltyTier = 'gold';
        else if (loyaltyPoints >= 200) loyaltyTier = 'silver';

        // Calculate visit frequency
        const daysBetween = Math.ceil(
          (new Date(lastOrderDate).getTime() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        const avgOrderFrequencyDays = daysBetween > 0 ? Math.ceil(daysBetween / totalOrders) : 0;
        
        let visitFrequency = 'occasional';
        if (avgOrderFrequencyDays <= 3) visitFrequency = 'daily';
        else if (avgOrderFrequencyDays <= 10) visitFrequency = 'weekly';
        else if (avgOrderFrequencyDays <= 40) visitFrequency = 'monthly';

        // Analyze all order items for preferences
        const allItems: OrderItemData[] = [];
        orders.forEach(order => {
          if (order.order_items) {
            order.order_items.forEach(item => {
              allItems.push({
                name: item.name,
                quantity: item.quantity,
                price: item.price
              });
            });
          }
        });

        // Update customer with calculated data
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            total_orders: totalOrders,
            total_spent: totalSpent,
            order_count: totalOrders,
            average_order_value: averageOrderValue,
            first_order_date: firstOrderDate,
            last_order_date: lastOrderDate,
            loyalty_points: loyaltyPoints,
            loyalty_tier: loyaltyTier,
            visit_frequency: visitFrequency,
            avg_order_frequency_days: avgOrderFrequencyDays,
            customer_source: 'counter' // Default for existing customers
          })
          .eq('id', customer.id);

        if (updateError) {
          console.error(`Error updating customer ${customer.id}:`, updateError);
          continue;
        }

        // Track preferences for this customer
        if (allItems.length > 0) {
          await trackCustomerPreferences(customer.id, allItems);
        }

        console.log(`✅ Completed analysis for ${customer.name}`);
        
        // Add small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (customerError) {
        console.error(`Error processing customer ${customer.id}:`, customerError);
        continue;
      }
    }

    console.log('✅ Customer analytics backfill completed!');
    
  } catch (error) {
    console.error('Error during customer analytics backfill:', error);
  }
};

/**
 * Helper function to run the backfill - call this once after migration
 */
export const runCustomerDataBackfill = async (): Promise<void> => {
  console.log('🚀 Starting customer data backfill process...');
  console.log('This will analyze existing orders and populate customer preference data.');
  
  await backfillCustomerAnalytics();
  
  console.log('🎉 Backfill process completed!');
};
