import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Phone, User, Mail, MapPin, Calendar, ShoppingBag,
  Clock, Award, AlertCircle, ChevronDown, ChevronUp, Utensils,
  FileText, Printer
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { viewOrDownloadInvoice } from '../../utils/invoiceUtils';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  order_type: string;
  payment_method: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  order_items: OrderItem[];
}

interface CustomerResult {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  last_visit?: string;
  total_orders: number;
  total_spent: number;
  loyalty_tier?: string;
  visit_frequency?: string;
  favorite_items?: string[];
  favorite_cuisines?: string[];
  spice_preference?: string;
  preferred_dining_time?: string;
  preferred_payment_method?: string;
  dietary_restrictions?: string[];
  status?: string;
}

interface CustomerLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (name: string, phone: string) => void;
}

type TabKey = 'details' | 'orders' | 'preferences';

export default function CustomerLookupModal({ isOpen, onClose, onSelectCustomer }: CustomerLookupModalProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<CustomerResult | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [realOrderCount, setRealOrderCount] = useState(0);
  const [realTotalSpent, setRealTotalSpent] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneInput(value);
    setPhoneError('');
    setNotFound(false);
  };

  const handleSearch = async () => {
    if (!/^[0-9]{10}$/.test(phoneInput)) {
      setPhoneError('Enter a valid 10-digit mobile number');
      return;
    }

    setSearching(true);
    setCustomer(null);
    setOrders([]);
    setRealOrderCount(0);
    setRealTotalSpent(0);
    setNotFound(false);

    try {
      // Lookup customer by phone
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phoneInput)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        setNotFound(true);
        setSearching(false);
        return;
      }

      setCustomer(data);
      setActiveTab('details');

      // Fetch recent orders for this customer
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id, status, payment_status, total_amount, order_type,
          payment_method, created_at, customer_name, customer_phone,
          order_items ( id, name, quantity, price )
        `)
        .eq('customer_id', data.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (orderError) {
        console.error('Error fetching orders:', orderError);
      } else {
        const fetchedOrders = orderData || [];
        setOrders(fetchedOrders);

        // Calculate real order count and total spent from actual orders
        const { count, error: countError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', data.id);

        if (!countError && count !== null) {
          setRealOrderCount(count);
        }

        const { data: spentData, error: spentError } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('customer_id', data.id);

        if (!spentError && spentData) {
          const totalSpent = spentData.reduce((sum, o) => sum + (o.total_amount || 0), 0);
          setRealTotalSpent(totalSpent);
        }
      }
    } catch (err) {
      console.error('Customer lookup error:', err);
      toast.error('Failed to search customer');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSelect = () => {
    if (customer) {
      onSelectCustomer(customer.name, customer.phone || phoneInput);
      toast.success(`Customer "${customer.name}" selected`);
      handleClose();
    }
  };

  const handleClose = () => {
    setPhoneInput('');
    setPhoneError('');
    setCustomer(null);
    setOrders([]);
    setRealOrderCount(0);
    setRealTotalSpent(0);
    setNotFound(false);
    setActiveTab('details');
    setExpandedOrder(null);
    onClose();
  };

  const handleViewInvoice = async (order: Order) => {
    try {
      toast.loading('Loading invoice...', { id: 'invoice-load' });
      await viewOrDownloadInvoice(order.id, order, false);
      toast.dismiss('invoice-load');
    } catch (err) {
      toast.dismiss('invoice-load');
      toast.error('Failed to load invoice');
      console.error('Invoice error:', err);
    }
  };

  const handlePrintInvoice = async (order: Order) => {
    try {
      toast.loading('Preparing print...', { id: 'invoice-print' });
      await viewOrDownloadInvoice(order.id, order, true);
      toast.dismiss('invoice-print');
      toast.success('Invoice downloaded');
    } catch (err) {
      toast.dismiss('invoice-print');
      toast.error('Failed to print invoice');
      console.error('Invoice error:', err);
    }
  };

  const tierColor = (tier?: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-200 text-gray-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'preparing': return 'bg-blue-100 text-blue-700';
      case 'ready': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'details', label: 'Customer Info', icon: <User className="w-4 h-4" /> },
    { key: 'orders', label: 'Order History', icon: <ShoppingBag className="w-4 h-4" /> },
    { key: 'preferences', label: 'Preferences', icon: <Utensils className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleClose}
          data-lenis-prevent
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-orange-500 to-orange-600">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Search className="w-5 h-5" />
                Customer Lookup
              </h2>
              <button onClick={handleClose} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-5 py-4 border-b bg-gray-50">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={handlePhoneChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter 10-digit mobile number"
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm ${
                      phoneError ? 'border-red-400' : 'border-gray-300'
                    }`}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || phoneInput.length < 10}
                  className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1.5"
                >
                  {searching ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>
              {phoneError && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {phoneError}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto" data-lenis-prevent>
              {/* Not found state */}
              {notFound && (
                <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <User className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-medium">No customer found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    No customer registered with <span className="font-medium">{phoneInput}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    A new customer record will be created when the order is placed.
                  </p>
                </div>
              )}

              {/* Customer found */}
              {customer && (
                <>
                  {/* Tab Navigation */}
                  <div className="flex border-b bg-white sticky top-0 z-10">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.key
                            ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="px-5 py-4">
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                      <div className="space-y-4">
                        {/* Name & Tier Badge */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                            <p className="text-sm text-gray-500">
                              Customer since {format(new Date(customer.created_at), 'MMM yyyy')}
                            </p>
                          </div>
                          {customer.loyalty_tier && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${tierColor(customer.loyalty_tier)}`}>
                              <Award className="w-3 h-3 inline mr-1" />
                              {customer.loyalty_tier}
                            </span>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{customer.address}</span>
                            </div>
                          )}
                          {customer.last_visit && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>Last visit: {format(new Date(customer.last_visit), 'dd MMM yyyy, hh:mm a')}</span>
                            </div>
                          )}
                        </div>

                        {/* Stats Grid - Orders & Total Spent (fetched from orders table) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <ShoppingBag className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-blue-700">{realOrderCount}</p>
                            <p className="text-xs text-blue-600">Total Orders</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <span className="text-green-500 text-lg font-bold block">₹</span>
                            <p className="text-lg font-bold text-green-700">{realTotalSpent.toFixed(2)}</p>
                            <p className="text-xs text-green-600">Total Spent</p>
                          </div>
                        </div>

                        {customer.visit_frequency && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Visit frequency: <span className="font-medium capitalize">{customer.visit_frequency}</span></span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                      <div>
                        {orders.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            <p className="font-medium">No orders yet</p>
                            <p className="text-sm">This customer hasn't placed any orders.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 mb-3">
                              Showing last {orders.length} of {realOrderCount} orders
                            </p>
                            {orders.map((order) => (
                              <div key={order.id} className="border rounded-lg overflow-hidden">
                                {/* Order Header */}
                                <button
                                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <p className="text-sm font-medium">#{order.id.slice(-6)}</p>
                                      <p className="text-xs text-gray-500">
                                        {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(order.status)}`}>
                                      {order.status}
                                    </span>
                                    <span className="text-sm font-semibold">₹{order.total_amount.toFixed(2)}</span>
                                    {expandedOrder === order.id ? (
                                      <ChevronUp className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                </button>

                                {/* Expanded Order Items */}
                                <AnimatePresence>
                                  {expandedOrder === order.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-3 pb-3 border-t bg-gray-50">
                                        <div className="flex items-center gap-3 py-2 text-xs text-gray-500">
                                          <span className="capitalize">{order.order_type}</span>
                                          <span>|</span>
                                          <span className="capitalize">{order.payment_method}</span>
                                          <span>|</span>
                                          <span className="capitalize">{order.payment_status === 'completed' || order.payment_status === 'paid' ? 'Paid' : order.payment_status}</span>
                                        </div>
                                        <div className="space-y-1">
                                          {order.order_items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                              <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                              <span className="text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                          ))}
                                        </div>
                                        {/* Invoice Actions */}
                                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleViewInvoice(order);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                            View Invoice
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handlePrintInvoice(order);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                            Download / Print
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                      <div className="space-y-4">
                        {/* Favorite Items */}
                        {customer.favorite_items && customer.favorite_items.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Favorite Items</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {customer.favorite_items.map((item, i) => (
                                <span key={i} className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Favorite Cuisines */}
                        {customer.favorite_cuisines && customer.favorite_cuisines.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Favorite Cuisines</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {customer.favorite_cuisines.map((cuisine, i) => (
                                <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                  {cuisine}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Other Preferences */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
                          {customer.spice_preference && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Spice Level</span>
                              <span className="font-medium capitalize">{customer.spice_preference}</span>
                            </div>
                          )}
                          {customer.preferred_dining_time && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Preferred Time</span>
                              <span className="font-medium capitalize">{customer.preferred_dining_time}</span>
                            </div>
                          )}
                          {customer.preferred_payment_method && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Preferred Payment</span>
                              <span className="font-medium capitalize">{customer.preferred_payment_method}</span>
                            </div>
                          )}
                        </div>

                        {/* Dietary Restrictions */}
                        {customer.dietary_restrictions && customer.dietary_restrictions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {customer.dietary_restrictions.map((restriction, i) => (
                                <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium capitalize">
                                  {restriction}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No preferences fallback */}
                        {!customer.favorite_items?.length && !customer.favorite_cuisines?.length &&
                         !customer.spice_preference && !customer.dietary_restrictions?.length && (
                          <div className="text-center py-8 text-gray-500">
                            <Utensils className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            <p className="font-medium">No preferences yet</p>
                            <p className="text-sm">Preferences are tracked as the customer places more orders.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Empty initial state */}
              {!customer && !notFound && !searching && (
                <div className="flex flex-col items-center justify-center py-12 px-5 text-center text-gray-400">
                  <Phone className="w-10 h-10 mb-3" />
                  <p className="text-sm">Enter a mobile number to search for a customer</p>
                </div>
              )}
            </div>

            {/* Footer with Select button */}
            {customer && (
              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelect}
                  className="px-5 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                >
                  Use This Customer
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
