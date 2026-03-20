import { useState, useEffect, useRef } from 'react';
import { MenuItem } from '../../../types/menu';
import { supabase } from '../../../lib/supabase';

// Cache duration in milliseconds (20 minutes)
const CACHE_DURATION = 20 * 60 * 1000;

// Function to format data from API response
const formatMenuItems = (data: any[]): MenuItem[] => {
  return data.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    image: item.image,
    category: item.category,
    preparationTime: item.preparation_time,
    isAvailable: item.is_available
  }));
};

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use this ref to avoid state updates after component unmount
  const isMounted = useRef(true);
  
  useEffect(() => {
    // Set up the abort controller
    const abortController = new AbortController();
    const cacheKey = 'menuItems_cache_v2';
    
    // Reset mounted state on mount
    isMounted.current = true;
    
    // Function to safely update state (only if component is mounted)
    const safeSetMenuItems = (items: MenuItem[]) => {
      if (isMounted.current && items?.length > 0) {
        setMenuItems(items);
        setIsLoading(false);
      }
    };

    // Function to fetch data from API
    const fetchFromAPI = async () => {
      try {
        console.log('Fetching fresh menu items from database...');
        
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .abortSignal(abortController.signal);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formattedData = formatMenuItems(data);
          
          // Update cache immediately
          localStorage.setItem(cacheKey, JSON.stringify({
            items: formattedData,
            timestamp: Date.now()
          }));
          
          console.log('Fresh menu items loaded:', formattedData.length);
          safeSetMenuItems(formattedData);
          setError(null);
          return formattedData;
        }
        return null;
      } catch (err: any) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching menu items:', err);
          setError(err.message || 'Failed to fetch menu items');
        }
        return null;
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    // Initial loading strategy
    const initializeData = async () => {
      // First try to get data from cache immediately
      try {
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          const { items, timestamp } = JSON.parse(cachedData);
          const isValid = Date.now() - timestamp < CACHE_DURATION;
          
          if (isValid && items && items.length > 0) {
            console.log('Using cached menu items');
            safeSetMenuItems(items);
            
            // No need to wait - start API fetch immediately
            fetchFromAPI();
            return;
          }
        }
      } catch (e) {
        console.log('Cache error, fetching from API');
      }
      
      // If no valid cache, fetch from API
      await fetchFromAPI();
    };
    
    // Start loading data immediately
    initializeData();
    
    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      abortController.abort();
    };
  }, []);

  return { menuItems, isLoading, error };
}
