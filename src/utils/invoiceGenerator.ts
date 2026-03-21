import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { Invoice } from '../types/invoice';
import { supabase } from '../lib/supabase';
import { InvoiceSettings, defaultInvoiceSettings } from '../types/invoiceSettings';
import QRCode from 'qrcode';

// TypeScript interfaces for jsPDF extensions
interface QRCodeInfo {
  content: string;
  x: number;
  y: number;
  size: number;
}

interface GState {
  opacity: number;
}

// Type for jsPDF with possible GState extension
type JsPDFWithGState = jsPDF & {
  setGState?: (state: GState) => void;
  GState?: new (state: { opacity: number }) => GState;
};

// Using declaration merging to extend jsPDF
declare module 'jspdf' {
  interface jsPDF {
    qrCodeInfo?: QRCodeInfo;
  }
}

// Keep the original interfaces for backward compatibility
interface InvoiceItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

interface InvoiceData {
  id?: string;
  order_id?: string;
  display_order_id?: string; // Human-readable order ID
  invoiceNumber: string; // This should match the order display ID format
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  tableNumber?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_amount: number;
  total: number;
  paymentMethod: string;
  date: Date;
  coupon_code?: string;
  coupon_discount_type?: 'percentage' | 'fixed_amount';
  coupon_discount_value?: number;
  coupon_discount_amount?: number;
}

// Helper function to convert InvoiceData to Invoice format
const convertToInvoiceFormat = (data: InvoiceData): Invoice => {
  return {
    id: data.id || '',
    order_id: data.order_id || '',
    display_order_id: data.display_order_id || data.order_id || '#' + data.invoiceNumber,
    invoice_number: data.invoiceNumber,
    customer_name: data.customerName,
    customer_phone: data.customerPhone,
    customer_email: data.customerEmail,
    billing_address: '',
    invoice_date: data.date.toISOString(),
    subtotal: data.subtotal,
    tax_amount: data.tax_amount,
    discount_amount: 0,
    total_amount: data.total,
    status: 'issued',
    payment_method: data.paymentMethod,
    notes: '',
    terms_and_conditions: '',
    is_printed: false,
    print_count: 0,
    created_at: data.date.toISOString(),
    updated_at: data.date.toISOString(),
    items: data.items.map(item => ({
      id: item.id || '',
      invoice_id: data.id || '',
      item_name: item.name,
      description: '',
      quantity: item.quantity,
      unit_price: item.price,
      tax_rate: item.tax_rate,
      tax_amount: item.tax_amount,
      discount_amount: 0,
      total_amount: item.total,
      created_at: data.date.toISOString()
    }))
  };
};

// Generate and save an invoice to the database
export const saveInvoiceToDatabase = async (data: InvoiceData): Promise<string | null> => {
  try {
    // Convert to standard invoice format
    const invoice = convertToInvoiceFormat(data);
    
    // Generate a random uuid for the invoice if not provided
    const invoiceId = invoice.id || crypto.randomUUID();
    invoice.id = invoiceId;
    
    // If order_id is provided, transform it to use only the last 6 characters for display
    if (invoice.order_id) {
      invoice.display_order_id = invoice.display_order_id || '#' + invoice.order_id.slice(-6);
    }
    
    // Insert the invoice into the database
    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        id: invoiceId,
        order_id: invoice.order_id,
        invoice_number: invoice.invoice_number,
        display_order_id: invoice.display_order_id,
        customer_name: invoice.customer_name,
        customer_phone: invoice.customer_phone, 
        customer_email: invoice.customer_email,
        billing_address: invoice.billing_address,
        invoice_date: invoice.invoice_date,
        subtotal: invoice.subtotal,
        tax_amount: invoice.tax_amount,
        discount_amount: invoice.discount_amount,
        total_amount: invoice.total_amount,
        status: invoice.status,
        payment_method: invoice.payment_method,
        notes: invoice.notes,
        terms_and_conditions: invoice.terms_and_conditions,
        is_printed: invoice.is_printed,
        print_count: invoice.print_count
      })
      .select()
      .single();
      
    if (invoiceError) {
      console.error('Error saving invoice:', invoiceError);
      return null;
    }
    
    // Insert invoice items
    if (invoice.items && invoice.items.length > 0) {
      const itemsToInsert = invoice.items.map(item => ({
        invoice_id: invoiceId,
        item_name: item.item_name,
        description: item.description || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        discount_amount: item.discount_amount || 0,
        total_amount: item.total_amount
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);
        
      if (itemsError) {
        console.error('Error saving invoice items:', itemsError);
        // Consider rollback or cleanup of the invoice if items fail
      }
    }
    
    return invoiceId;
  } catch (error) {
    console.error('Unexpected error saving invoice:', error);
    return null;
  }
};

