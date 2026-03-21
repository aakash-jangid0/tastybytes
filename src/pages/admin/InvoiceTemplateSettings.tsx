import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { SketchPicker } from 'react-color';
import { 
  Save, 
  Layout,
  Edit3,
  Image,
  FileText as FileIcon, 
  Info, 
  Coins, 
  Settings, 
  Eye 
} from 'lucide-react';
import { 
  InvoiceSettings, 
  defaultInvoiceSettings,
  templateOptions,
  InvoiceTemplateType,
  CustomField
} from '../../types/invoiceSettings';
import { Invoice } from '../../types/invoice';
import { useGuestGuard } from '../../hooks/useGuestGuard';

// Mock invoice data for preview
const sampleInvoiceData: Invoice = {
  id: 'sample-invoice-id',
  order_id: 'sample-order-id',
  display_order_id: '#123456',
  invoice_number: 'INV-12345',
  customer_name: 'Sample Customer',
  customer_phone: '+91 9876543210',
  customer_email: 'customer@example.com',
  billing_address: '123 Sample Street, Sample City',
  invoice_date: new Date().toISOString(),
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  subtotal: 550.00,
  tax_amount: 99.00,
  discount_amount: 50.00,
  total_amount: 599.00,
  status: 'issued',
  payment_method: 'Cash',
  notes: 'Thank you for your business!',
  terms_and_conditions: 'Standard terms and conditions apply.',
  is_printed: false,
  print_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  items: [
    {
      id: 'item-1',
      invoice_id: 'sample-invoice-id',
      item_name: 'Butter Chicken',
      description: 'Classic Indian dish with tender chicken',
      quantity: 2,
      unit_price: 200.00,
      tax_rate: 0.18,
      tax_amount: 72.00,
      discount_amount: 0,
      total_amount: 472.00,
      created_at: new Date().toISOString()
    },
    {
      id: 'item-2',
      invoice_id: 'sample-invoice-id',
      item_name: 'Garlic Naan',
      description: 'Freshly baked Indian bread',
      quantity: 3,
      unit_price: 50.00,
      tax_rate: 0.18,
      tax_amount: 27.00,
      discount_amount: 0,
      total_amount: 177.00,
      created_at: new Date().toISOString()
    }
  ]
};

