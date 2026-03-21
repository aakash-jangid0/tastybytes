import React, { useState, useEffect } from 'react';
import { useScroll, motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';
import MenuCard from '../components/menu/MenuCard';
import SearchBar from '../components/common/SearchBar';
import QuickCategorySelector from '../components/menu/QuickCategorySelector';
import FilterModal from '../components/menu/FilterModal';
import { useMenuItems } from '../hooks/useMenuItems';
import { useCategories } from '../hooks/useCategories';
import { StaggerChildren, staggerItemVariants } from '../components/common/ScrollAnimations';

function Menu() {
  const { scrollY } = useScroll();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const scrollThreshold = 50; // Minimum scroll distance before triggering hide/show

  useEffect(() => {
    let rafId: number;
    let lastKnownScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastKnownScrollY);

      if (scrollDifference > scrollThreshold) {
        const newScrollDirection = currentScrollY > lastKnownScrollY ? 'down' : 'up';
        if (newScrollDirection !== scrollDirection) {
          setScrollDirection(newScrollDirection);
          setShowHeader(newScrollDirection === 'up' || currentScrollY < 100);
        }
        lastKnownScrollY = currentScrollY;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [scrollDirection]);

  // Get menu items and categories from Supabase
  const { menuItems, isLoading: isLoadingMenuItems } = useMenuItems();
  const { categories, isLoading: isLoadingCategories } = useCategories();
  
  // Transform categories for QuickCategorySelector
  const categoryItems = categories.map(cat => ({
    id: cat.slug,
    name: cat.name,
    icon: cat.icon || undefined
  }));
  
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    // Show all items (both available and unavailable) but style them differently in UI
    return matchesSearch && matchesCategory;
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <motion.div
          initial={false}
          animate={{
            y: showHeader ? 0 : -100,
            opacity: showHeader ? 1 : 0
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.2
          }}
          className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm"
        >
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold mb-4">Our Menu</h1>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onFilterClick={() => setIsFilterModalOpen(true)}
            />
            <motion.div
              initial={false}
              animate={{
                height: showHeader ? 'auto' : 0,
                opacity: showHeader ? 1 : 0,
                marginTop: showHeader ? 16 : 0
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.2
              }}
              className="overflow-hidden"
            >
              <QuickCategorySelector
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                categories={[
                  { id: 'all', name: 'All', icon: 'Grid' },
                  ...categoryItems
                ]}
              />
            </motion.div>
          </div>
        </motion.div>

        <div className="container mx-auto px-4 py-6">
          <StaggerChildren
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
            staggerDelay={0.08}
          >
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                variants={staggerItemVariants}
              >
                <MenuCard {...item} />
              </motion.div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <p className="text-gray-500">No menu items found.</p>
              </div>
            )}
          </StaggerChildren>
        </div>

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          priceRange={[0, 2000]}
          setPriceRange={() => {}}
          selectedCategories={[]}
          setSelectedCategories={() => {}}
          sortBy="popular"
          setSortBy={() => {}}
          spiceLevels={[]}
          setSpiceLevels={() => {}}
          dietaryTags={[]}
          setDietaryTags={() => {}}
        />
      </div>
    </PageTransition>
  );
}

export default Menu;