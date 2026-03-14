import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkOrders() {
  console.log('=== Checking Orders Table ===');
  
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, customer_id, user_id, customer_name, customer_email')
      .limit(5);
      
    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }
    
    console.log('Found', orders.length, 'orders');
    orders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`);
      console.log('  ID:', order.id?.substring(0, 8) + '...');
      console.log('  customer_id:', order.customer_id ? order.customer_id.substring(0, 8) + '...' : 'NULL');
      console.log('  user_id:', order.user_id ? order.user_id.substring(0, 8) + '...' : 'NULL');
      console.log('  customer_name:', order.customer_name);
      console.log('  customer_email:', order.customer_email);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOrders();