export const generateInvoice = async (data: InvoiceData, templateSettings?: InvoiceSettings): Promise<jsPDF> => {
  // Use provided settings or fetch default settings
  const settings = templateSettings || defaultInvoiceSettings as InvoiceSettings;
  
  // Ensure invoice number uses only last 6 digits of order ID
  if (data.order_id) {
    data.display_order_id = '#' + data.order_id.slice(-6);
    data.invoiceNumber = data.order_id.slice(-6).toUpperCase();
  }
  
  // If invoiceNumber is not set but we have an order_id, use last 6 digits
  if (!data.invoiceNumber && data.order_id) {
    data.invoiceNumber = data.order_id.slice(-6).toUpperCase();
  }

  // Apply invoice prefix/suffix if defined in settings
  if (settings.invoice_prefix && !data.invoiceNumber.startsWith(settings.invoice_prefix)) {
    data.invoiceNumber = settings.invoice_prefix + data.invoiceNumber;
  }
  if (settings.invoice_suffix && !data.invoiceNumber.endsWith(settings.invoice_suffix)) {
    data.invoiceNumber = data.invoiceNumber + settings.invoice_suffix;
  }

  // Create PDF document with custom format based on settings
  const orientation = settings.page_orientation || 'portrait';
  const format = settings.page_size || (settings.receipt_width < 105 ? [settings.receipt_width, 297] : 'a5');
  
  const doc = new jsPDF({
    orientation: orientation as 'portrait' | 'landscape',
    unit: 'mm',
    format: format
  });

  // Choose template based on settings
  let templateDoc;
  switch(settings.template_name) {
    case 'modern':
      templateDoc = generateModernTemplate(doc, data, settings);
      break;
    case 'premium':
      templateDoc = generatePremiumTemplate(doc, data, settings);
      break;
    case 'default':
    default:
      templateDoc = generateClassicTemplate(doc, data, settings);
  }
  
  // Process QR codes if needed
  if (templateDoc.qrCodeInfo) {
    const qrInfo = templateDoc.qrCodeInfo;
    try {
      const qrCodeDataURL = await generateQRCode(qrInfo.content);
      templateDoc.addImage(qrCodeDataURL, 'PNG', qrInfo.x, qrInfo.y, qrInfo.size, qrInfo.size);
      delete templateDoc.qrCodeInfo; // Clean up after processing
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  return templateDoc;
};

// Classic template (original design with customization)
const generateClassicTemplate = (doc: jsPDF, data: InvoiceData, settings: InvoiceSettings): jsPDF => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 10;

  // Logo or placeholder
  if (settings.company_logo_url) {
    try {
      // Try to add image logo if URL is provided
      // Determine image format from URL or default to JPEG
      let format = 'JPEG';
      const url = settings.company_logo_url?.toLowerCase();
      if (url?.includes('.png')) format = 'PNG';
      else if (url?.includes('.gif')) format = 'GIF';
      else if (url?.includes('.webp')) format = 'WEBP';
      
      doc.addImage(settings.company_logo_url, format, pageWidth / 2 - 15, cursorY, 30, 10, undefined, 'FAST');
      cursorY += 15;
    } catch (error) {
      console.error('Error loading logo:', error);
      // Fallback to circle if image loading fails
      doc.setDrawColor(0, 0, 0);
      doc.setFillColor(0, 0, 0);
      doc.circle(pageWidth / 2, cursorY + 5, 6, 'F');
      cursorY += 15;
    }
  } else {
    // Default circle placeholder
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(0, 0, 0);
    doc.circle(pageWidth / 2, cursorY + 5, 6, 'F');
    cursorY += 15;
  }

  // Restaurant Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  // Use the company name from settings
  doc.text(settings.company_name, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 6;

  // Address
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.company_address, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4;
  
  // Only show contact info if enabled
  if (settings.show_restaurant_contact) {
    if (settings.company_phone) {
      doc.text(`Phone: ${settings.company_phone}`, pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 4;
    }
    doc.text(`Email: ${settings.company_email}`, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 4;
  }

  // Receipt Title
  doc.setFont('helvetica', 'bold');
  doc.text(settings.receipt_title, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 2;
  doc.setLineWidth(0.1);
  doc.line(10, cursorY, pageWidth - 10, cursorY);
  cursorY += 6;

  // Custom header text if provided
  if (settings.header_text) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(settings.header_text, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 6;
  }

  // Invoice details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Name: ' + data.customerName, 12, cursorY);
  doc.text('Invoice No: ' + data.invoiceNumber, pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 5;
  // Add date on right side using the format from settings
  doc.text('Date: ' + format(data.date, settings.date_format), pageWidth - 12, cursorY, { align: 'right' });
  
  // Add table number or order ID details on left side with proper spacing
  if (data.tableNumber) {
    doc.text('Table: #' + data.tableNumber, 12, cursorY);
    cursorY += 5;
  }
  if (data.display_order_id) {
    doc.text('Order: ' + data.display_order_id, 12, cursorY);
    cursorY += 5;
  } else if (data.order_id) {
    doc.text('Order: #' + data.order_id.slice(-6), 12, cursorY);
    cursorY += 5;
  }
  
  // Add customer phone and email if available
  if (data.customerPhone) {
    doc.text('Phone: ' + data.customerPhone, 12, cursorY);
    cursorY += 5;
  }
  if (data.customerEmail) {
    doc.text('Email: ' + data.customerEmail, 12, cursorY);
    cursorY += 5;
  }

  doc.setLineWidth(0.1);
  doc.line(10, cursorY, pageWidth - 10, cursorY);
  cursorY += 5;

  // Table header with custom colors
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(hexToRgb(settings.accent_color).r, hexToRgb(settings.accent_color).g, hexToRgb(settings.accent_color).b);
  doc.text('Item', 12, cursorY);
  doc.text('Price (Rs)', pageWidth / 2 - 15, cursorY, { align: 'right' });
  doc.text('Qty', pageWidth / 2 + 5, cursorY, { align: 'center' });
  doc.text('Total (Rs)', pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 5;
  doc.setTextColor(0, 0, 0); // Reset text color
  doc.setFont('helvetica', 'normal');

  // Items
  data.items.forEach(item => {
    // Handle long item names by truncating or wrapping
    const maxNameLength = 18; // Adjust based on your layout
    let displayName = item.name;
    if (item.name.length > maxNameLength) {
      displayName = item.name.substring(0, maxNameLength) + '...';
    }
    
    doc.text(displayName, 12, cursorY);
    doc.text('Rs' + item.price.toFixed(2), pageWidth / 2 - 15, cursorY, { align: 'right' });
    doc.text(item.quantity.toString(), pageWidth / 2 + 5, cursorY, { align: 'center' });
    doc.text('Rs' + item.total.toFixed(2), pageWidth - 12, cursorY, { align: 'right' });
    cursorY += 5;
  });

  cursorY += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Sub-Total:', pageWidth - 44, cursorY);
  doc.text('Rs' + data.subtotal.toFixed(2), pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 5;

  // Add coupon discount if present
  if (data.coupon_code) {
    doc.text('Coupon (' + data.coupon_code + '):', pageWidth - 60, cursorY);
    
    // Calculate the actual discount amount if it's not already provided
    let discountAmount = data.coupon_discount_amount;
    
    if (!discountAmount || discountAmount <= 0) {
      // Log warning for debugging
      console.warn('Coupon discount amount is missing or zero for coupon:', data.coupon_code);
      
      // Calculate based on coupon type
      if (data.coupon_discount_type === 'percentage' && data.coupon_discount_value) {
        // Calculate the discount amount based on the percentage
        discountAmount = (data.subtotal * data.coupon_discount_value) / 100;
      } else if (data.coupon_discount_type === 'fixed_amount' && data.coupon_discount_value) {
        // Use the fixed amount directly
        discountAmount = data.coupon_discount_value;
      } else {
        console.warn('Could not calculate discount: missing discount type or value', {
          type: data.coupon_discount_type,
          value: data.coupon_discount_value
        });
        discountAmount = 0;
      }
    }
    
    // Format the display text based on discount type
    const discountText = data.coupon_discount_type === 'percentage'
      ? '-' + data.coupon_discount_value + '% (Rs' + (discountAmount?.toFixed(2) || '0.00') + ')'
      : 'Rs' + (discountAmount?.toFixed(2) || '0.00');
    
    doc.text(discountText, pageWidth - 12, cursorY, { align: 'right' });
    cursorY += 5;
  }

  // Tax section using settings
  if (settings.include_tax_breakdown) {
    // Calculate half of tax for each component if using split taxes
    const halfTaxAmount = data.tax_amount / 2;

    doc.text(`${settings.tax_label_1}: ${settings.tax_rate_1}%`, pageWidth - 42, cursorY);
    doc.text('Rs ' + halfTaxAmount.toFixed(2), pageWidth - 12, cursorY, { align: 'right' });
    cursorY += 5;

    doc.text(`${settings.tax_label_2}: ${settings.tax_rate_2}%`, pageWidth - 42, cursorY);
    doc.text('Rs ' + halfTaxAmount.toFixed(2), pageWidth - 12, cursorY, { align: 'right' });
    cursorY += 6;
  }

  doc.text('Total Tax:', pageWidth - 42, cursorY);
  doc.text('Rs ' + data.tax_amount.toFixed(2), pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 5;

  doc.line(10, cursorY, pageWidth - 10, cursorY);
  cursorY += 5;

  // Payment method
  doc.setFont('helvetica', 'bold');
  doc.text('Mode:', 12, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.paymentMethod, 28, cursorY);
  cursorY += 5;
  
  // Final total
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', pageWidth - 40, cursorY);
  doc.text('Rs. ' + data.total.toFixed(2), pageWidth - 12, cursorY, { align: 'right' });
  cursorY += 5;

  doc.line(10, cursorY + 2, pageWidth - 10, cursorY + 2);
  cursorY += 8;

  // Terms & Conditions if provided
  if (settings.terms_conditions) {
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(settings.terms_conditions, pageWidth / 2, cursorY, { align: 'center', maxWidth: pageWidth - 20 });
    
    // Calculate height based on text length
    const textLines = doc.splitTextToSize(settings.terms_conditions, pageWidth - 20);
    cursorY += textLines.length * 3;
  }

  // Add QR code if enabled
  if (settings.include_qr_code && settings.qr_code_content) {
    // Store QR code info for later generation
    doc.qrCodeInfo = {
      content: settings.qr_code_content,
      x: pageWidth / 2 - 15, 
      y: cursorY, 
      size: 30
    };
    
    // Leave space for QR code
    cursorY += 35;
  }

  // Custom footer text if provided
  if (settings.footer_text) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(settings.footer_text, pageWidth / 2, cursorY, { align: 'center', maxWidth: pageWidth - 20 });
    cursorY += 8;
  }
  
  // Default footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('**SAVE PAPER SAVE NATURE !!**', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('YOU CAN NOW CALL US ON 1800 226344 (TOLL-FREE) FOR QUERIES/COMPLAINTS.', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 4;
  doc.text('Time: ' + format(data.date, 'HH:mm'), pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 2;

  return doc;
};

// Modern template - Clean, minimalist design
const generateModernTemplate = (doc: jsPDF, data: InvoiceData, settings: InvoiceSettings): jsPDF => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let cursorY = 15;
  
  // Header with primary color background
  doc.setFillColor(hexToRgb(settings.primary_color).r, hexToRgb(settings.primary_color).g, hexToRgb(settings.primary_color).b);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  // Company name in white
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.company_name, 10, cursorY);
  
  // Invoice title on the right in white
  doc.setFontSize(12);
  doc.text('INVOICE', pageWidth - 10, cursorY, { align: 'right' });
  cursorY += 8;
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  cursorY = 35;
  
  // Invoice details in a modern layout
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 10, cursorY);
  
  // Invoice number and date on the right
  doc.text('INVOICE #:', pageWidth - 65, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.invoiceNumber, pageWidth - 10, cursorY, { align: 'right' });
  cursorY += 5;
  
  // Customer details
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerName, 10, cursorY);
  cursorY += 5;
  
  // Date on the right
  doc.setFont('helvetica', 'bold');
  doc.text('DATE:', pageWidth - 65, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.text(format(data.date, settings.date_format), pageWidth - 10, cursorY, { align: 'right' });
  cursorY += 5;
  
  if (data.customerPhone) {
    doc.text(data.customerPhone, 10, cursorY);
    cursorY += 5;
  }
  
  if (data.customerEmail) {
    doc.text(data.customerEmail, 10, cursorY);
    cursorY += 5;
  }
  
  if (data.display_order_id) {
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER #:', pageWidth - 65, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.display_order_id, pageWidth - 10, cursorY, { align: 'right' });
    cursorY += 5;
  }
  
  // Add spacer
  cursorY += 10;
  
  // Items table header with background
  doc.setFillColor(hexToRgb(settings.secondary_color).r, hexToRgb(settings.secondary_color).g, hexToRgb(settings.secondary_color).b);
  doc.rect(10, cursorY, pageWidth - 20, 8, 'F');
  
  // Table headers
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ITEM', 15, cursorY + 5.5);
  doc.text('QTY', pageWidth / 2, cursorY + 5.5, { align: 'center' });
  doc.text('PRICE', pageWidth - 55, cursorY + 5.5, { align: 'right' });
  doc.text('AMOUNT', pageWidth - 15, cursorY + 5.5, { align: 'right' });
  cursorY += 12;
  
  // Reset text color for items
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Items
  data.items.forEach((item, index) => {
    if (index % 2 === 0) {
      // Light background for even rows
      doc.setFillColor(245, 245, 245);
      doc.rect(10, cursorY - 4, pageWidth - 20, 8, 'F');
    }
    
    doc.text(item.name, 15, cursorY);
    doc.text(item.quantity.toString(), pageWidth / 2, cursorY, { align: 'center' });
    doc.text(item.price.toFixed(2), pageWidth - 55, cursorY, { align: 'right' });
    doc.text(item.total.toFixed(2), pageWidth - 15, cursorY, { align: 'right' });
    cursorY += 8;
  });
  
  // Summary section with subtle separator
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth / 2, cursorY, pageWidth - 10, cursorY);
  cursorY += 8;
  
  // Summary items aligned to right
  doc.text('Subtotal:', pageWidth - 65, cursorY);
  doc.text(data.subtotal.toFixed(2), pageWidth - 15, cursorY, { align: 'right' });
  cursorY += 5;
  
  // Add coupon discount if present
  if (data.coupon_code) {
    let discountAmount = data.coupon_discount_amount || 0;
    if (!discountAmount && data.coupon_discount_type === 'percentage' && data.coupon_discount_value) {
      discountAmount = (data.subtotal * data.coupon_discount_value) / 100;
    } else if (!discountAmount && data.coupon_discount_type === 'fixed_amount' && data.coupon_discount_value) {
      discountAmount = data.coupon_discount_value;
    }
    
    doc.text(`Discount (${data.coupon_code}):`, pageWidth - 65, cursorY);
    doc.text(`-${discountAmount.toFixed(2)}`, pageWidth - 15, cursorY, { align: 'right' });
    cursorY += 5;
  }
  
  // Tax section with custom labels
  if (settings.include_tax_breakdown) {
    const halfTax = data.tax_amount / 2;
    doc.text(`${settings.tax_label_1} (${settings.tax_rate_1}%):`, pageWidth - 65, cursorY);
    doc.text(halfTax.toFixed(2), pageWidth - 15, cursorY, { align: 'right' });
    cursorY += 5;
    
    doc.text(`${settings.tax_label_2} (${settings.tax_rate_2}%):`, pageWidth - 65, cursorY);
    doc.text(halfTax.toFixed(2), pageWidth - 15, cursorY, { align: 'right' });
    cursorY += 5;
  } else {
    doc.text(`Tax (${settings.tax_rate_1 + settings.tax_rate_2}%):`, pageWidth - 65, cursorY);
    doc.text(data.tax_amount.toFixed(2), pageWidth - 15, cursorY, { align: 'right' });
    cursorY += 5;
  }
  
  // Total with highlight
  doc.setFillColor(hexToRgb(settings.primary_color).r, hexToRgb(settings.primary_color).g, hexToRgb(settings.primary_color).b);
  doc.rect(pageWidth - 85, cursorY - 4, 80, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - 65, cursorY + 2);
  doc.text(data.total.toFixed(2), pageWidth - 15, cursorY + 2, { align: 'right' });
  cursorY += 15;
  
  // Reset color for payment method
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Method: ${data.paymentMethod}`, pageWidth - 65, cursorY, { align: 'right' });
  cursorY += 10;
  
  // QR code if enabled
  if (settings.include_qr_code && settings.qr_code_content) {
    // Store QR code info for later generation
    doc.qrCodeInfo = {
      content: settings.qr_code_content,
      x: 15, 
      y: cursorY, 
      size: 30
    };
    
    // Leave space for QR code
    cursorY += 35;
  }
  
  // Terms and notes with larger spacing
  if (settings.terms_conditions) {
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions', 15, cursorY);
    cursorY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    const terms = doc.splitTextToSize(settings.terms_conditions, pageWidth - 30);
    doc.text(terms, 15, cursorY);
    cursorY += terms.length * 4 + 5;
  }
  
  // Footer with custom text
  const footerY = pageHeight - 15;
  
  if (settings.footer_text) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(settings.footer_text, pageWidth / 2, footerY - 10, { align: 'center', maxWidth: pageWidth - 20 });
  }
  
  // Company info in footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.company_name} | ${settings.company_address} | ${settings.company_email}`, pageWidth / 2, footerY, { align: 'center' });
  
  return doc;
};

// Premium template with advanced features
const generatePremiumTemplate = (doc: jsPDF, data: InvoiceData, settings: InvoiceSettings): jsPDF => {
  // Page size and orientation are already set during document creation
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let cursorY = 20;
  
  // Add watermark if provided
  if (settings.watermark_text) {
    addWatermark(doc, settings.watermark_text, settings.watermark_opacity);
  }
  
  // Set the font family if specified
  const fontFamily = settings.font_family || 'helvetica';
  doc.setFont(fontFamily);
  
  // Apply custom header HTML if available
  if (settings.custom_header_html) {
    // This is a simplified approach as jsPDF doesn't directly support HTML rendering
    // In a real implementation, you might use html2canvas or similar
    doc.setFontSize(10);
    doc.setFont(fontFamily, 'italic');
    doc.text('Custom Header HTML is applied here', pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 10;
  }
  
  // Premium header with enhanced styling
  const headerBgColor = hexToRgb(settings.primary_color);
  doc.setFillColor(headerBgColor.r, headerBgColor.g, headerBgColor.b);
  doc.rect(0, 0, pageWidth, 15, 'F');
  
  // Logo placement with improved positioning
  if (settings.company_logo_url) {
    try {
      // Determine image format from URL or default to JPEG
      let format = 'JPEG';
      const url = settings.company_logo_url?.toLowerCase();
      if (url?.includes('.png')) format = 'PNG';
      else if (url?.includes('.gif')) format = 'GIF';
      else if (url?.includes('.webp')) format = 'WEBP';
      
      doc.addImage(settings.company_logo_url, format, 10, 20, 50, 25, undefined, 'FAST');
      cursorY = 55; // Adjust cursor position after logo
    } catch (error) {
      console.error('Error loading logo:', error);
      // Continue without logo if it fails to load
      cursorY = 30;
    }
  } else {
    cursorY = 30;
  }
  
  // Invoice title with elegant styling
  doc.setFontSize(24);
  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(hexToRgb(settings.accent_color).r, hexToRgb(settings.accent_color).g, hexToRgb(settings.accent_color).b);
  doc.text('INVOICE', pageWidth - 20, 30, { align: 'right' });
  
  // Invoice number with styling
  doc.setFontSize(12);
  doc.setFont(fontFamily, 'normal');
  doc.text(`${settings.invoice_prefix}${data.invoiceNumber}${settings.invoice_suffix}`, pageWidth - 20, 40, { align: 'right' });
  
  // Date with custom format
  doc.text(`Date: ${format(data.date, settings.date_format)}`, pageWidth - 20, 50, { align: 'right' });
  
  // Company information with enhanced styling
  doc.setFontSize(14);
  doc.setFont(fontFamily, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(settings.company_name, 10, cursorY);
  cursorY += 6;
  
  doc.setFontSize(9);
  doc.setFont(fontFamily, 'normal');
  
  // Format address with styling
  const addressLines = settings.company_address.split(',');
  addressLines.forEach(line => {
    doc.text(line.trim(), 10, cursorY);
    cursorY += 4;
  });
  
  if (settings.company_phone) {
    doc.text(`Tel: ${settings.company_phone}`, 10, cursorY);
    cursorY += 4;
  }
  
  doc.text(`Email: ${settings.company_email}`, 10, cursorY);
  cursorY += 4;
  
  if (settings.company_website) {
    doc.text(`Web: ${settings.company_website}`, 10, cursorY);
    cursorY += 4;
  }
  
  // Add custom fields in the header section
  cursorY = renderCustomFields(doc, settings, 'header', 10, cursorY + 5);
  cursorY += 5;
  
  // Bill to section with elegant styling
  doc.setFillColor(245, 245, 245);
  doc.rect(10, cursorY, pageWidth / 2 - 20, 30, 'F');
  
  cursorY += 5;
  doc.setFont(fontFamily, 'bold');
  doc.text('BILL TO:', 15, cursorY);
  cursorY += 5;
  
  doc.setFont(fontFamily, 'normal');
  doc.text(data.customerName, 15, cursorY);
  cursorY += 5;
  
  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, 15, cursorY);
    cursorY += 5;
  }
  
  if (data.customerEmail) {
    doc.text(`Email: ${data.customerEmail}`, 15, cursorY);
    cursorY += 5;
  }
  
  // Show order ID if available
  if (data.display_order_id) {
    doc.setFont(fontFamily, 'bold');
    doc.text('Order Reference:', pageWidth - 80, cursorY - 15);
    doc.setFont(fontFamily, 'normal');
    doc.text(data.display_order_id, pageWidth - 20, cursorY - 15, { align: 'right' });
    cursorY += 5;
  }
  
  // Payment method display
  doc.setFont(fontFamily, 'bold');
  doc.text('Payment Method:', pageWidth - 80, cursorY - 5);
  doc.setFont(fontFamily, 'normal');
  doc.text(data.paymentMethod, pageWidth - 20, cursorY - 5, { align: 'right' });
  
  // Add custom fields in the details section
  cursorY = renderCustomFields(doc, settings, 'details', pageWidth - 80, cursorY + 10);
  cursorY += 15;
  
  // Items table with premium styling
  // Table header with gradient effect
  
  // Create header gradient (simulated with multiple rectangles)
  const gradientSteps = 10;
  const primaryColor = hexToRgb(settings.primary_color);
  const secondaryColor = hexToRgb(settings.secondary_color);
  
  for (let i = 0; i < gradientSteps; i++) {
    const ratio = i / gradientSteps;
    const r = Math.round(primaryColor.r * (1 - ratio) + secondaryColor.r * ratio);
    const g = Math.round(primaryColor.g * (1 - ratio) + secondaryColor.g * ratio);
    const b = Math.round(primaryColor.b * (1 - ratio) + secondaryColor.b * ratio);
    
    doc.setFillColor(r, g, b);
    const gradientWidth = (pageWidth - 20) / gradientSteps;
    doc.rect(10 + (i * gradientWidth), cursorY, gradientWidth, 10, 'F');
  }
  
  // Table header text
  doc.setTextColor(255, 255, 255);
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(10);
  
  // Define columns based on settings or use default
  const columns = settings.item_table_columns || ['Item', 'Qty', 'Price', 'Amount'];
  const colWidths = [(pageWidth - 20) * 0.5, (pageWidth - 20) * 0.15, (pageWidth - 20) * 0.15, (pageWidth - 20) * 0.2];
  
  // Draw column headers
  doc.text(columns[0] || 'Item', 15, cursorY + 6.5);
  doc.text(columns[1] || 'Qty', 10 + colWidths[0] + (colWidths[1] / 2), cursorY + 6.5, { align: 'center' });
  doc.text(columns[2] || 'Price', 10 + colWidths[0] + colWidths[1] + (colWidths[2] / 2), cursorY + 6.5, { align: 'center' });
  doc.text(columns[3] || 'Amount', pageWidth - 15, cursorY + 6.5, { align: 'right' });
  
  cursorY += 12;
  doc.setTextColor(0, 0, 0);
  
  // Items with alternating background
  data.items.forEach((item, index) => {
    // Alternating row styles
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
    } else {
      doc.setFillColor(240, 240, 240);
    }
    
    doc.rect(10, cursorY - 4, pageWidth - 20, 8, 'F');
    
    // Item details
    doc.setFont(fontFamily, 'normal');
    doc.text(item.name, 15, cursorY);
    
    // Format currency with symbol
    const currencySymbol = settings.currency_symbol || 'Rs';
    const formatCurrency = (amount: number) => {
      if (settings.currency_format === 'symbol_after') {
        return `${amount.toFixed(2)}${currencySymbol}`;
      } else {
        return `${currencySymbol}${amount.toFixed(2)}`;
      }
    };
    
    doc.text(item.quantity.toString(), 10 + colWidths[0] + (colWidths[1] / 2), cursorY, { align: 'center' });
    doc.text(formatCurrency(item.price), 10 + colWidths[0] + colWidths[1] + (colWidths[2] / 2), cursorY, { align: 'center' });
    doc.text(formatCurrency(item.total), pageWidth - 15, cursorY, { align: 'right' });
    
    cursorY += 8;
  });
  
  // Draw a line at the bottom of the table
  doc.setDrawColor(hexToRgb(settings.primary_color).r, hexToRgb(settings.primary_color).g, hexToRgb(settings.primary_color).b);
  doc.setLineWidth(0.5);
  doc.line(10, cursorY, pageWidth - 10, cursorY);
  cursorY += 8;
  
  // Summary section with elegant styling
  const summaryX = pageWidth - 90;
  
  // Subtotal
  doc.setFont(fontFamily, 'normal');
  doc.text('Subtotal:', summaryX, cursorY);
  doc.text(settings.currency_symbol + data.subtotal.toFixed(2), pageWidth - 15, cursorY, { align: 'right' });
  cursorY += 6;
  
  // Add coupon discount if present
  if (data.coupon_code) {
    let discountAmount = data.coupon_discount_amount || 0;
    if (!discountAmount && data.coupon_discount_type === 'percentage' && data.coupon_discount_value) {
      discountAmount = (data.subtotal * data.coupon_discount_value) / 100;
    } else if (!discountAmount && data.coupon_discount_type === 'fixed_amount' && data.coupon_discount_value) {
      discountAmount = data.coupon_discount_value;
    }
    
    doc.text(`Discount (${data.coupon_code}):`, summaryX, cursorY);
    doc.text(`-${settings.currency_symbol}${discountAmount.toFixed(2)}`, pageWidth - 15, cursorY, { align: 'right' });
    cursorY += 6;
  }
  
  // Tax details based on settings
  if (settings.include_tax_breakdown) {
    // Itemized tax display
    if (settings.itemized_tax_display) {
      // Calculate tax per item if needed
      data.items.forEach(item => {
        if (item.tax_amount > 0) {
          const taxLine = `Tax (${item.name}):`;
          doc.text(taxLine, summaryX, cursorY);
          doc.text(`${settings.currency_symbol}${item.tax_amount.toFixed(2)}`, pageWidth - 15, cursorY, { align: 'right' });
          cursorY += 6;
        }
      });
    } else {
      // Standard tax breakdown
      const halfTax = data.tax_amount / 2;
      
      doc.text(`${settings.tax_label_1} (${settings.tax_rate_1}%):`, summaryX, cursorY);
      doc.text(`${settings.currency_symbol}${halfTax.toFixed(2)}`, pageWidth - 15, cursorY, { align: 'right' });
      cursorY += 6;
      
      doc.text(`${settings.tax_label_2} (${settings.tax_rate_2}%):`, summaryX, cursorY);
      doc.text(`${settings.currency_symbol}${halfTax.toFixed(2)}`, pageWidth - 15, cursorY, { align: 'right' });
      cursorY += 6;
    }
    
    // Total tax
    doc.text('Total Tax:', summaryX, cursorY);
    doc.text(`${settings.currency_symbol}${data.tax_amount.toFixed(2)}`, pageWidth - 15, cursorY, { align: 'right' });
    cursorY += 6;
  } else {
    // Simple tax display
    doc.text(`Tax (${settings.tax_rate_1 + settings.tax_rate_2}%):`, summaryX, cursorY);
    doc.text(`${settings.currency_symbol}${data.tax_amount.toFixed(2)}`, pageWidth - 15, cursorY, { align: 'right' });
    cursorY += 6;
  }
  
  // Total with premium styling
  const totalBoxHeight = 12;
  
  // Draw a gradient background for total
  const gradientStepsTotal = 10;
  for (let i = 0; i < gradientStepsTotal; i++) {
    const ratio = i / gradientStepsTotal;
    const r = Math.round(primaryColor.r * (1 - ratio) + secondaryColor.r * ratio);
    const g = Math.round(primaryColor.g * (1 - ratio) + secondaryColor.g * ratio);
    const b = Math.round(primaryColor.b * (1 - ratio) + secondaryColor.b * ratio);
    
    doc.setFillColor(r, g, b);
    const gradientWidth = 90 / gradientStepsTotal;
    doc.rect(summaryX + (i * gradientWidth), cursorY - 5, gradientWidth, totalBoxHeight, 'F');
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFont(fontFamily, 'bold');
  doc.text('TOTAL:', summaryX + 10, cursorY + 2);
  doc.text(`${settings.currency_symbol}${data.total.toFixed(2)}`, pageWidth - 15, cursorY + 2, { align: 'right' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  cursorY += totalBoxHeight + 5;
  
  // Add paid/overdue stamp if enabled
  if (settings.show_paid_stamp) {
    addStamp(doc, 'PAID', '#007700');
  } else if (settings.show_overdue_stamp) {
    addStamp(doc, 'OVERDUE', '#d32f2f');
  }
  
  // Add barcode if enabled
  if (settings.barcode_type === 'qr' && settings.barcode_content) {
    // Store QR code info for later generation
    doc.qrCodeInfo = { 
      content: settings.barcode_content, 
      x: 15, 
      y: cursorY + 15, 
      size: 35 
    };
    
    // Leave space for QR code
    cursorY += 45;
    
    // QR code caption
    doc.setFontSize(8);
    doc.setFont(fontFamily, 'normal');
    doc.text('Scan to verify invoice', 32, cursorY, { align: 'center' });
    cursorY += 10;
  }
  
  // Payment instructions if enabled
  if (settings.include_payment_instructions && settings.payment_instructions) {
    doc.setFontSize(10);
    doc.setFont(fontFamily, 'bold');
    doc.text('Payment Instructions:', 15, cursorY);
    cursorY += 5;
    
    doc.setFont(fontFamily, 'normal');
    const paymentInstructions = doc.splitTextToSize(settings.payment_instructions, pageWidth - 30);
    doc.text(paymentInstructions, 15, cursorY);
    cursorY += paymentInstructions.length * 5 + 5;
  }
  
  // Terms and conditions
  if (settings.terms_conditions) {
    doc.setFontSize(10);
    doc.setFont(fontFamily, 'bold');
    doc.text('Terms & Conditions:', 15, cursorY);
    cursorY += 5;
    
    doc.setFont(fontFamily, 'normal');
    const terms = doc.splitTextToSize(settings.terms_conditions, pageWidth - 30);
    doc.text(terms, 15, cursorY);
    cursorY += terms.length * 5 + 5;
  }
  
  // Signature field if enabled
  if (settings.include_signature_field) {
    cursorY = Math.min(cursorY, pageHeight - 50); // Ensure it fits on page
    
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(15, cursorY + 20, 100, cursorY + 20); // Signature line
    
    doc.setFontSize(9);
    doc.text('Authorized Signature', 57, cursorY + 25, { align: 'center' });
    
    // Add digital signature if available
    if (settings.digital_signature_url) {
      try {
        doc.addImage(settings.digital_signature_url, 'PNG', 30, cursorY, 50, 20);
      } catch (error) {
        console.error('Error adding signature:', error);
      }
    }
    
    // Add signature text if provided
    if (settings.signature_text) {
      doc.setFont(fontFamily, 'italic');
      doc.text(settings.signature_text, 57, cursorY + 15, { align: 'center' });
    }
    
    cursorY += 30;
  }
  
  // Add custom fields in the footer section
  cursorY = renderCustomFields(doc, settings, 'footer', 15, cursorY);
  
  // Custom footer HTML if available
  if (settings.custom_footer_html) {
    // Simplified approach as jsPDF doesn't directly support HTML
    doc.setFontSize(8);
    doc.setFont(fontFamily, 'italic');
    doc.text('Custom Footer HTML is applied here', pageWidth / 2, pageHeight - 20, { align: 'center' });
  }
  
  // Footer with company information
  const footerY = pageHeight - 10;
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(8);
  
  if (settings.footer_text) {
    doc.text(settings.footer_text, pageWidth / 2, footerY, { align: 'center' });
  } else {
    doc.text(`${settings.company_name} | ${settings.company_email}`, pageWidth / 2, footerY, { align: 'center' });
  }
  
  // Page numbering
  doc.setFontSize(8);
  doc.text('Page 1 of 1', pageWidth - 20, footerY, { align: 'right' });
  
  return doc;
};

// Function to convert hex color to RGB for jsPDF
const hexToRgb = (hex: string) => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
};

// Helper function to generate QR code
const generateQRCode = (content: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(content)
      .then(url => resolve(url))
      .catch(err => reject(err));
  });
};

// Helper function to add watermark to the invoice
const addWatermark = (doc: jsPDF, text: string, opacity: number = 0.1): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Save current state
  const currentTextColor = doc.getTextColor();
  const currentFont = doc.getFont();
  const currentFontSize = doc.getFontSize();
  
  try {
    // Configure watermark with improved opacity handling
    const grayValue = Math.round(150 + (opacity * 100)); // Adjust gray based on opacity
    doc.setTextColor(grayValue, grayValue, grayValue);
    
    // Alternative opacity method for better compatibility
    if (typeof (doc as JsPDFWithGState).setGState === 'function') {
      try {
        (doc as JsPDFWithGState).setGState?.(new ((doc as JsPDFWithGState).GState!)({ opacity }));
      } catch {
        console.warn('GState opacity not supported, using color-based opacity');
      }
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(60);
    
    // Position watermark in center with rotation
    doc.text(text, pageWidth / 2, pageHeight / 2, { 
      align: 'center',
      angle: 45
    });
    
  } catch (error) {
    console.error('Error adding watermark:', error);
  } finally {
    // Restore original state
    doc.setTextColor(currentTextColor);
    doc.setFont(currentFont.fontName, currentFont.fontStyle);
    doc.setFontSize(currentFontSize);
    
    // Reset graphics state
    if (typeof (doc as JsPDFWithGState).setGState === 'function') {
      try {
        (doc as JsPDFWithGState).setGState?.(new ((doc as JsPDFWithGState).GState!)({ opacity: 1 }));
      } catch {
        // Ignore if not supported
      }
    }
  }
};

// Helper function to render custom fields
const renderCustomFields = (doc: jsPDF, settings: InvoiceSettings, location: 'header' | 'details' | 'footer', startX: number, startY: number): number => {
  if (!settings.custom_fields || settings.custom_fields.length === 0) {
    return startY; // No changes to Y position
  }
  
  const locationFields = settings.custom_fields.filter(
    field => field.display_location === location && field.is_visible
  );
  
  if (locationFields.length === 0) {
    return startY;
  }
  
  let cursorY = startY;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  locationFields.forEach(field => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${field.label}:`, startX, cursorY);
    doc.setFont('helvetica', 'normal');
    
    // Format based on field type
    let displayValue = field.value;
    if (field.field_type === 'date') {
      try {
        displayValue = format(new Date(field.value), settings.date_format || 'dd MMM yyyy');
      } catch (e) {
        console.error('Error formatting date custom field:', e);
      }
    } else if (field.field_type === 'currency') {
      try {
        const symbol = settings.currency_symbol || 'Rs';
        displayValue = `${symbol}${parseFloat(field.value).toFixed(2)}`;
      } catch (e) {
        console.error('Error formatting currency custom field:', e);
      }
    }
    
    doc.text(displayValue, startX + 30, cursorY);
    cursorY += 5;
  });
  
  return cursorY;
};

// Helper function to add a stamp to the invoice
const addStamp = (doc: jsPDF, text: string, color: string): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Parse hex color to RGB
  const colorRGB = hexToRgb(color);
  
  // Save current state
  const currentTextColor = doc.getTextColor();
  const currentFont = doc.getFont();
  const currentFontSize = doc.getFontSize();
  
  try {
    // Configure stamp
    doc.setTextColor(colorRGB.r, colorRGB.g, colorRGB.b);
    
    // Try to set opacity if supported
    if (typeof (doc as JsPDFWithGState).setGState === 'function') {
      try {
        (doc as JsPDFWithGState).setGState?.(new ((doc as JsPDFWithGState).GState!)({ opacity: 0.7 }));
      } catch {
        console.warn('GState not supported for stamp, using solid color');
      }
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(60);
    
    // Diagonal stamp position
    const xPos = pageWidth * 0.75;
    const yPos = pageHeight * 0.25;
    
    // Draw the text
    doc.text(text, xPos, yPos, { 
      align: 'center',
      angle: -45
    });
    
    // Add a simple border around the stamp area
    doc.setDrawColor(colorRGB.r, colorRGB.g, colorRGB.b);
    doc.setLineWidth(2);
    
    const stampWidth = doc.getTextWidth(text) * 1.2;
    const stampHeight = 60;
    
    // Draw a simple border - rectangle with rounded corners
    doc.roundedRect(
      xPos - stampWidth / 2,
      yPos - stampHeight / 2,
      stampWidth,
      stampHeight,
      5,
      5,
      'S'
    );
    
  } catch (error) {
    console.error('Error adding stamp:', error);
  } finally {
    // Restore original state
    doc.setTextColor(currentTextColor);
    doc.setFont(currentFont.fontName, currentFont.fontStyle);
    doc.setFontSize(currentFontSize);
    
    // Reset graphics state
    if (typeof (doc as JsPDFWithGState).setGState === 'function') {
      try {
        (doc as JsPDFWithGState).setGState?.(new ((doc as JsPDFWithGState).GState!)({ opacity: 1 }));
      } catch {
        // Ignore if not supported
      }
    }
  }
};
