import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Mail, Printer, Calendar, Coins, FileText, Edit, Save, X, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Invoice } from '../../types/invoice';
import { emailInvoice, printInvoice, viewOrDownloadInvoice } from '../../utils/invoiceUtils';
import { useGuestGuard } from '../../hooks/useGuestGuard';

export default function InvoiceManagement() {
  const { isGuest, guardAction } = useGuestGuard();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailError, setEmailError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<string | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const dateFilterRef = useRef<HTMLDivElement>(null);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    billing_address: '',
    notes: ''
  });
  
  // Function to view or download invoice using the unified approach
  const handleViewOrDownloadInvoice = async (invoice: Invoice, download = false) => {
    try {
      // Create an order-like object from invoice data for compatibility
      const orderData = {
        id: invoice.order_id,
        customer_name: invoice.customer_name,
        total_amount: invoice.subtotal,
        payment_method: invoice.payment_method,
        items: invoice.items.map(item => ({
          id: item.id,
          name: item.item_name,
          price: item.unit_price,
          quantity: item.quantity,
          notes: ''
        }))
      };

      await viewOrDownloadInvoice(invoice.order_id, orderData, download);
      
      if (download) {
        toast.success('Invoice downloaded successfully');
      }
    } catch (error) {
      console.error(`Error ${download ? 'downloading' : 'viewing'} invoice:`, error);
      toast.error(`Failed to ${download ? 'download' : 'view'} invoice`);
    }
  };

  const setupRealtimeSubscription = useCallback(() => {
    const subscription = supabase
      .channel('invoice_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchInvoices();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchInvoices();
    const unsubscribe = setupRealtimeSubscription();

    // Close date filter when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setShowDateFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      unsubscribe();
    };
  }, [setupRealtimeSubscription]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;
      
      // Make sure items are properly loaded for each invoice
      const processedInvoices = [];
      for (const invoice of invoicesData || []) {
        // If items is null or empty, try to fetch them separately
        if (!invoice.items || invoice.items.length === 0) {
          const { data: items } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoice.id);
          
          invoice.items = items || [];
        }
        processedInvoices.push(invoice);
      }
      
      setInvoices(processedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice.id);
    setEditForm({
      customer_name: invoice.customer_name,
      customer_phone: invoice.customer_phone || '',
      customer_email: invoice.customer_email || '',
      billing_address: invoice.billing_address || '',
      notes: invoice.notes || ''
    });
  };

  const handleSaveEdit = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          customer_name: editForm.customer_name,
          customer_phone: editForm.customer_phone,
          customer_email: editForm.customer_email,
          billing_address: editForm.billing_address,
          notes: editForm.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      toast.success('Invoice updated successfully');
      setEditingInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    }
  };

  const handleEmailInvoice = async (invoice: Invoice) => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailAddress.trim() || !emailRegex.test(emailAddress)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setEmailError('');
      toast.loading('Sending invoice...');
      await emailInvoice(invoice, emailAddress);
      toast.dismiss();
      toast.success('Invoice sent successfully');
      setEmailModalOpen(false);
      setEmailAddress('');
      setSelectedInvoice(null);
    } catch (error) {
      toast.dismiss();
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
  };

  const handleSetDateRange = (start: Date | null, end: Date | null) => {
    setDateRange([start, end]);
    setShowDateFilter(false);
  };

  const clearDateFilter = () => {
    setDateRange([null, null]);
    setShowDateFilter(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    
    const matchesDateRange = 
      !dateRange[0] || !dateRange[1] ||
      (new Date(invoice.created_at) >= dateRange[0] &&
       new Date(invoice.created_at) <= dateRange[1]);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoice Management</h1>
        <div className="flex gap-4 flex-wrap">
          <Link
            to="/admin/invoice-settings"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Customize Templates
          </Link>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <Calendar className="w-5 h-5 text-gray-400" />
              {dateRange[0] && dateRange[1] 
                ? `${format(dateRange[0], 'MM/dd/yyyy')} - ${format(dateRange[1], 'MM/dd/yyyy')}`
                : 'Date Range'}
            </button>
            
            {showDateFilter && (
              <div 
                ref={dateFilterRef}
                className="absolute top-full mt-2 p-4 bg-white shadow-lg rounded-lg z-10 w-64"
              >
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      value={dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null;
                        setDateRange([date, dateRange[1]]);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      value={dateRange[1] ? format(dateRange[1], 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null;
                        setDateRange([dateRange[0], date]);
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <button 
                      onClick={clearDateFilter}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={() => handleSetDateRange(dateRange[0], dateRange[1])}
                      className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredInvoices.map((invoice) => (
                  <React.Fragment key={invoice.id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="font-medium">{invoice.invoice_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingInvoice === invoice.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.customer_name}
                              onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                              placeholder="Customer Name"
                            />
                            <input
                              type="tel"
                              value={editForm.customer_phone}
                              onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                              placeholder="Phone"
                            />
                            <input
                              type="email"
                              value={editForm.customer_email}
                              onChange={(e) => setEditForm({ ...editForm, customer_email: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                              placeholder="Email"
                            />
                            <input
                              type="text"
                              value={editForm.billing_address}
                              onChange={(e) => setEditForm({ ...editForm, billing_address: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                              placeholder="Address"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900">{invoice.customer_name}</div>
                            {invoice.customer_phone && (
                              <div className="text-gray-500">{invoice.customer_phone}</div>
                            )}
                            {invoice.customer_email && (
                              <div className="text-gray-500">{invoice.customer_email}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(invoice.created_at), 'dd MMM yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-medium">
                          <Coins className="w-4 h-4 text-gray-400" />
                          ₹{invoice.total_amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          {editingInvoice === invoice.id ? (
                            <>
                              <button
                                onClick={() => guardAction(() => handleSaveEdit(invoice.id))}
                                disabled={isGuest}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Save changes"
                              >
                                <Save className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setEditingInvoice(null)}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel editing"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => guardAction(() => handleEditInvoice(invoice))}
                                disabled={isGuest}
                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit invoice"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleViewOrDownloadInvoice(invoice, false)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View invoice"
                              >
                                <FileText className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleViewOrDownloadInvoice(invoice, true)}
                                className="text-green-600 hover:text-green-900"
                                title="Download invoice"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => guardAction(() => {
                                  setSelectedInvoice(invoice);
                                  setEmailAddress(invoice.customer_email || '');
                                  setEmailError('');
                                  setEmailModalOpen(true);
                                })}
                                disabled={isGuest}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Email invoice"
                              >
                                <Mail className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => printInvoice(invoice)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Print invoice"
                              >
                                <Printer className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  </React.Fragment>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Modal */}
      <AnimatePresence>
        {emailModalOpen && selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold mb-4">Send Invoice</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => {
                    setEmailAddress(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="Enter email address"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                    emailError ? 'border-red-500' : ''
                  }`}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-500">{emailError}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEmailModalOpen(false);
                    setEmailAddress('');
                    setEmailError('');
                    setSelectedInvoice(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => guardAction(() => handleEmailInvoice(selectedInvoice))}
                  disabled={isGuest}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}