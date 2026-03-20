import React, { useState, useRef } from 'react';
import { useScroll, useSpring, useTransform } from 'framer-motion';
import { motion } from 'framer-motion';
import PageTransition from '../../components/common/PageTransition';
import MenuHeader from './components/MenuHeader';
import MenuGrid from './components/MenuGrid';
import CategorySidebar from './components/CategorySidebar';
import FilterModal from '../../components/menu/FilterModal';
import { useMenuFilters } from './hooks/useMenuFilters';
import { useMenuItems } from './hooks/useMenuItems';

function Menu() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    quickCategory,
    setQuickCategory,
    filters,
    setFilters,
    filteredItems,
    isLoading: filtersLoading
  } = useMenuFilters();

  const { menuItems, isLoading: menuItemsLoading } = useMenuItems();

  // Header animation
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const y = useSpring(scrollY, springConfig);
  const headerY = useTransform(y, [0, 200], [0, -50]);
  const headerOpacity = useTransform(y, [0, 100], [1, 0]);

  if (filtersLoading || menuItemsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen" ref={scrollRef}>
        <MenuHeader
          style={{ y: headerY, opacity: headerOpacity }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterClick={() => setIsFilterModalOpen(true)}
        />

        <div className="flex">
          <CategorySidebar
            selectedCategory={quickCategory}
            onSelectCategory={setQuickCategory}
          />

          <div className="flex-1 container mx-auto px-4 py-8">
            <MenuGrid items={filteredItems} />
          </div>
        </div>

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          priceRange={filters.priceRange}
          setPriceRange={(range) => setFilters({...filters, priceRange: range})}
          selectedCategories={filters.selectedCategories}
          setSelectedCategories={(categories) => setFilters({...filters, selectedCategories: categories})}
          sortBy={filters.sortBy}
          setSortBy={(sort) => setFilters({...filters, sortBy: sort})}
          spiceLevels={filters.spiceLevels}
          setSpiceLevels={(levels) => setFilters({...filters, spiceLevels: levels})}
          dietaryTags={filters.dietaryTags}
          setDietaryTags={(tags) => setFilters({...filters, dietaryTags: tags})}
        />
      </div>
    </PageTransition>
  );
}

export default Menu;