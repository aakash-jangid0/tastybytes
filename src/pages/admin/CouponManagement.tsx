import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash, Tag, X, AlertTriangle, Calendar, Coins, Percent, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import CouponStats from '../../components/admin/coupons/CouponStats';
import CouponAnalytics from '../../components/admin/coupons/CouponAnalytics';
import CouponFilterBar from '../../components/admin/coupons/CouponFilterBar';
import ItemSelector from '../../components/admin/coupons/ItemSelector';
import CategoryMultiSelector from '../../components/admin/coupons/CategoryMultiSelector';
import BatchActions from '../../components/admin/coupons/BatchActions';
import { useGuestGuard } from '../../hooks/useGuestGuard';

interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  start_date: string;
  expiry_date: string;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  description: string | null;
  applies_to: 'all' | 'specific_items' | 'specific_categories';
  eligible_items?: number[] | null;
  eligible_categories?: number[] | null;
  created_at?: string;
}

interface CouponFormData {
  id?: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  start_date: string;
  expiry_date: string;
  usage_limit: number | null;
  is_active: boolean;
  description: string;
  applies_to: 'all' | 'specific_items' | 'specific_categories';
  eligible_items?: number[] | null;
  eligible_categories?: number[] | null;
}

function CouponManagement() {
  const { isGuest, guardAction } = useGuestGuard();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponFormData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedCoupons, setSelectedCoupons] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all'
  });  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: null,
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    usage_limit: null,
    is_active: true,
    description: '',
    applies_to: 'all',
    eligible_items: [],
    eligible_categories: []
  });
  useEffect(() => {
    fetchCoupons();
  }, []);
  
  // Filter coupons when search query or filters change
  useEffect(() => {
    if (!coupons.length) return;
    
    let result = [...coupons];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        coupon => 
          coupon.code.toLowerCase().includes(query) || 
          (coupon.description && coupon.description.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      const now = new Date();
      
      if (filters.status === 'active') {
        result = result.filter(
          coupon => coupon.is_active && new Date(coupon.expiry_date) > now
        );
      } else if (filters.status === 'inactive') {
        result = result.filter(coupon => !coupon.is_active);
      } else if (filters.status === 'expired') {
        result = result.filter(
          coupon => new Date(coupon.expiry_date) <= now
        );
      }
    }
    
    // Apply type filter
    if (filters.type !== 'all') {
      result = result.filter(coupon => coupon.discount_type === filters.type);
    }
    
    setFilteredCoupons(result);
  }, [coupons, searchQuery, filters]);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCoupons(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setError('Failed to fetch coupons. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number inputs
    if (type === 'number') {
      const numberValue = value === '' ? null : parseFloat(value);
      setFormData({ ...formData, [name]: numberValue });
      return;
    }

    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
      return;
    }

    // Handle all other inputs
    setFormData({ ...formData, [name]: value });
  };
  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 0,
      max_discount_amount: null,
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      usage_limit: null,
      is_active: true,
      description: '',
      applies_to: 'all',
      eligible_items: [],
      eligible_categories: []
    });
    setSelectedItems([]);
    setSelectedCategories([]);
    setEditingCoupon(null);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    // Format dates for form inputs
    const startDate = new Date(coupon.start_date).toISOString().split('T')[0];
    const expiryDate = new Date(coupon.expiry_date).toISOString().split('T')[0];

    setEditingCoupon({
      ...coupon,
      start_date: startDate,
      expiry_date: expiryDate,
      description: coupon.description || ''
    });
    
    setFormData({
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount,
      start_date: startDate,
      expiry_date: expiryDate,
      usage_limit: coupon.usage_limit,
      is_active: coupon.is_active,
      description: coupon.description || '',
      applies_to: coupon.applies_to
    });
    
    setSelectedItems(coupon.eligible_items || []);
    setSelectedCategories(coupon.eligible_categories || []);
    
    setShowForm(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validation
      if (!formData.code) {
        toast.error('Coupon code is required');
        return;
      }
      
      if (formData.discount_value <= 0) {
        toast.error('Discount value must be greater than 0');
        return;
      }
      
      if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
        toast.error('Percentage discount cannot exceed 100%');
        return;
      }
      
      if (new Date(formData.start_date) > new Date(formData.expiry_date)) {
        toast.error('Expiry date must be after start date');
        return;
      }
      
      if (formData.applies_to === 'specific_items' && selectedItems.length === 0) {
        toast.error('Please select at least one item for the coupon');
        return;
      }
      
      if (formData.applies_to === 'specific_categories' && selectedCategories.length === 0) {
        toast.error('Please select at least one category for the coupon');
        return;
      }
      
      let result;
      
      if (editingCoupon) {
        // Update existing coupon
        const { data, error } = await supabase
          .from('coupons')
          .update({
            code: formData.code.toUpperCase(),
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            min_order_amount: formData.min_order_amount,
            max_discount_amount: formData.max_discount_amount,
            start_date: formData.start_date,
            expiry_date: formData.expiry_date,
            usage_limit: formData.usage_limit,
            is_active: formData.is_active,
            description: formData.description,
            applies_to: formData.applies_to,
            eligible_items: selectedItems.length > 0 ? selectedItems : null,
            eligible_categories: selectedCategories.length > 0 ? selectedCategories : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCoupon.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        toast.success('Coupon updated successfully');
      } else {
        // Create new coupon
        const { data, error } = await supabase
          .from('coupons')
          .insert({
            code: formData.code.toUpperCase(),
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            min_order_amount: formData.min_order_amount,
            max_discount_amount: formData.max_discount_amount,
            start_date: formData.start_date,
            expiry_date: formData.expiry_date,
            usage_limit: formData.usage_limit,
            is_active: formData.is_active,
            description: formData.description,
            applies_to: formData.applies_to,
            eligible_items: selectedItems.length > 0 ? selectedItems : null,
            eligible_categories: selectedCategories.length > 0 ? selectedCategories : null,
            usage_count: 0
          })
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        toast.success('Coupon created successfully');
      }
      
      // Update the local state
      if (editingCoupon) {
        setCoupons(prevCoupons => 
          prevCoupons.map(coupon => 
            coupon.id === result.id ? result : coupon
          )
        );
      } else {
        setCoupons(prevCoupons => [result, ...prevCoupons]);
      }
      
      // Reset form and close it
      resetForm();
      setShowForm(false);
      
    } catch (err: unknown) {
      console.error('Error saving coupon:', err);
      
      if (err instanceof Error && (err.message.includes('duplicate') || err.message.includes('unique'))) {
        toast.error('A coupon with this code already exists');
      } else {
        toast.error('Failed to save coupon');
      }
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setCoupons(prevCoupons => prevCoupons.filter(coupon => coupon.id !== id));
      toast.success('Coupon deleted successfully');
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('Failed to delete coupon');
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    return coupon.discount_type === 'percentage' 
      ? `${coupon.discount_value}% off`
      : `₹${coupon.discount_value} off`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Coupon Management</h1>
        <button
          onClick={() => guardAction(() => {
            resetForm();
            setShowForm(true);
          })}
          disabled={isGuest}
          className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Coupon
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            <p className="text-yellow-700">{error}</p>
          </div>
        </div>
      )}

      {/* Coupon Stats */}
      <CouponStats coupons={coupons} />
      
      {/* Coupon Analytics */}
      <CouponAnalytics coupons={coupons} />
      
      {/* Coupon Filter Bar */}
      <CouponFilterBar 
        onSearch={setSearchQuery}
        onFilterChange={setFilters}
      />

      {/* Bulk selection */}
      {coupons.length > 0 && (
        <div className="flex items-center mb-4 bg-white p-3 rounded-lg shadow">
          <input
            type="checkbox"
            checked={selectedCoupons.length === coupons.length && coupons.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCoupons(coupons.map(c => c.id));
              } else {
                setSelectedCoupons([]);
              }
            }}
            className="mr-2 w-4 h-4 text-orange-500 bg-gray-100 rounded border-gray-300 focus:ring-orange-500"
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm text-gray-700 mr-4">Select All</label>
          
          <div className="text-sm text-gray-500">
            {selectedCoupons.length > 0 ? (
              <span>{selectedCoupons.length} of {coupons.length} selected</span>
            ) : (
              <span>0 selected</span>
            )}
          </div>
          
          {selectedCoupons.length > 0 && (
            <button
              onClick={() => setSelectedCoupons([])}
              className="ml-4 text-sm text-gray-700 hover:text-orange-500"
            >
              Clear selection
            </button>
          )}
          
          <div className="ml-auto flex items-center">
            <button
              onClick={() => window.print()}
              className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white p-6 rounded-lg shadow"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Code*
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="SUMMER20"
                    className="pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Will be converted to uppercase automatically
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Summer sale discount"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type*
                </label>
                <div className="relative">
                  {formData.discount_type === 'percentage' ? (
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  ) : (
                    <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  )}
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value*
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    min="0"
                    step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                    {formData.discount_type === 'percentage' ? '%' : '₹'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Order Amount
                </label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    name="min_order_amount"
                    value={formData.min_order_amount === null ? '' : formData.min_order_amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {formData.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Discount Amount
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="max_discount_amount"
                      value={formData.max_discount_amount === null ? '' : formData.max_discount_amount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="No limit"
                      className="pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date*
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date*
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  name="usage_limit"
                  value={formData.usage_limit === null ? '' : formData.usage_limit}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  placeholder="Unlimited"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank for unlimited</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Applies To*
                </label>
                <select
                  name="applies_to"
                  value={formData.applies_to}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="all">All Items</option>
                  <option value="specific_items">Specific Items</option>
                  <option value="specific_categories">Specific Categories</option>
                </select>
              </div>
            </div>

            {formData.applies_to === 'specific_items' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eligible Items
                </label>
                <ItemSelector
                  selectedItems={selectedItems}
                  onSelectItems={setSelectedItems}
                  placeholder="Select eligible items"
                />
              </div>
            )}

            {formData.applies_to === 'specific_categories' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eligible Categories
                </label>
                <CategoryMultiSelector
                  selectedCategories={selectedCategories}
                  onSelectCategories={setSelectedCategories}
                  placeholder="Select eligible categories"
                />
              </div>
            )}

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGuest}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid gap-4">
        {filteredCoupons.map((coupon) => (
          <motion.div
            key={coupon.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedCoupons.includes(coupon.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCoupons([...selectedCoupons, coupon.id]);
                    } else {
                      setSelectedCoupons(selectedCoupons.filter(id => id !== coupon.id));
                    }
                  }}
                  className="mr-3 mt-1 w-4 h-4 text-orange-500 bg-gray-100 rounded border-gray-300 focus:ring-orange-500"
                />
                <div>
                  <div className="flex items-center mb-1">
                    <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded mr-2">
                      {isGuest ? '••••••••' : coupon.code}
                    </span>
                    <span className={`text-sm font-medium px-2.5 py-0.5 rounded ${
                      coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium">
                    {formatDiscount(coupon)}
                    {coupon.min_order_amount ? ` on orders over ₹${coupon.min_order_amount}` : ''}
                  </h3>
                  {coupon.description && <p className="text-gray-600">{coupon.description}</p>}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => guardAction(() => handleEditCoupon(coupon))}
                  disabled={isGuest}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => guardAction(() => handleDeleteCoupon(coupon.id))}
                  disabled={isGuest}
                  className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-gray-500">Valid period:</span>
                <div>
                  {new Date(coupon.start_date).toLocaleDateString()} - {new Date(coupon.expiry_date).toLocaleDateString()}
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Usage:</span> 
                <div>
                  {coupon.usage_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''}
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Applies to:</span>
                <div>
                  {coupon.applies_to === 'all' && 'All items'}
                  {coupon.applies_to === 'specific_items' && 'Specific items'}
                  {coupon.applies_to === 'specific_categories' && 'Specific categories'}
                </div>
              </div>
              
              {coupon.discount_type === 'percentage' && coupon.max_discount_amount && (
                <div>
                  <span className="text-gray-500">Max discount:</span>
                  <div>₹{coupon.max_discount_amount}</div>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {filteredCoupons.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No coupons found</p>
          </div>
        )}
      </div>

      {/* Batch Actions */}
      <BatchActions 
        selectedCoupons={selectedCoupons}
        onClearSelection={() => setSelectedCoupons([])}
        onCouponsUpdated={fetchCoupons}
      />
    </div>
  );
}

export default CouponManagement;
