import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { SketchPicker } from 'react-color';
import {
  Save,
  Image,
  Info,
  Coins,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import {
  InvoiceSettings,
  defaultInvoiceSettings
} from '../../types/invoiceSettings';
import { Invoice } from '../../types/invoice';
import { useGuestGuard } from '../../hooks/useGuestGuard';

const sampleInvoiceData: Invoice = {
  id: 'sample-invoice-id',
  order_id: 'sample-order-id',
  display_order_id: '#123456',
  invoice_number: 'INV-12345',
  customer_name: 'Vikram Mehta',
  customer_phone: '9988776655',
  customer_email: 'vikram.mehta@gmail.com',
  billing_address: '23, Lajpat Nagar, New Delhi',
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
      id: 'item-1', invoice_id: 'sample-invoice-id', item_name: 'Butter Chicken',
      description: 'Classic Indian dish', quantity: 2, unit_price: 200.00,
      tax_rate: 0.18, tax_amount: 72.00, discount_amount: 0, total_amount: 472.00,
      created_at: new Date().toISOString()
    },
    {
      id: 'item-2', invoice_id: 'sample-invoice-id', item_name: 'Garlic Naan',
      description: 'Freshly baked Indian bread', quantity: 3, unit_price: 50.00,
      tax_rate: 0.18, tax_amount: 27.00, discount_amount: 0, total_amount: 177.00,
      created_at: new Date().toISOString()
    }
  ]
};

