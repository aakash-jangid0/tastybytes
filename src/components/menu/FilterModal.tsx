import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '../../hooks/useCategories';

// Dynamic icon component that renders Lucide icons by name
const DynamicIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const LucideIcon = (LucideIcons[icon as keyof typeof LucideIcons] || LucideIcons.Tag) as React.ElementType;
  return <LucideIcon className={className} />;
};

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceRange: [number, number];
  selectedCategories: string[];
  sortBy: string;
  onApply: (filters: { priceRange: [number, number]; selectedCategories: string[]; sortBy: string }) => void;
  onReset: () => void;
}

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'priceAsc', label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
  { value: 'nameAsc', label: 'Name: A to Z' },
  { value: 'nameDesc', label: 'Name: Z to A' },
];

const DEFAULT_PRICE: [number, number] = [0, 2000];

function FilterModal({
  isOpen,
  onClose,
  priceRange,
  selectedCategories,
  sortBy,
  onApply,
  onReset,
}: FilterModalProps) {
  const { categories } = useCategories();

  // Local draft state — only committed on Apply
  const [draftPriceRange, setDraftPriceRange] = useState<[number, number]>(priceRange);
  const [draftCategories, setDraftCategories] = useState<string[]>(selectedCategories);
  const [draftSortBy, setDraftSortBy] = useState(sortBy);

  // Sync draft state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftPriceRange(priceRange);
      setDraftCategories(selectedCategories);
      setDraftSortBy(sortBy);
    }
  }, [isOpen]);

  const handleCategoryToggle = (categorySlug: string) => {
    setDraftCategories(prev =>
      prev.includes(categorySlug)
        ? prev.filter(c => c !== categorySlug)
        : [...prev, categorySlug]
    );
  };

  const handleApply = () => {
    onApply({
      priceRange: draftPriceRange,
      selectedCategories: draftCategories,
      sortBy: draftSortBy,
    });
    onClose();
  };

  const handleReset = () => {
    setDraftPriceRange(DEFAULT_PRICE);
    setDraftCategories([]);
    setDraftSortBy('popular');
    onReset();
    onClose();
  };

  // Calculate the position percentages for the range track highlight
  const minPercent = (draftPriceRange[0] / 2000) * 100;
  const maxPercent = (draftPriceRange[1] / 2000) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            data-lenis-prevent
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Filters</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Sort By */}
              <div>
                <h3 className="font-medium mb-3">Sort By</h3>
                <select
                  value={draftSortBy}
                  onChange={(e) => setDraftSortBy(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range - Dual slider */}
              <div>
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>₹{draftPriceRange[0]}</span>
                  <span>₹{draftPriceRange[1]}</span>
                </div>
                <div className="relative h-2 mb-4">
                  {/* Track background */}
                  <div className="absolute inset-0 rounded-full bg-gray-200" />
                  {/* Active range highlight */}
                  <div
                    className="absolute h-full rounded-full bg-orange-500"
                    style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                  />
                  {/* Min slider */}
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={draftPriceRange[0]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val <= draftPriceRange[1] - 50) {
                        setDraftPriceRange([val, draftPriceRange[1]]);
                      }
                    }}
                    className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                    style={{ zIndex: draftPriceRange[0] > 1900 ? 5 : 3 }}
                  />
                  {/* Max slider */}
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={draftPriceRange[1]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= draftPriceRange[0] + 50) {
                        setDraftPriceRange([draftPriceRange[0], val]);
                      }
                    }}
                    className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                    style={{ zIndex: 4 }}
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-medium mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.slug}
                      onClick={() => handleCategoryToggle(category.slug)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                        draftCategories.includes(category.slug)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <DynamicIcon icon={category.icon || 'Tag'} className="w-4 h-4" />
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-4 border-t flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FilterModal;
