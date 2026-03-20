import React from 'react';
import { useScroll } from 'framer-motion';
import PageTransition from '../../components/common/PageTransition';
import MenuHeader from './components/MenuHeader';
import MenuGrid from './components/MenuGrid';
import CategorySelector from './components/CategorySelector';
import FilterModal from '../../components/menu/FilterModal';
import { useMenuFilters } from './hooks/useMenuFilters';
import { useHeaderAnimation } from './hooks/useHeaderAnimation';

function Menu() {
  const { scrollY } = useScroll();
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);
  const { headerY, headerOpacity } = useHeaderAnimation(scrollY);

  const {
    searchQuery,
    setSearchQuery,
    quickCategory,
    setQuickCategory,
    filters,
    setFilters,
    filteredItems,
    menuItems
  } = useMenuFilters();

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <MenuHeader
          style={{ y: headerY, opacity: headerOpacity }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterClick={() => setIsFilterModalOpen(true)}
        />

        <div className="container mx-auto px-4 py-6">
          <CategorySelector
            categories={Array.from(new Set(menuItems.map(item => item.category)))}
            selectedCategory={quickCategory}
            onSelectCategory={setQuickCategory}
          />
          
          <div className="mt-6">
            <MenuGrid items={filteredItems} />
          </div>
        </div>

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          priceRange={filters.priceRange}
          setPriceRange={(range) => setFilters({ ...filters, priceRange: range })}
          selectedCategories={filters.selectedCategories}
          setSelectedCategories={(categories) => setFilters({ ...filters, selectedCategories: categories })}
          sortBy={filters.sortBy}
          setSortBy={(sort) => setFilters({ ...filters, sortBy: sort })}
          spiceLevels={filters.spiceLevels}
          setSpiceLevels={(levels) => setFilters({ ...filters, spiceLevels: levels })}
          dietaryTags={filters.dietaryTags}
          setDietaryTags={(tags) => setFilters({ ...filters, dietaryTags: tags })}
        />
      </div>
    </PageTransition>
  );
}

export default Menu;