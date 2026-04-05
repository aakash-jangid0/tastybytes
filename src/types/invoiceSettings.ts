// Interface for invoice template settings
export interface InvoiceSettings {
  id: string;
  business_id?: string;
  template_name: string; // default, modern, compact, detailed, premium
  company_name: string;
  company_address: string;
  company_phone?: string;
  company_email: string;
  company_website?: string;
  company_logo_url?: string;
  company_name_color?: string;
  logo_width?: number;
  logo_height?: number;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_text?: string;
  footer_text?: string;
  footer_line_1?: string;
  footer_line_2?: string;
  terms_conditions?: string;
  tax_label_1: string;
  tax_rate_1: number;
  tax_label_2: string;
  tax_rate_2: number;
  include_tax_breakdown: boolean;
  invoice_prefix: string;
  invoice_suffix: string;
  date_format: string;
  receipt_width: number;
  receipt_title: string;
  show_restaurant_contact: boolean;
  include_qr_code: boolean;
  qr_code_content?: string;
  // Advanced customization features
  watermark_text?: string;
  watermark_opacity?: number;
  custom_css?: string;
  custom_header_html?: string;
  custom_footer_html?: string;
  include_signature_field?: boolean; 
  signature_text?: string;
  digital_signature_url?: string;
  font_family?: string;
  custom_fields?: CustomField[];
  item_table_columns?: string[];
  page_size?: 'A4' | 'Letter' | 'Legal' | 'A5';
  page_orientation?: 'portrait' | 'landscape';
  currency_symbol?: string;
  currency_format?: string;
  enable_auto_numbering?: boolean;
  show_paid_stamp?: boolean;
  show_overdue_stamp?: boolean;
  itemized_tax_display?: boolean;
  barcode_type?: 'qr' | 'code128' | 'none';
  barcode_content?: string;
  include_payment_instructions?: boolean;
  payment_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  display_location: 'header' | 'details' | 'footer';
  field_type?: 'text' | 'date' | 'number' | 'currency';
  is_visible: boolean;
}

// Default values for invoice settings
export const defaultInvoiceSettings: Partial<InvoiceSettings> = {
  template_name: 'default',
  company_name: 'TastyBites',
  company_address: 'Malad west Mumbai Maharashtra',
  company_email: 'tastybites@tastybites.in',
  company_name_color: '#000000',
  logo_width: 30,
  logo_height: 10,
  primary_color: '#f97316',
  secondary_color: '#ffa500',
  accent_color: '#000000',
  tax_label_1: 'CGST',
  tax_rate_1: 9.0,
  tax_label_2: 'SGST', 
  tax_rate_2: 9.0,
  include_tax_breakdown: true,
  invoice_prefix: '',
  invoice_suffix: '',
  date_format: 'dd MMM yyyy',
  receipt_width: 80,
  receipt_title: 'RECEIPT',
  show_restaurant_contact: true,
  include_qr_code: false,
  footer_line_1: '**SAVE PAPER SAVE NATURE !!**',
  footer_line_2: 'YOU CAN NOW CALL US ON 1800 226344 (TOLL-FREE) FOR QUERIES/COMPLAINTS.',
  // Advanced features defaults
  watermark_opacity: 0.1,  font_family: 'helvetica',
  page_size: 'A4',
  page_orientation: 'portrait',
  currency_symbol: 'Rs',
  currency_format: 'symbol_before',
  enable_auto_numbering: true,
  show_paid_stamp: true,
  show_overdue_stamp: true,
  itemized_tax_display: false,
  barcode_type: 'qr',
  include_payment_instructions: false,
  custom_fields: []
};

// Template types available
export type InvoiceTemplateType = 'default' | 'modern' | 'compact' | 'detailed' | 'premium';

// Interface for template descriptions
export interface TemplateOption {
  id: InvoiceTemplateType;
  name: string;
  description: string;
  previewImage: string;
  features?: string[];
}

// Available template options
export const templateOptions: TemplateOption[] = [
  {
    id: 'default',
    name: 'Classic',
    description: 'Standard invoice layout with company details at top',
    previewImage: '/templates/classic.png'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean minimalist design with customizable accent colors',
    previewImage: '/templates/modern.png'
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Condensed format ideal for small receipts',
    previewImage: '/templates/compact.png'
  },
  {
    id: 'detailed',
    name: 'Detailed',
    description: 'Comprehensive layout with additional fields and information',
    previewImage: '/templates/detailed.png'
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Advanced professional template with watermarks, custom fields and more',
    previewImage: '/templates/premium.png',
    features: [
      'Custom watermark',
      'Digital signatures',
      'Custom fields',
      'Advanced styling options',
      'Multiple page support',
      'Variable page sizes'
    ]
  }
];