export default function InvoiceTemplateSettings() {
  const { isGuest, guardAction } = useGuestGuard();
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoice_settings').select('*')
        .order('created_at', { ascending: false }).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      setSettings(data || (defaultInvoiceSettings as InvoiceSettings));
    } catch (error) {
      console.error('Error fetching invoice settings:', error);
      toast.error('Failed to load invoice settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => {
      if (!prev) return prev;
      if (type === 'number' || type === 'range') return { ...prev, [name]: parseFloat(value) };
      if (type === 'checkbox') return { ...prev, [name]: (e.target as HTMLInputElement).checked };
      return { ...prev, [name]: value };
    });
  };

  const handleColorChange = (color: { hex: string }, key: string) => {
    setSettings(prev => prev ? { ...prev, [key]: color.hex } : prev);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) { toast.error('Please select a valid image file'); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error('Image size should be less than 5MB'); return; }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.onerror = () => toast.error('Failed to read image file');
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = () => {
    setSettings(prev => prev ? { ...prev, company_logo_url: undefined } : prev);
    setLogoFile(null);
    setLogoPreview(null);
    toast.success('Logo removed. Save to apply.');
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;
    try {
      const fileExt = logoFile.name.split('.').pop()?.toLowerCase();
      if (!fileExt) throw new Error('Invalid file extension');
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `invoice-logos/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets').upload(filePath, logoFile, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      if (!uploadData?.path) throw new Error('Upload succeeded but no path returned');
      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(uploadData.path);
      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');
      setLogoFile(null);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      let logoUrl = settings.company_logo_url;
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) { logoUrl = uploadedUrl; setLogoPreview(null); }
        else { toast.error('Please fix logo upload issue before saving'); return; }
      }
      const settingsToSave: any = { ...settings, company_logo_url: logoUrl || null, updated_at: new Date().toISOString() };
      Object.keys(settingsToSave).forEach(key => {
        if (settingsToSave[key] === undefined) delete settingsToSave[key];
      });
      let operation;
      if (settings.id) {
        operation = supabase.from('invoice_settings').update(settingsToSave).eq('id', settings.id).select();
      } else {
        operation = supabase.from('invoice_settings').insert(settingsToSave).select();
      }
      const { data, error } = await operation;
      if (error) throw new Error(`Database error: ${error.message}`);
      if (data && data.length > 0) setSettings(data[0]);
      toast.success('Invoice settings saved successfully');
      await fetchSettings();
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      toast.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!settings) return;
    try {
      setPreviewLoading(true);
      const { generateInvoice } = await import('../../utils/invoiceGenerator');
      const invoiceData = {
        invoiceNumber: sampleInvoiceData.invoice_number,
        customerName: sampleInvoiceData.customer_name,
        customerPhone: sampleInvoiceData.customer_phone,
        customerEmail: sampleInvoiceData.customer_email,
        display_order_id: sampleInvoiceData.display_order_id,
        order_id: sampleInvoiceData.order_id,
        items: sampleInvoiceData.items.map(item => ({
          id: item.id, name: item.item_name, price: item.unit_price,
          quantity: item.quantity, tax_rate: item.tax_rate,
          tax_amount: item.tax_amount, total: item.total_amount
        })),
        subtotal: sampleInvoiceData.subtotal, tax_amount: sampleInvoiceData.tax_amount,
        total: sampleInvoiceData.total_amount,
        paymentMethod: sampleInvoiceData.payment_method || 'Cash',
        date: new Date(sampleInvoiceData.invoice_date)
      };
      const pdfDoc = await generateInvoice(invoiceData, settings);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(pdfDoc.output('bloburl') as unknown as string);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const renderColorPicker = (key: string, label: string) => {
    if (!settings) return null;
    const value = (settings as any)[key] || '#000000';
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex items-center">
          <div
            className="w-9 h-9 rounded-md mr-3 border cursor-pointer flex-shrink-0"
            style={{ backgroundColor: value }}
            onClick={() => setShowColorPicker(showColorPicker === key ? null : key)}
          />
          <input type="text" name={key} value={value} onChange={handleInputChange} className="w-28 px-3 py-2 border rounded-md text-sm" />
        </div>
        {showColorPicker === key && (
          <div className="absolute z-10 mt-2">
            <div className="fixed inset-0 z-0" onClick={() => setShowColorPicker(null)} />
            <div className="relative z-10">
              <SketchPicker color={value} onChange={(color) => handleColorChange(color, key)} />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const hasLogo = !!(logoPreview || settings?.company_logo_url);

  return (
    <div className="flex gap-6 h-full">
      <div className={`bg-white rounded-lg shadow p-6 transition-all duration-300 overflow-y-auto ${showPreview ? 'w-1/2' : 'w-full'}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Invoice Settings</h1>
          <div className="flex space-x-2">
            <button onClick={handlePreview} disabled={previewLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center space-x-1 hover:bg-blue-600 transition">
              <Eye size={18} />
              <span>{previewLoading ? 'Generating...' : 'Preview'}</span>
            </button>
            <button onClick={() => guardAction(() => saveSettings())} disabled={saving || isGuest}
              className="px-4 py-2 bg-orange-500 text-white rounded-md flex items-center space-x-1 hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6 flex-wrap">
          {[
            { id: 'company', icon: <Info size={16} />, label: 'Company Info' },
            { id: 'tax', icon: <Coins size={16} />, label: 'Tax Settings' },
            { id: 'content', icon: <Edit3 size={16} />, label: 'Content' },
          ].map(tab => (
            <button key={tab.id}
              className={`px-4 py-2 font-medium ${activeTab === tab.id ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab(tab.id)}>
              <div className="flex items-center space-x-1">{tab.icon}<span>{tab.label}</span></div>
            </button>
          ))}
        </div>

        {/* ========== COMPANY INFO ========== */}
        {activeTab === 'company' && settings && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" name="company_name" value={settings.company_name} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
              </div>

              {renderColorPicker('company_name_color', 'Company Name Color')}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea name="company_address" value={settings.company_address} onChange={handleInputChange} rows={2}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" name="company_phone" value={settings.company_phone || ''} onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="company_email" value={settings.company_email} onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
              </div>

              <div className="flex items-center">
                <input type="checkbox" name="show_restaurant_contact" checked={settings.show_restaurant_contact}
                  onChange={handleInputChange} className="h-4 w-4 text-orange-500" />
                <span className="ml-2 text-sm text-gray-600">Show phone &amp; email on invoice</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Title</label>
                <input type="text" name="receipt_title" value={settings.receipt_title} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                <p className="text-xs text-gray-500 mt-1">e.g., "RECEIPT", "TAX INVOICE"</p>
              </div>
            </div>

            {/* Right column - Logo */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                <div className="border rounded-md p-4 flex flex-col items-center">
                  {hasLogo ? (
                    <>
                      <div className="mb-3 border p-2 rounded-md bg-gray-50">
                        <img src={logoPreview || settings.company_logo_url} alt="Company Logo" className="max-h-28 object-contain" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md inline-flex items-center text-sm">
                          <Image size={14} className="mr-1.5" />
                          <span>Change</span>
                          <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                        </label>
                        <button onClick={() => guardAction(handleDeleteLogo)} disabled={isGuest}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md inline-flex items-center text-sm disabled:opacity-50">
                          <Trash2 size={14} className="mr-1.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 text-gray-400 text-sm">No logo set</div>
                      <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md inline-flex items-center">
                        <Image size={16} className="mr-2" />
                        <span>Upload Logo</span>
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                    </>
                  )}
                  <p className="text-xs text-gray-500 mt-2">PNG or JPG, max 5MB. Remove to free header space.</p>
                </div>
              </div>

              {/* Logo Size - only show when logo exists */}
              {hasLogo && (
                <div className="border rounded-md p-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Logo Size on Invoice (mm)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Width: {settings.logo_width || 30}mm</label>
                      <input type="range" name="logo_width" min="10" max="80" step="1"
                        value={settings.logo_width || 30} onChange={handleInputChange} className="w-full" />
                      <div className="flex justify-between text-xs text-gray-400"><span>10</span><span>80</span></div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Height: {settings.logo_height || 10}mm</label>
                      <input type="range" name="logo_height" min="5" max="40" step="1"
                        value={settings.logo_height || 10} onChange={handleInputChange} className="w-full" />
                      <div className="flex justify-between text-xs text-gray-400"><span>5</span><span>40</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== TAX SETTINGS ========== */}
        {activeTab === 'tax' && settings && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <p className="ml-3 text-sm text-yellow-700">Changes only affect new invoices.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Tax Label</label>
                <input type="text" name="tax_label_1" value={settings.tax_label_1} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500" placeholder="e.g., CGST" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Tax Rate (%)</label>
                <input type="number" name="tax_rate_1" value={settings.tax_rate_1} onChange={handleInputChange}
                  min="0" max="100" step="0.01" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Second Tax Label</label>
                <input type="text" name="tax_label_2" value={settings.tax_label_2} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500" placeholder="e.g., SGST" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Second Tax Rate (%)</label>
                <input type="number" name="tax_rate_2" value={settings.tax_rate_2} onChange={handleInputChange}
                  min="0" max="100" step="0.01" className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            <div className="flex items-center">
              <input type="checkbox" name="include_tax_breakdown" checked={settings.include_tax_breakdown}
                onChange={handleInputChange} className="h-4 w-4 text-orange-500" />
              <span className="ml-2 text-sm text-gray-600">
                Show separate {settings.tax_label_1}/{settings.tax_label_2} breakdown
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-1">Effective Tax Rate</h4>
              <p className="text-lg font-bold text-orange-500">{(settings.tax_rate_1 + settings.tax_rate_2).toFixed(2)}%</p>
              <p className="text-xs text-gray-500 mt-1">{settings.tax_label_1} {settings.tax_rate_1}% + {settings.tax_label_2} {settings.tax_rate_2}%</p>
            </div>
          </div>
        )}

        {/* ========== CONTENT ========== */}
        {activeTab === 'content' && settings && (
          <div className="space-y-6">
            {/* Footer Line 1 - the bold line */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Line 1 (bold)</label>
              <input
                type="text"
                name="footer_line_1"
                value={settings.footer_line_1 ?? '**SAVE PAPER SAVE NATURE !!**'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Shown in bold at the bottom of the invoice. Leave empty to hide.</p>
            </div>

            {/* Footer Line 2 - the normal line */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Line 2</label>
              <input
                type="text"
                name="footer_line_2"
                value={settings.footer_line_2 ?? 'YOU CAN NOW CALL US ON 1800 226344 (TOLL-FREE) FOR QUERIES/COMPLAINTS.'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Shown below line 1. Leave empty to hide.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terms &amp; Conditions</label>
              <textarea name="terms_conditions" value={settings.terms_conditions || ''} onChange={handleInputChange}
                rows={4} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Terms and conditions displayed on invoices" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number Prefix</label>
                <input type="text" name="invoice_prefix" value={settings.invoice_prefix} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="e.g., INV-" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number Suffix</label>
                <input type="text" name="invoice_suffix" value={settings.invoice_suffix} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="e.g., -TB" />
              </div>
            </div>

            <div className="border rounded-md p-4">
              <div className="flex items-center mb-3">
                <input type="checkbox" name="include_qr_code" checked={settings.include_qr_code}
                  onChange={handleInputChange} className="h-4 w-4 text-orange-500" />
                <span className="ml-2 text-sm font-medium text-gray-700">Include QR Code</span>
              </div>
              {settings.include_qr_code && (
                <textarea name="qr_code_content" value={settings.qr_code_content || ''} onChange={handleInputChange}
                  rows={2} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="URL or UPI ID for QR code" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <select name="date_format" value={settings.date_format} onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <option value="dd/MM/yyyy">DD/MM/YYYY (31/12/2025)</option>
                <option value="MM/dd/yyyy">MM/DD/YYYY (12/31/2025)</option>
                <option value="yyyy-MM-dd">YYYY-MM-DD (2025-12-31)</option>
                <option value="dd MMM yyyy">DD MMM YYYY (31 Dec 2025)</option>
                <option value="MMMM dd, yyyy">MMMM DD, YYYY (December 31, 2025)</option>
              </select>
            </div>

            <div className="border-t pt-4">
              <button onClick={() => guardAction(() => {
                setSettings(defaultInvoiceSettings as InvoiceSettings);
                toast.success('Settings reset to defaults (save to apply)');
              })} disabled={isGuest}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50">
                Reset to Default Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right side - Live Preview */}
      {showPreview && previewUrl && (
        <div className="w-1/2 bg-white rounded-lg shadow flex flex-col sticky top-0 h-[calc(100vh-8rem)]">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Eye size={18} /> Invoice Preview
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={handlePreview} disabled={previewLoading}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition disabled:opacity-50">
                {previewLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button onClick={() => { setShowPreview(false); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition">
                Close
              </button>
            </div>
          </div>
          <div className="flex-1 p-2">
            <iframe src={previewUrl} className="w-full h-full rounded border" title="Invoice Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
