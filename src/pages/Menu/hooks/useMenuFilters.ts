import { useState, useMemo } from 'react';
import { MenuItem } from '../../../types/menu';
import { useMenuItems } from './useMenuItems';

export interface MenuFilters {
  priceRange: [number, number];
  selectedCategories: string[];
  sortBy: string;
}

export function useMenuFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCategory, setQuickCategory] = useState('all');
  const [filters, setFilters] = useState<MenuFilters>({
    priceRange: [0, 2000],
    selectedCategories: [],
    sortBy: 'popular',
  });

  // Get menu items from Supabase
  const { menuItems, isLoading } = useMenuItems();

  const filteredItems = useMemo(() => {
    // Helper function to sort the filtered items
    const sortItems = (items: MenuItem[], sortBy: string) => {
      switch (sortBy) {
        case 'priceAsc':
          return [...items].sort((a, b) => a.price - b.price);
        case 'priceDesc':
          return [...items].sort((a, b) => b.price - a.price);
        case 'nameAsc':
          return [...items].sort((a, b) => a.name.localeCompare(b.name));
        case 'nameDesc':
          return [...items].sort((a, b) => b.name.localeCompare(a.name));
        default:
          return items;
      }
    };

    // Apply all filters
    const filtered = menuItems.filter(item => {
      // Text search filter
      const matchesSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Quick category selector filter
      const matchesCategory = quickCategory === 'all' || item.category === quickCategory;

      // Price range filter
      const matchesPrice = item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1];

      // Category filter from modal
      const matchesSelectedCategories = filters.selectedCategories.length === 0 ||
                                      filters.selectedCategories.includes(item.category);

      return matchesSearch && matchesCategory && matchesPrice && matchesSelectedCategories;
    });

    // Then apply sorting
    return sortItems(filtered, filters.sortBy);
  }, [searchQuery, quickCategory, filters, menuItems]);

  return {
    searchQuery,
    setSearchQuery,
    quickCategory,
    setQuickCategory,
    filters,
    setFilters,
    filteredItems,
    menuItems,
    isLoading
  };
}