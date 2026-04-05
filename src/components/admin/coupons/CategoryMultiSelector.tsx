import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import DynamicIcon from '../../ui/DynamicIcon';
import { toast } from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

interface CategoryMultiSelectorProps {
  selectedCategories: number[];
  onSelectCategories: (categories: number[]) => void;
  placeholder?: string;
}

function CategoryMultiSelector({ selectedCategories, onSelectCategories, placeholder }: CategoryMultiSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        // Provide sample categories data for testing/demo if fetch fails
        const sampleCategories = [
          { id: 1, name: 'Pizza', slug: 'pizza', icon: 'Pizza' },
          { id: 2, name: 'Pasta', slug: 'pasta', icon: 'Utensils' },
          { id: 3, name: 'Burgers', slug: 'burgers', icon: 'Burger' },
          { id: 4, name: 'Sides', slug: 'sides', icon: 'Salad' },
          { id: 5, name: 'Desserts', slug: 'desserts', icon: 'IceCream' }
        ];
        setCategories(sampleCategories);
        toast.success('Loaded sample categories for demonstration');
      } else {
        setCategories(data || []);
        
        // If we got an empty array, provide sample data
        if (!data || data.length === 0) {
          const sampleCategories = [
            { id: 1, name: 'Pizza', slug: 'pizza', icon: 'Pizza' },
            { id: 2, name: 'Pasta', slug: 'pasta', icon: 'Utensils' },
            { id: 3, name: 'Burgers', slug: 'burgers', icon: 'Burger' },
            { id: 4, name: 'Sides', slug: 'sides', icon: 'Salad' },
            { id: 5, name: 'Desserts', slug: 'desserts', icon: 'IceCream' }
          ];
          setCategories(sampleCategories);
          toast.success('No categories found. Using sample data.');
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Provide sample data even if everything fails
      const sampleCategories = [
        { id: 1, name: 'Pizza', slug: 'pizza', icon: 'Pizza' },
        { id: 2, name: 'Pasta', slug: 'pasta', icon: 'Utensils' },
        { id: 3, name: 'Burgers', slug: 'burgers', icon: 'Burger' },
        { id: 4, name: 'Sides', slug: 'sides', icon: 'Salad' },
        { id: 5, name: 'Desserts', slug: 'desserts', icon: 'IceCream' }
      ];
      setCategories(sampleCategories);
      toast.error('Failed to load categories. Using sample data instead.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleCategory = (categoryId: number) => {
    if (selectedCategories.includes(categoryId)) {
      onSelectCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      onSelectCategories([...selectedCategories, categoryId]);
    }
  };

  const handleRemoveCategory = (categoryId: number) => {
    onSelectCategories(selectedCategories.filter(id => id !== categoryId));
  };

  const selectedCategoryObjects = categories.filter(category => selectedCategories.includes(category.id));

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedCategoryObjects.map(category => (
          <div key={category.id} className="bg-orange-50 flex items-center text-sm px-2 py-1 rounded-md">
            {category.icon && (
              <DynamicIcon icon={category.icon} className="w-4 h-4 mr-1 text-orange-500" />
            )}
            <span className="mr-1">{category.name}</span>
            <button 
              onClick={() => handleRemoveCategory(category.id)}
              className="text-orange-500 hover:text-orange-700 focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 p-2.5"
          placeholder={placeholder || "Search categories..."}
        />
      </div>

      <div className="mt-3 max-h-60 overflow-y-auto border rounded-lg" data-lenis-prevent>
        {isLoading ? (
          <div className="p-3 text-center text-gray-500">Loading...</div>
        ) : filteredCategories.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredCategories.map(category => (
              <li key={category.id} className="p-3 hover:bg-gray-50">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleToggleCategory(category.id)}
                    className="w-4 h-4 text-orange-500 bg-gray-100 rounded border-gray-300 focus:ring-orange-500"
                  />
                  <div className="ml-3 flex items-center">
                    {category.icon && (
                      <DynamicIcon icon={category.icon} className="w-5 h-5 mr-2 text-gray-500" />
                    )}
                    <span>{category.name}</span>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-3 text-center text-gray-500">No categories found</div>
        )}
      </div>
    </div>
  );
}

export default CategoryMultiSelector;
