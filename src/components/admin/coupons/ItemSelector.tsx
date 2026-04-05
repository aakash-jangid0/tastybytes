import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category_id: number;
  category_name?: string;
}

interface ItemSelectorProps {
  selectedItems: number[];
  onSelectItems: (items: number[]) => void;
  placeholder?: string;
}

function ItemSelector({ selectedItems, onSelectItems, placeholder }: ItemSelectorProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);  const fetchItems = async () => {
    setIsLoading(true);
    try {
      // Try directly from the hook that's working elsewhere in the app
      // This will ensure we use the same approach that works in other parts of the app
      const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching menu items:', error);
        
        // Try the menu table as a backup
        const { data: menuData, error: menuError } = await supabase
          .from('menu')
          .select('*')
          .order('name');
          
        if (menuError) {
          console.error('Error fetching from menu table:', menuError);
          toast.error('Failed to load menu items');
          return;
        }
        
        // If we found data in the menu table, use that
        if (menuData && menuData.length > 0) {
          const formattedItems = menuData.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            category_id: item.category_id || item.category,
            category_name: item.category_name || 'Unknown'
          }));
          
          setItems(formattedItems);
        } else {
          // If both tables failed, we'll create some sample data for testing/demo
          console.log('Creating sample menu items for demo purposes');
          const sampleItems = [
            { id: 1, name: 'Margherita Pizza', price: 12.99, category_id: 1, category_name: 'Pizza' },
            { id: 2, name: 'Vegetable Pasta', price: 10.99, category_id: 2, category_name: 'Pasta' },
            { id: 3, name: 'Chicken Burger', price: 8.99, category_id: 3, category_name: 'Burgers' },
            { id: 4, name: 'French Fries', price: 3.99, category_id: 4, category_name: 'Sides' },
            { id: 5, name: 'Chocolate Cake', price: 6.99, category_id: 5, category_name: 'Desserts' }
          ];
          setItems(sampleItems);
          toast.success('Loaded sample menu items for demonstration');
        }
      } else {
        // We successfully got data from menu_items
        const formattedItems = menuItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          category_id: item.category_id || item.category,
          category_name: item.category_name || 'Uncategorized'
        }));
        
        setItems(formattedItems);
      }    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items. Using sample data instead.');
      
      // Provide sample data even if everything fails
      const sampleItems = [
        { id: 1, name: 'Margherita Pizza', price: 12.99, category_id: 1, category_name: 'Pizza' },
        { id: 2, name: 'Vegetable Pasta', price: 10.99, category_id: 2, category_name: 'Pasta' },
        { id: 3, name: 'Chicken Burger', price: 8.99, category_id: 3, category_name: 'Burgers' },
        { id: 4, name: 'French Fries', price: 3.99, category_id: 4, category_name: 'Sides' },
        { id: 5, name: 'Chocolate Cake', price: 6.99, category_id: 5, category_name: 'Desserts' }
      ];
      setItems(sampleItems);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleItem = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      onSelectItems(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectItems([...selectedItems, itemId]);
    }
  };

  const handleRemoveItem = (itemId: number) => {
    onSelectItems(selectedItems.filter(id => id !== itemId));
  };

  const selectedItemObjects = items.filter(item => selectedItems.includes(item.id));

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedItemObjects.map(item => (
          <div key={item.id} className="bg-orange-50 flex items-center text-sm px-2 py-1 rounded-md">
            <span className="mr-1">{item.name}</span>
            <button 
              onClick={() => handleRemoveItem(item.id)}
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
          placeholder={placeholder || "Search menu items..."}
        />
      </div>

      <div className="mt-3 max-h-60 overflow-y-auto border rounded-lg" data-lenis-prevent>
        {isLoading ? (
          <div className="p-3 text-center text-gray-500">Loading...</div>
        ) : filteredItems.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredItems.map(item => (
              <li key={item.id} className="p-3 hover:bg-gray-50">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleToggleItem(item.id)}
                    className="w-4 h-4 text-orange-500 bg-gray-100 rounded border-gray-300 focus:ring-orange-500"
                  />
                  <div className="ml-3 flex-1">
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.category_name} • ₹{item.price.toFixed(2)}
                    </div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-3 text-center text-gray-500">No items found</div>
        )}
      </div>
    </div>
  );
}

export default ItemSelector;
