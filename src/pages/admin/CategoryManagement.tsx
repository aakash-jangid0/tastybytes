import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Move } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Category } from '../../types/category'; // Import the Category type
import IconSelector from '../../components/admin/IconSelector';
import DynamicIcon from '../../components/ui/DynamicIcon';
import { useGuestGuard } from '../../hooks/useGuestGuard';

const API_BASE_URL = 'http://localhost:5000/api';

function CategoryManagement() {
  const { isGuest, guardAction } = useGuestGuard();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    display_order: 0,
    icon: 'Grid' // Default icon
  });

  // Fetch categories from the API on component mount
  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // Check network connectivity first
      if (!navigator.onLine) {
        throw new Error('You are offline. Please check your internet connection.');
      }
      
      const response = await fetch(`${API_BASE_URL}/categories`)
        .catch(error => {
          throw new Error(`Network error: Failed to connect to server. Please check if the server is running.`);
        });
        
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      
      if (error.message.includes('Failed to connect') || error.message.includes('offline')) {
        toast.error('Network error: Please check your connection and try again', {
          duration: 5000,
        });
      } else {
        toast.error(`Failed to load categories: ${error.message}`, {
          duration: 4000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Check network connectivity first
      if (!navigator.onLine) {
        throw new Error('You are offline. Please check your internet connection.');
      }

      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory 
        ? `${API_BASE_URL}/categories/${editingCategory.id}` 
        : `${API_BASE_URL}/categories`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },        
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
          display_order: formData.display_order,
          icon: formData.icon // Include the icon in the request
        }),
      }).catch(error => {
        throw new Error(`Network error: Failed to connect to server. Please check if the server is running.`);
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (editingCategory) {
        setCategories(categories.map(cat => cat.id === editingCategory.id ? data : cat));
        toast.success('Category updated successfully');
      } else {
        setCategories([...categories, data]);
        toast.success('Category added successfully');
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      resetForm();    } catch (error: any) {
      console.error('Error saving category:', error);
      
      // Show a user-friendly error message
      if (error.message.includes('Failed to connect') || error.message.includes('offline')) {
        toast.error('Network error: Please check your connection and try again', {
          duration: 5000,
        });
      } else if (error.message.includes('A category with this name already exists')) {
        toast.error('A category with this name or slug already exists');
      } else {
        toast.error(`Failed to save category: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? This might affect menu items.')) {
      setIsLoading(true);
      try {
        // Check network connectivity first
        if (!navigator.onLine) {
          throw new Error('You are offline. Please check your internet connection.');
        }
        
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
          method: 'DELETE',
        }).catch(error => {
          throw new Error(`Network error: Failed to connect to server. Please check if the server is running.`);
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        setCategories(categories.filter(cat => cat.id !== id));
        toast.success('Category deleted successfully');
      } catch (error: any) {
        console.error('Error deleting category:', error);
        
        if (error.message.includes('Failed to connect') || error.message.includes('offline')) {
          toast.error('Network error: Please check your connection and try again', {
            duration: 5000,
          });
        } else {
          toast.error(`Failed to delete category: ${error.message || 'Unknown error'}`);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      display_order: category.display_order,
      icon: category.icon || 'Grid' // Use the category's icon or default to Grid
    });
    setIsModalOpen(true);
  };
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      display_order: 0,
      icon: 'Grid'
    });
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const reordered = Array.from(categories);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    
    // Update display order
    const updatedCategories = reordered.map((cat, index) => ({
      ...cat,
      display_order: index
    }));
    
    setCategories(updatedCategories);
    
    // Update display orders in database
    try {
      setIsLoading(true);
      const updatePromises = updatedCategories.map((cat) => 
        fetch(`${API_BASE_URL}/categories/${cat.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: cat.name,
            slug: cat.slug,
            display_order: cat.display_order
          }),
        })
      );
      
      await Promise.all(updatePromises);
      toast.success('Categories reordered successfully');
    } catch (error) {
      console.error('Error updating category order:', error);
      toast.error('Failed to update category order');
      fetchCategories(); // Revert to original order
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Category Management</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => guardAction(() => {
            setEditingCategory(null);
            resetForm();
            setIsModalOpen(true);
          })}
          disabled={isGuest}
          className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </motion.button>
      </div>

      {isLoading && categories.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="divide-y divide-gray-200"
                >
                  {categories.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No categories found. Add a new category to get started.
                    </div>
                  ) : (
                    categories.map((category, index) => (
                      <Draggable 
                        key={category.id} 
                        draggableId={category.id} 
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center justify-between p-4 hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-4">
                              <div {...provided.dragHandleProps} className="cursor-move">
                                <Move className="w-5 h-5 text-gray-400" />
                              </div>                              <div className="flex items-center gap-3">
                                <DynamicIcon 
                                  icon={category.icon || 'Grid'} 
                                  className="w-5 h-5 text-gray-600" 
                                />
                                <div>
                                  <h3 className="font-medium">{category.name}</h3>
                                  <p className="text-sm text-gray-500">Slug: {category.slug}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => guardAction(() => handleEdit(category))}
                                disabled={isGuest}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Pencil className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => guardAction(() => handleDelete(category.id))}
                                disabled={isGuest}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

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
              className="bg-white rounded-lg w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        name: e.target.value,
                        // Auto-generate slug if not edited manually
                        slug: formData.slug === '' || formData.slug === editingCategory?.slug 
                          ? e.target.value.toLowerCase().replace(/\s+/g, '-')
                          : formData.slug
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL friendly name)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="auto-generated-from-name"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to auto-generate from the category name.
                  </p>
                </div>

                <div>
                  <IconSelector 
                    selectedIcon={formData.icon}
                    onSelectIcon={(iconName) => setFormData({ ...formData, icon: iconName })}
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || isGuest}
                  >
                    {isLoading ? 'Saving...' : editingCategory ? 'Update' : 'Add'}
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

export default CategoryManagement;