// Main component
export default function InvoiceTemplateSettings() {
  const { isGuest, guardAction } = useGuestGuard();
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('company');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Function to fetch settings from the database
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // If no settings found, use defaults
        setSettings(defaultInvoiceSettings as InvoiceSettings);
      }
    } catch (error) {
      console.error('Error fetching invoice settings:', error);
      toast.error('Failed to load invoice settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setSettings(prev => {
      if (!prev) return prev;
      
      // Handle different input types
      if (type === 'number') {
        return { ...prev, [name]: parseFloat(value) };
      } else if (type === 'checkbox') {
        return { ...prev, [name]: (e.target as HTMLInputElement).checked };
      } else {
        return { ...prev, [name]: value };
      }
    });
  };

  // Handle color change
  const handleColorChange = (color: { hex: string }, colorType: string) => {
    setSettings(prev => {
      if (!prev) return prev;
      return { ...prev, [colorType]: color.hex };
    });
  };

  // Handle template change
  const handleTemplateChange = (templateId: InvoiceTemplateType) => {
    setSettings(prev => {
      if (!prev) return prev;
      return { ...prev, template_name: templateId };
    });
  };
  // Handle file upload for logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload logo to storage and get URL
  const uploadLogo = async () => {
    if (!logoFile) return null;
    
    try {
      const fileExt = logoFile.name.split('.').pop()?.toLowerCase();
      if (!fileExt) {
        throw new Error('Invalid file extension');
      }
      
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `invoice-logos/${fileName}`;
      
      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      if (!uploadData?.path) {
        throw new Error('Upload succeeded but no path returned');
      }
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(uploadData.path);
        
      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }
      
      // Clear the file input after successful upload
      setLogoFile(null);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  // Save settings to database
  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      
      // Upload logo if a new file was selected
      let logoUrl = settings.company_logo_url;
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
          // Clear preview after successful upload
          setLogoPreview(null);
        } else {
          // If logo upload failed, don't proceed with saving
          toast.error('Please fix logo upload issue before saving');
          return;
        }
      }
      
      const settingsToSave = {
        ...settings,
        company_logo_url: logoUrl,
        updated_at: new Date().toISOString()
      };
      
      // Remove any undefined values that might cause database issues
      Object.keys(settingsToSave).forEach(key => {
        if (settingsToSave[key as keyof typeof settingsToSave] === undefined) {
          delete settingsToSave[key as keyof typeof settingsToSave];
        }
      });
      
      // If settings has an ID, update, otherwise insert
      let operation;
      if (settings.id) {
        operation = supabase
          .from('invoice_settings')
          .update(settingsToSave)
          .eq('id', settings.id)
          .select();
      } else {
        operation = supabase
          .from('invoice_settings')
          .insert(settingsToSave)
          .select();
      }
      
      const { data, error } = await operation;
      
      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (data && data.length > 0) {
        setSettings(data[0]);
      }
      
      toast.success('Invoice settings saved successfully');
      
      // Refresh settings from database to ensure consistency
      await fetchSettings();
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      toast.error(`Failed to save invoice settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };
  // Generate invoice preview
  const handlePreview = async () => {
    if (!settings) return;
    
    try {
      setPreviewLoading(true);
      
      // Import the invoice generator dynamically
      const { generateInvoice } = await import('../../utils/invoiceGenerator');
      
      // Convert the sample invoice data to the format expected by generateInvoice
      const invoiceData = {
        invoiceNumber: sampleInvoiceData.invoice_number,
        customerName: sampleInvoiceData.customer_name,
        customerPhone: sampleInvoiceData.customer_phone,
        customerEmail: sampleInvoiceData.customer_email,
        display_order_id: sampleInvoiceData.display_order_id,
        order_id: sampleInvoiceData.order_id,
        items: sampleInvoiceData.items.map(item => ({
          id: item.id,
          name: item.item_name,
          price: item.unit_price,
          quantity: item.quantity,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          total: item.total_amount
        })),
        subtotal: sampleInvoiceData.subtotal,
        tax_amount: sampleInvoiceData.tax_amount,
        total: sampleInvoiceData.total_amount,
        paymentMethod: sampleInvoiceData.payment_method || 'Cash',
        date: new Date(sampleInvoiceData.invoice_date)
      };
      
      // Generate PDF with sample data and current settings
      const pdfDoc = await generateInvoice(invoiceData, settings);
      
      // Open in new window
      window.open(pdfDoc.output('bloburl'));
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoice Template Settings</h1>
        <div className="flex space-x-2">
          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center space-x-1 hover:bg-blue-600 transition"
          >
            <Eye size={18} />
            <span>{previewLoading ? 'Generating...' : 'Preview'}</span>
          </button>
          <button
            onClick={() => guardAction(() => saveSettings())}
            disabled={saving || isGuest}
            className="px-4 py-2 bg-orange-500 text-white rounded-md flex items-center space-x-1 hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'company' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('company')}
        >
          <div className="flex items-center space-x-1">
            <Info size={16} />
            <span>Company Info</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'templates' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('templates')}
        >
          <div className="flex items-center space-x-1">
            <Layout size={16} />
            <span>Templates</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'styling' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('styling')}
        >
          <div className="flex items-center space-x-1">
            <Edit3 size={16} />
            <span>Styling</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'content' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('content')}
        >
          <div className="flex items-center space-x-1">
            <FileIcon size={16} />
            <span>Custom Content</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'tax' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('tax')}
        >
          <div className="flex items-center space-x-1">
            <Coins size={16} />
            <span>Tax Settings</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'advanced' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('advanced')}
        >
          <div className="flex items-center space-x-1">
            <Settings size={16} />
            <span>Advanced</span>
          </div>
        </button>
      </div>

      {/* Company Info Tab */}
      {activeTab === 'company' && settings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="company_address"
                value={settings.company_address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  name="company_phone"
                  value={settings.company_phone || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="company_email"
                  value={settings.company_email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="text"
                name="company_website"
                value={settings.company_website || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="https://example.com"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Logo
              </label>
              <div className="border rounded-md p-4 flex flex-col items-center">
                {(logoPreview || settings.company_logo_url) && (
                  <div className="mb-4 border p-2 rounded-md">
                    <img 
                      src={logoPreview || settings.company_logo_url} 
                      alt="Company Logo" 
                      className="h-24 object-contain"
                    />
                  </div>
                )}
                <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md inline-flex items-center">
                  <Image size={16} className="mr-2" />
                  <span>Upload Logo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: PNG or JPG, 300x100 pixels
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Show Contact Information
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="show_restaurant_contact"
                  checked={settings.show_restaurant_contact}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Display contact information on invoices
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Title
              </label>
              <input
                type="text"
                name="receipt_title"
                value={settings.receipt_title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Title displayed at the top of your receipt (e.g., "RECEIPT", "TAX INVOICE")
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && settings && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templateOptions.map(template => (
              <div 
                key={template.id}
                className={`border rounded-lg p-4 cursor-pointer transition 
                  ${settings.template_name === template.id 
                    ? 'border-orange-500 ring-2 ring-orange-400' 
                    : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => handleTemplateChange(template.id)}
              >
                <div className="aspect-w-3 aspect-h-4 mb-3 bg-gray-100 rounded">
                  <img 
                    src={template.previewImage} 
                    alt={template.name}
                    className="object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=Preview+Not+Available';
                    }}
                  />
                </div>
                <h3 className="font-medium">{template.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 p-4 rounded-md mt-4">
            <h3 className="font-medium mb-2">Template Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Classic:</strong> Traditional invoice layout with essential details</li>
              <li>• <strong>Modern:</strong> Clean design with customizable accent colors</li>
              <li>• <strong>Compact:</strong> Space-efficient format for small receipts</li>
              <li>• <strong>Detailed:</strong> Comprehensive layout with advanced fields</li>
            </ul>
          </div>
        </div>
      )}

      {/* Styling Tab */}
      {activeTab === 'styling' && settings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Color Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color
              </label>
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-md mr-3 border cursor-pointer"
                  style={{ backgroundColor: settings.primary_color }}
                  onClick={() => setShowColorPicker(showColorPicker === 'primary_color' ? null : 'primary_color')}
                ></div>
                <input
                  type="text"
                  name="primary_color"
                  value={settings.primary_color}
                  onChange={handleInputChange}
                  className="w-32 px-3 py-2 border rounded-md"
                />
              </div>
              {showColorPicker === 'primary_color' && (
                <div className="absolute z-10 mt-2">
                  <div 
                    className="fixed inset-0 z-0"
                    onClick={() => setShowColorPicker(null)}
                  ></div>
                  <div className="relative z-10">
                    <SketchPicker 
                      color={settings.primary_color} 
                      onChange={(color) => handleColorChange(color, 'primary_color')} 
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Used for headers and important elements
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Color
              </label>
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-md mr-3 border cursor-pointer"
                  style={{ backgroundColor: settings.secondary_color }}
                  onClick={() => setShowColorPicker(showColorPicker === 'secondary_color' ? null : 'secondary_color')}
                ></div>
                <input
                  type="text"
                  name="secondary_color"
                  value={settings.secondary_color}
                  onChange={handleInputChange}
                  className="w-32 px-3 py-2 border rounded-md"
                />
              </div>
              {showColorPicker === 'secondary_color' && (
                <div className="absolute z-10 mt-2">
                  <div 
                    className="fixed inset-0 z-0"
                    onClick={() => setShowColorPicker(null)}
                  ></div>
                  <div className="relative z-10">
                    <SketchPicker 
                      color={settings.secondary_color} 
                      onChange={(color) => handleColorChange(color, 'secondary_color')} 
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Used for less prominent elements
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accent Color
              </label>
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-md mr-3 border cursor-pointer"
                  style={{ backgroundColor: settings.accent_color }}
                  onClick={() => setShowColorPicker(showColorPicker === 'accent_color' ? null : 'accent_color')}
                ></div>
                <input
                  type="text"
                  name="accent_color"
                  value={settings.accent_color}
                  onChange={handleInputChange}
                  className="w-32 px-3 py-2 border rounded-md"
                />
              </div>
              {showColorPicker === 'accent_color' && (
                <div className="absolute z-10 mt-2">
                  <div 
                    className="fixed inset-0 z-0"
                    onClick={() => setShowColorPicker(null)}
                  ></div>
                  <div className="relative z-10">
                    <SketchPicker 
                      color={settings.accent_color} 
                      onChange={(color) => handleColorChange(color, 'accent_color')} 
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Used for text and borders
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Format Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Format
              </label>
              <select
                name="date_format"
                value={settings.date_format}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="dd/MM/yyyy">DD/MM/YYYY (31/12/2025)</option>
                <option value="MM/dd/yyyy">MM/DD/YYYY (12/31/2025)</option>
                <option value="yyyy-MM-dd">YYYY-MM-DD (2025-12-31)</option>
                <option value="dd MMM yyyy">DD MMM YYYY (31 Dec 2025)</option>
                <option value="MMMM dd, yyyy">MMMM DD, YYYY (December 31, 2025)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Width (mm)
              </label>
              <input
                type="number"
                name="receipt_width"
                value={settings.receipt_width}
                onChange={handleInputChange}
                min={50}
                max={210}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Standard A5 width is 148mm, thermal receipt width is typically 80mm
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Preview
              </label>
              <div className="border rounded-md p-4 bg-white">
                <div className="flex flex-col space-y-2">
                  <div className="p-2 rounded" style={{ backgroundColor: settings.primary_color }}>
                    <span className="text-white font-medium">Header Example</span>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: settings.secondary_color }}>
                    <span className="font-medium">Secondary Background</span>
                  </div>
                  <div className="p-2 rounded border">
                    <span style={{ color: settings.accent_color }}>This is how text will appear</span>
                  </div>
                  <div className="p-2 rounded border" style={{ borderColor: settings.primary_color }}>
                    <span>Border example</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && settings && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Header Text
            </label>
            <textarea
              name="header_text"
              value={settings.header_text || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Custom text to appear at the top of the invoice"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Footer Text
            </label>
            <textarea
              name="footer_text"
              value={settings.footer_text || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Custom text to appear at the bottom of the invoice"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Terms & Conditions
            </label>
            <textarea
              name="terms_conditions"
              value={settings.terms_conditions || ''}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Terms and conditions to display on the invoice"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                name="invoice_prefix"
                value={settings.invoice_prefix}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., INV-"
              />
              <p className="text-xs text-gray-500 mt-1">
                Text to appear before invoice number
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number Suffix
              </label>
              <input
                type="text"
                name="invoice_suffix"
                value={settings.invoice_suffix}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., -TB"
              />
              <p className="text-xs text-gray-500 mt-1">
                Text to appear after invoice number
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">QR Code</h3>
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                name="include_qr_code"
                checked={settings.include_qr_code}
                onChange={handleInputChange}
                className="h-4 w-4 text-orange-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                Include QR code on invoices
              </span>
            </div>
            
            {settings.include_qr_code && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QR Code Content
                </label>
                <textarea
                  name="qr_code_content"
                  value={settings.qr_code_content || ''}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="URL or text for the QR code"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This can be your website URL, UPI ID, or other information
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tax Settings Tab */}
      {activeTab === 'tax' && settings && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Changing tax settings will only affect new invoices. Existing invoices will maintain their original tax rates.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Tax Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Tax Label
                </label>
                <input
                  type="text"
                  name="tax_label_1"
                  value={settings.tax_label_1}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., CGST"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="tax_rate_1"
                  value={settings.tax_rate_1}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Second Tax Label
                </label>
                <input
                  type="text"
                  name="tax_label_2"
                  value={settings.tax_label_2}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., SGST"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Second Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="tax_rate_2"
                  value={settings.tax_rate_2}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                name="include_tax_breakdown"
                checked={settings.include_tax_breakdown}
                onChange={handleInputChange}
                className="h-4 w-4 text-orange-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                Show tax breakdown on invoices (e.g., separate CGST and SGST)
              </span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Total Effective Tax Rate</h4>
              <p className="text-lg font-bold text-orange-500">
                {(settings.tax_rate_1 + settings.tax_rate_2).toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This is the combined tax rate that will be applied to all items
              </p>
            </div>
          </div>
        </div>
      )}      {/* Advanced Settings Tab */}
      {activeTab === 'advanced' && settings && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-md font-medium mb-2">Template Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => guardAction(() => {
                  setSettings(defaultInvoiceSettings as InvoiceSettings);
                  toast.success('Settings reset to defaults');
                })}
                disabled={isGuest}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset to Default Settings
              </button>
              <button
                onClick={() => {
                  // Export settings as JSON
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", "invoice_settings.json");
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Export Settings
              </button>
            </div>
          </div>
          
          {/* Watermark Settings */}
          <div className="mt-4 border p-4 rounded-md">
            <h3 className="text-md font-medium mb-3">Watermark Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Watermark Text
                </label>
                <input
                  type="text"
                  name="watermark_text"
                  value={settings.watermark_text || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., PAID, COPY, CONFIDENTIAL"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Text will appear diagonally across the invoice
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Watermark Opacity
                </label>
                <input 
                  type="range" 
                  name="watermark_opacity"
                  min="0.05" 
                  max="0.5" 
                  step="0.05"
                  value={settings.watermark_opacity || 0.1}
                  onChange={handleInputChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Light</span>
                  <span>{((settings.watermark_opacity || 0.1) * 100).toFixed(0)}%</span>
                  <span>Dark</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Page Settings */}
          <div className="mt-4 border p-4 rounded-md">
            <h3 className="text-md font-medium mb-3">Page Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Size
                </label>
                <select
                  name="page_size"
                  value={settings.page_size || 'A4'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                  <option value="A5">A5</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Orientation
                </label>
                <select
                  name="page_orientation"
                  value={settings.page_orientation || 'portrait'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Family
                </label>
                <select
                  name="font_family"
                  value={settings.font_family || 'helvetica'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="helvetica">Helvetica</option>
                  <option value="courier">Courier</option>
                  <option value="times">Times</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Currency Settings */}
          <div className="mt-4 border p-4 rounded-md">
            <h3 className="text-md font-medium mb-3">Currency Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  name="currency_symbol"
                  value={settings.currency_symbol || 'Rs'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Rs, $, €, £"
                  maxLength={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Format
                </label>
                <select
                  name="currency_format"
                  value={settings.currency_format || 'symbol_before'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >                  <option value="symbol_before">Symbol Before (Rs100.00)</option>
                  <option value="symbol_after">Symbol After (100.00Rs)</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Visual Elements */}
          <div className="mt-4 border p-4 rounded-md">
            <h3 className="text-md font-medium mb-3">Visual Elements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Stamps
                </label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="show_paid_stamp"
                      checked={settings.show_paid_stamp || false}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Show "PAID" stamp on invoice
                    </span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="show_overdue_stamp"
                      checked={settings.show_overdue_stamp || false}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Show "OVERDUE" stamp for overdue invoices
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Digital Signature
                </label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    name="include_signature_field"
                    checked={settings.include_signature_field || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Include signature field on invoice
                  </span>
                </div>
                {settings.include_signature_field && (
                  <div className="mt-2">
                    <input
                      type="text"
                      name="signature_text"
                      value={settings.signature_text || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Name of the signatory"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode Type
                </label>
                <select
                  name="barcode_type"
                  value={settings.barcode_type || 'qr'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="qr">QR Code</option>
                  <option value="code128">Code 128</option>
                  <option value="none">None</option>
                </select>
                {settings.barcode_type !== 'none' && (
                  <input
                    type="text"
                    name="barcode_content"
                    value={settings.barcode_content || ''}
                    onChange={handleInputChange}
                    className="w-full mt-2 px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Content for the barcode"
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Display
                </label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    name="itemized_tax_display"
                    checked={settings.itemized_tax_display || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Show itemized tax breakdown (per item)
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Instructions */}
          <div className="mt-4 border p-4 rounded-md">
            <h3 className="text-md font-medium mb-3">Payment Instructions</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="include_payment_instructions"
                  checked={settings.include_payment_instructions || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Include payment instructions on invoice
                </span>
              </div>
              
              {settings.include_payment_instructions && (
                <textarea
                  name="payment_instructions"
                  value={settings.payment_instructions || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter bank details or payment instructions"
                />
              )}
            </div>
          </div>
          
          {/* Custom Fields Manager */}
          <div className="mt-4 border p-4 rounded-md">
            <h3 className="text-md font-medium mb-3">Custom Fields</h3>
            <p className="text-sm text-gray-600 mb-3">
              Add custom fields to be displayed on the invoice
            </p>
            
            <div className="mb-3">
              {(settings.custom_fields || []).map((field, index) => (
                <div key={index} className="flex items-center mb-2 bg-gray-50 p-2 rounded-md">
                  <div className="flex-grow">
                    <div className="font-medium">{field.label}</div>
                    <div className="text-xs text-gray-500">
                      {field.display_location === 'header' ? 'Header' : 
                       field.display_location === 'details' ? 'Details' : 'Footer'} • 
                      {field.field_type === 'date' ? ' Date' :
                       field.field_type === 'currency' ? ' Currency' : ' Text'}
                    </div>
                  </div>
                  <button
                    onClick={() => guardAction(() => {
                      const updatedFields = (settings.custom_fields || []).filter((_, i) => i !== index);
                      setSettings(prev => prev ? { ...prev, custom_fields: updatedFields } : prev);
                    })}
                    disabled={isGuest}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add a simplified way to add custom fields */}            <button
              onClick={() => guardAction(() => {
                const newField: CustomField = {
                  id: `field-${Date.now()}`,
                  label: `Custom Field ${(settings.custom_fields || []).length + 1}`,
                  value: '',
                  display_location: 'details',
                  field_type: 'text',
                  is_visible: true
                };

                setSettings(prev => {
                  if (!prev) return prev;
                  const currentFields = prev.custom_fields || [];
                  return {
                    ...prev,
                    custom_fields: [...currentFields, newField]
                  };
                });

                toast.success('Custom field added. Edit it in the interface after saving.');
              })}
              disabled={isGuest}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Custom Field
            </button>
          </div>
          
          {/* Developer Options */}
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Developer Options</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="text-xs overflow-auto max-h-60">
                {JSON.stringify(settings, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
