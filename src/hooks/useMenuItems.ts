import { useState, useEffect } from 'react';
import { MenuItem } from '../types/menu';
import { supabase } from '../lib/supabase';

// Cache mechanism to avoid refetching data
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
let cachedMenuItems: MenuItem[] | null = null;
let lastFetchTime = 0;

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        // Check if we have valid cached data
        const currentTime = Date.now();
        if (cachedMenuItems && currentTime - lastFetchTime < CACHE_EXPIRY) {
          setMenuItems(cachedMenuItems);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;

        if (data) {
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

          setMenuItems(formattedData);
          cachedMenuItems = formattedData;
          lastFetchTime = currentTime;
        }
        setError(null);
      } catch (err: unknown) {
        console.error('Error fetching menu items:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu items';
        setError(errorMessage);
        setMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  return { menuItems, isLoading, error };
}
