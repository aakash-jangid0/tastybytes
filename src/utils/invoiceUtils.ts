import { Invoice, InvoiceItem } from '../types/invoice';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';
import { 
  saveInvoiceToDatabase as saveToDb, 
  generateInvoice as generateInvoiceDoc
} from './invoiceGenerator';
import { convertDatabaseInvoiceToGeneratorFormat } from './orderInvoiceUtils';
// @ts-ignore
import 'jspdf-autotable';

// Add autoTable to jsPDF prototype
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export const formatCurrency = (amount: number) => {
  return 'Rs. ' + amount.toFixed(2);
};

export const generatePDF = (invoice: Invoice) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Add restaurant logo and details
  doc.setFontSize(20);
  doc.text('Tastybites', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text('Malad west Mumbai Maharashtra', pageWidth / 2, 30, { align: 'center' });
  doc.text('Email: tastybites@example.com', pageWidth / 2, 35, { align: 'center' });

  // Add invoice details
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 15, 45);
  doc.text(`Date: ${format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}`, 15, 52);
  doc.text(`Order: ${invoice.display_order_id}`, 15, 59);
  
  // Add payment method if available
  if (invoice.payment_method) {
    doc.text(`Payment: ${invoice.payment_method}`, pageWidth - 15, 45, { align: 'right' });
  }

  // Add customer details
  doc.text('Bill To:', 15, 70);
  doc.setFontSize(11);
  doc.text(invoice.customer_name, 15, 77);
  if (invoice.customer_phone) {
    doc.text(`Phone: ${invoice.customer_phone}`, 15, 84);
  }
  if (invoice.customer_email) {
    doc.text(`Email: ${invoice.customer_email}`, 15, 91);
  }
  if (invoice.billing_address) {
    doc.text(invoice.billing_address, 15, 98);
  }

  // Add items table with all required details
  const tableHeaders = [['Item', 'Qty', 'Unit Price', 'Tax Rate', 'Tax Amt', 'Total']];
  const tableData = invoice.items.map((item: InvoiceItem) => [
    item.item_name,
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    `${(item.tax_rate * 100).toFixed(1)}%`,
    formatCurrency(item.tax_amount),
    formatCurrency(item.total_amount)
  ]);

  doc.autoTable({
    head: tableHeaders,
    body: tableData,
    startY: 105,
    theme: 'grid',
    headStyles: { fillColor: [249, 115, 22] },
    styles: { fontSize: 10 }
  });

  // Add totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text('Subtotal:', 120, finalY);
  doc.text(formatCurrency(invoice.subtotal), 170, finalY, { align: 'right' });
  
  doc.text('Tax:', 120, finalY + 7);
  doc.text(formatCurrency(invoice.tax_amount), 170, finalY + 7, { align: 'right' });
  
  if (invoice.discount_amount > 0) {
    doc.text('Discount:', 120, finalY + 14);
    doc.text(formatCurrency(invoice.discount_amount), 170, finalY + 14, { align: 'right' });
    doc.text('Grand Total:', 120, finalY + 21);
    doc.setFontSize(12);
    doc.text(formatCurrency(invoice.total_amount), 170, finalY + 21, { align: 'right' });
  } else {
    doc.setFontSize(12);
    doc.text('Total:', 120, finalY + 14);
    doc.text(formatCurrency(invoice.total_amount), 170, finalY + 14, { align: 'right' });
  }

  // Add footer
  doc.setFontSize(10);
  const footerY = pageHeight - 25;
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  doc.setFontSize(8);
  doc.text('**SAVE PAPER SAVE NATURE !!**', pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text(`TIME: ${format(new Date(), 'HH:mm')} | INVOICE GENERATED ON ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth / 2, footerY + 10, { align: 'center' });

  return doc;
};

// We're now using the functions from invoiceGenerator.ts directly
// These functions are kept for compatibility with existing code
export const printInvoice = async (invoice: any) => {
  // Handle both Invoice and invoiceData formats
  let invoiceData;
  
  if (invoice.invoice_number) {
    // It's a database Invoice type
    invoiceData = convertDatabaseInvoiceToGeneratorFormat(invoice);
  } else {
    // It's already in the format expected by generateInvoiceDoc
    invoiceData = invoice;
  }
  
  const doc = generateInvoiceDoc(invoiceData);
  
  if (typeof window !== 'undefined') {
    const pdfDoc = await doc;
    pdfDoc.autoPrint();
    
    // Open the PDF in a new window
    const blobUrl = await pdfDoc.output('bloburl');
    const printWindow = window.open(blobUrl) as Window;
    
    if (!printWindow) {
      console.error('Browser blocked opening new window');
      return;
    }
  }
};

export const downloadInvoice = async (invoice: any) => {
  // Handle both Invoice and invoiceData formats
  let invoiceData;
  let fileName;
  
  if (invoice.invoice_number) {
    // It's a database Invoice type
    invoiceData = convertDatabaseInvoiceToGeneratorFormat(invoice);
    fileName = `invoice-${invoice.invoice_number}.pdf`;
  } else {
    // It's already in the format expected by generateInvoiceDoc
    invoiceData = invoice;
    fileName = `invoice-${invoice.invoiceNumber}.pdf`;
  }
  
  const doc = generateInvoiceDoc(invoiceData);
  const pdfDoc = await doc;
  await pdfDoc.save(fileName);
};

export const emailInvoice = async (invoice: Invoice, email: string) => {
  const doc = generatePDF(invoice);
  const pdfBlob = await doc.output('blob');
  
  const formData = new FormData();
  formData.append('invoice', pdfBlob, `invoice-${invoice.invoice_number}.pdf`);
  formData.append('email', email);
  formData.append('invoice_number', invoice.invoice_number);

  // Send to edge function for email processing
  const response = await fetch('/api/send-invoice', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to send invoice');
  }

  return response.json();
};

// Function to fetch invoice from the database by order ID
export const fetchInvoiceByOrderId = async (orderId: string): Promise<Invoice | null> => {
  try {
    // First, fetch the invoice record
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    if (invoiceError || !invoiceData) {
      console.error('Error fetching invoice:', invoiceError);
      return null;
    }
    
    // Then fetch the invoice items
    const { data: itemsData, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceData.id);
      
    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError);
      return null;
    }
    
    // Combine the data
    const invoice: Invoice = {
      ...invoiceData,
      items: itemsData || []
    };
    
    return invoice;
  } catch (err) {
    console.error('Unexpected error fetching invoice:', err);
    return null;
  }
};

// Function to explicitly save an invoice to the database
export const saveInvoiceToDatabase = async (invoice: Invoice): Promise<string | null> => {
  try {
    // Convert to the format expected by saveInvoiceToDatabase
    const invoiceData = {
      id: invoice.id,
      order_id: invoice.order_id,
      display_order_id: invoice.display_order_id,
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customer_name,
      customerPhone: invoice.customer_phone,
      customerEmail: invoice.customer_email,
      tableNumber: '',
      items: invoice.items.map(item => ({
        id: item.id,
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
      date: new Date(invoice.invoice_date)
    };
    
    // Save to database using the generator's function
    return await saveToDb(invoiceData);
  } catch (error) {
    console.error('Error saving invoice to database:', error);
    return null;
  }
};

// Function to view or download an invoice
export const viewOrDownloadInvoice = async (orderId: string, order: any, download = false): Promise<void> => {
  // First try to get the invoice from the database
  const invoice = await fetchInvoiceByOrderId(orderId);
  
  if (invoice) {
    // Convert database invoice to the format expected by generateInvoiceDoc
    const invoiceData = convertDatabaseInvoiceToGeneratorFormat(invoice);
    
    // Use the same invoice generator as when creating bills
    const pdfDoc = await generateInvoiceDoc(invoiceData);
    
    if (download) {
      await pdfDoc.save(`invoice-${invoice.invoice_number}.pdf`);
    } else {
      const blobUrl = pdfDoc.output('bloburl');
      window.open(blobUrl, '_blank');
    }
  } else {
    // Generate a new invoice if not found in the database
    // Create InvoiceData in the format expected by invoiceGenerator
    const invoiceData = {
      invoiceNumber: orderId.slice(-6).toUpperCase(),
      order_id: orderId,
      display_order_id: `#${orderId.slice(-6)}`,
      customerName: order.customer_name || 'Guest',
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      tableNumber: order.table_number,
      items: order.order_items.map((item: any) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        tax_rate: 0.18,
        tax_amount: item.price * item.quantity * 0.18,
        total: item.price * item.quantity * 1.18
      })),
      subtotal: order.subtotal || (order.total_amount / 1.18),
      tax_amount: order.tax_amount || (order.total_amount * 0.18 / 1.18),
      total: order.total_amount,
      paymentMethod: order.payment_method || 'Cash',
      date: new Date(order.created_at)
    };
    
    try {
      // Save the generated invoice to the database to ensure it's stored for future use
      const savedInvoiceId = await saveToDb(invoiceData);
      console.log('Invoice saved to database with ID:', savedInvoiceId);
      
      // Generate the PDF using the same generator as when creating bills
      const pdfDoc = await generateInvoiceDoc(invoiceData);
      
      if (download) {
        await pdfDoc.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
      } else {
        const blobUrl = pdfDoc.output('bloburl');
        window.open(blobUrl, '_blank');
      }
    } catch (error) {
      console.error('Error processing invoice:', error);

      // Fall back to just generating the PDF without saving to database
      const pdfDoc = await generateInvoiceDoc(invoiceData);

      if (download) {
        await pdfDoc.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
      } else {
        const blobUrl = pdfDoc.output('bloburl');
        window.open(blobUrl, '_blank');
      }
    }
  }
};
