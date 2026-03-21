import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, Upload, X, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInView } from 'react-intersection-observer';
// Removed import of mock data
import MenuTable from '../../components/admin/MenuTable';
import CategorySelector from '../../components/admin/CategorySelector';
import MenuStats from '../../components/admin/MenuStats';
import CategoryManager from '../../components/admin/CategoryManager';
import { MenuItem } from '../../types/menu';
import { Category } from '../../types/category';
import { supabase } from '../../lib/supabase';
import * as LucideIcons from 'lucide-react';
import { useGuestGuard } from '../../hooks/useGuestGuard';

const API_BASE_URL = 'http://localhost:5000/api';

const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

function MenuManagement() {
  const { isGuest, guardAction } = useGuestGuard();
  // Initialize with an empty array instead of mock data
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<Category[]>([]);
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const [loadMoreRef, inView] = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    preparationTime: '',
    isAvailable: true,
  });

  // Fetch menu items and categories from the database on component mount
  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  // Function to fetch menu items from the API
  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Map snake_case column names to camelCase for frontend
        const formattedData = data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          category: item.category,
          preparationTime: item.preparation_time,
          isAvailable: item.is_available
        }));
        
        setItems(formattedData);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
      // Don't use mock data fallback, just keep the empty array
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (response.ok) {
        const data = await response.json();
        setDynamicCategories(data);
        
        // Set default category for new items if categories exist
        if (data.length > 0 && !formData.category) {
          setFormData(prev => ({
            ...prev,
            category: data[0].slug
          }));
        }
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredItems = useMemo(() => {
    return selectedCategory === 'all' 
      ? items 
      : items.filter(item => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        description: editingItem.description,
        price: editingItem.price.toString(),
        image: editingItem.image,
        category: editingItem.category,
        preparationTime: editingItem.preparationTime.toString(),
        isAvailable: editingItem.isAvailable,
      });
      setImagePreview(editingItem.image);
      // Open the modal when an item is selected for editing
      setIsModalOpen(true);
    }
  }, [editingItem]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setIsLoading(true);
      const optimizedImage = await optimizeImage(file);
      setImagePreview(optimizedImage);
      setFormData(prev => ({ ...prev, image: optimizedImage }));
    } catch (error) {
      toast.error('Failed to process image');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const optimizeImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          const maxWidth = 800;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/webp', 0.8));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleBatchUpdate = async (updates: Partial<MenuItem>[]) => {
    setIsLoading(true);
    try {
      const chunkSize = 10;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        await Promise.all(chunk.map(update => 
          new Promise(resolve => setTimeout(resolve, 100))
        ));
      }
      toast.success('Items updated successfully');
    } catch (error) {
      toast.error('Failed to update items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (formData.image) {
        await preloadImage(formData.image);
      }

      const newItem: MenuItem = {
        id: editingItem?.id || Date.now().toString(),
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        image: formData.image,
        category: formData.category,
        preparationTime: Number(formData.preparationTime),
        isAvailable: formData.isAvailable,
      };

      if (editingItem) {
        // Update item in Supabase
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: newItem.name,
            description: newItem.description,
            price: newItem.price,
            image: newItem.image,
            category: newItem.category,
            preparation_time: newItem.preparationTime,
            is_available: newItem.isAvailable
          })
          .eq('id', newItem.id);
          
        if (error) throw error;
        
        // Update local state
        setItems(items.map(item => item.id === editingItem.id ? newItem : item));
        toast.success('Item updated successfully');
      } else {
        // Insert new item into Supabase
        const { error } = await supabase
          .from('menu_items')
          .insert([{
            name: newItem.name,
            description: newItem.description,
            price: newItem.price,
            image: newItem.image,
            category: newItem.category,
            preparation_time: newItem.preparationTime,
            is_available: newItem.isAvailable
          }]);
          
        if (error) throw error;
        
        // Refetch to get the new item with the server-generated ID
        fetchMenuItems();
        toast.success('Item added successfully');
      }

      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        image: '',
        category: dynamicCategories.length > 0 ? dynamicCategories[0].slug : 'main',
        preparationTime: '',
        isAvailable: true,
      });
      setImagePreview('');
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast.error(`Failed to save item: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      // Delete from Supabase
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setItems(items.filter(item => item.id !== id));
      toast.success('Item deleted successfully');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(`Failed to delete item: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Find the current item
      const currentItem = items.find(item => item.id === id);
      if (!currentItem) return;
      
      const newStatus = !currentItem.isAvailable;
      
      // Update in Supabase
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setItems(items.map(item => {
        if (item.id === id) {
          toast.success(`Item ${newStatus ? 'enabled' : 'disabled'}`);
          return { ...item, isAvailable: newStatus };
        }
        return item;
      }));
    } catch (error: any) {
      console.error('Error toggling item availability:', error);
      toast.error(`Failed to update item: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => guardAction(() => setShowCategoryManager(!showCategoryManager))}
            disabled={isGuest}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Layers className="w-5 h-5 mr-2" />
            {showCategoryManager ? 'Hide Categories' : 'Manage Categories'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => guardAction(() => {
              setEditingItem(null);
              setFormData({
                name: '',
                description: '',
                price: '',
                image: '',
                category: dynamicCategories.length > 0 ? dynamicCategories[0].slug : '',
                preparationTime: '',
                isAvailable: true,
              });
              setImagePreview('');
              setIsModalOpen(true);
            })}
            disabled={isGuest}
            className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Item
          </motion.button>
        </div>
      </div>

      {/* Category Manager */}
      <AnimatePresence>
        {showCategoryManager && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <CategoryManager onCategoriesChange={setDynamicCategories} />
          </motion.div>
        )}
      </AnimatePresence>

      <MenuStats items={items} />
      <CategorySelector 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={dynamicCategories}
      />
      
      <div ref={scrollParentRef} style={{ height: '600px', overflow: 'auto' }}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = filteredItems[virtualRow.index];
            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <MenuTable
                  items={[item]}
                  onEdit={(item) => guardAction(() => setEditingItem(item))}
                  onDelete={(id) => guardAction(() => handleDelete(id))}
                  onToggleAvailability={(id) => guardAction(() => handleToggleAvailability(id))}
                  selectedCategory={selectedCategory}
                  isGuest={isGuest}
                />
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                    setImagePreview('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <div className="flex flex-col items-center space-y-4">
                    {imagePreview && (
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-orange-500">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-500">
                        Click to upload or drag and drop
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (Rs)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      {dynamicCategories.length > 0 ? (
                        dynamicCategories.map((category) => (
                          <option key={category.id} value={category.slug}>
                            {category.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="main">Main Course</option>
                          <option value="appetizer">Appetizer</option>
                          <option value="dessert">Dessert</option>
                          <option value="beverage">Beverage</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Available</label>
                </div>

                <div className="flex justify-end space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingItem(null);
                      setImagePreview('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isGuest}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingItem ? 'Update' : 'Add'} Item
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MenuManagement;