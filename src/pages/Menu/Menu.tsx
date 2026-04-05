import React, { useState, useRef } from 'react';
import { useScroll, useSpring, useTransform } from 'framer-motion';
import { motion } from 'framer-motion';
import PageTransition from '../../components/common/PageTransition';
import MenuHeader from './components/MenuHeader';
import MenuGrid from './components/MenuGrid';
import CategorySidebar from './components/CategorySidebar';
import FilterModal from '../../components/menu/FilterModal';
import { useMenuFilters } from './hooks/useMenuFilters';

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
    isLoading
  } = useMenuFilters();

  // Header animation
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const y = useSpring(scrollY, springConfig);
  const headerY = useTransform(y, [0, 200], [0, -50]);
  const headerOpacity = useTransform(y, [0, 100], [1, 0]);

  if (isLoading) {
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
          selectedCategories={filters.selectedCategories}
          sortBy={filters.sortBy}
          onApply={(applied) => setFilters(applied)}
          onReset={() => setFilters({ priceRange: [0, 2000], selectedCategories: [], sortBy: 'popular' })}
        />
      </div>
    </PageTransition>
  );
}

export default Menu;