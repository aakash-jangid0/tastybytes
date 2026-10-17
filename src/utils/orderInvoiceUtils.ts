import { OrderItem } from '../types/orders';
import { Invoice } from '../types/invoice';
import { generateInvoice, saveInvoiceToDatabase } from './invoiceGenerator';
import { printInvoice } from './invoiceUtils';
import { toast } from 'react-hot-toast';

/**
 * Utility function to handle the consistent creation, saving, and printing of invoices.
 * This ensures that the same invoices are used everywhere in the application and saved to the database.
 */
export const generateAndProcessInvoice = async (
  order: any,
  items: OrderItem[],
  subtotal: number,
  tax: number,
  total: number,
  customerName: string,
  customerPhone?: string,
  tableNumber?: string,
  paymentMethod?: string,
  notifyOnError = true
) => {
  try {
    // Create invoice data using consistent format
    const invoiceData = {
      invoiceNumber: order.id.slice(-6).toUpperCase(),
      order_id: order.id,
      display_order_id: `#${order.id.slice(-6)}`,
      customerName: customerName || 'Guest',
      customerPhone,
      tableNumber,
      items: items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        tax_rate: 0.18,
        tax_amount: item.price * item.quantity * 0.18,
        total: item.price * item.quantity * 1.18 // Include tax in total
      })),
      subtotal,      tax_amount: tax,
      total,
      paymentMethod: paymentMethod || 'cash',
      date: new Date(),
      coupon_code: order.coupon_code,
      coupon_discount_type: order.coupon_discount_type,
      coupon_discount_value: order.coupon_discount_value,
      coupon_discount_amount: order.coupon_discount_amount
    };

    // First, save the invoice to the database
    const invoiceId = await saveInvoiceToDatabase(invoiceData);
    
    if (!invoiceId) {
      console.warn('Failed to save invoice to database, but continuing with generation');
    } else {
      console.log('Invoice saved to database with ID:', invoiceId);
    }
    
    return {
      invoiceId,
      invoiceData,
      // Return helper functions that maintain closure over the invoiceData
      print: () => printInvoice(invoiceData),
      getInvoicePDF: () => generateInvoice(invoiceData)
    };
  } catch (err: any) {
    console.error('Error processing invoice:', err);
    if (notifyOnError) {
      toast.error(`Failed to process invoice: ${err.message || 'Unknown error'}`);
    }
    return null;
  }
};

/**
 * Utility function to create a standardized invoice number from an order ID
 */
export const createInvoiceNumber = (orderId: string) => {
  return orderId.slice(-6).toUpperCase();
};

/**
 * Convert a database Invoice to the format expected by invoiceGenerator
 */
export const convertDatabaseInvoiceToGeneratorFormat = (invoice: any) => {
  return {
    invoiceNumber: invoice.invoice_number,
    order_id: invoice.order_id,
    display_order_id: invoice.display_order_id,
    customerName: invoice.customer_name,
    customerPhone: invoice.customer_phone,
    customerEmail: invoice.customer_email,
    tableNumber: '', // Table number might not be stored in invoice
    items: invoice.items.map((item: any) => ({
      name: item.item_name,
      price: item.unit_price,
      quantity: item.quantity,
      tax_rate: item.tax_rate,
      tax_amount: item.tax_amount,
      total: item.total_amount
    })),
    subtotal: invoice.subtotal,
    tax_amount: invoice.tax_amount,
    total: invoice.total_amount,
    paymentMethod: invoice.payment_method || 'Cash',
    date: new Date(invoice.invoice_date),
    coupon_code: invoice.coupon_code,
    coupon_discount_type: invoice.coupon_discount_type,
    coupon_discount_value: invoice.coupon_discount_value,
    coupon_discount_amount: invoice.coupon_discount_amount
  };
};
