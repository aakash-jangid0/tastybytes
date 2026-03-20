import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerFilterProps {
  filters: {
    search: string;
    status: string;
    sortBy: string;
    tags: string[];
    spentRange: { min: number; max: number };
    dateRange: { start: Date | null; end: Date | null };
  };
  onFilterChange: (filters: any) => void;
}

export default function CustomerFilter({ filters, onFilterChange }: CustomerFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sortBy: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleSpentRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      spentRange: {
        ...filters.spentRange,
        [name === 'min' ? 'min' : 'max']: value ? Number(value) : name === 'min' ? 0 : Infinity
      }
    });
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [name === 'start' ? 'start' : 'end']: value ? new Date(value) : null
      }
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    onFilterChange({ ...filters, tags: newTags });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      status: 'all',
      sortBy: 'recent',
      tags: [],
      spentRange: { min: 0, max: Infinity },
      dateRange: { start: null, end: null }
    });
  };

  const hasFilters = filters.search || 
    filters.status !== 'all' || 
    filters.sortBy !== 'recent' ||
    filters.tags.length > 0 ||
    filters.spentRange.min > 0 || 
    filters.spentRange.max < Infinity ||
    filters.dateRange.start || 
    filters.dateRange.end;

  // Demo tags
  const availableTags = ['VIP', 'Regular', 'New', 'Corporate', 'High Value'];

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
          
          <select
            value={filters.sortBy}
            onChange={handleSortChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name (A-Z)</option>
            <option value="spent">Highest Spend</option>
          </select>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={18} />
            Advanced Filters
          </button>
          
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
            >
              <X size={18} />
              Clear All
            </button>
          )}
        </div>
        
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          filters.tags.includes(tag)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Total Spent Range</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="min"
                      placeholder="Min"
                      value={filters.spentRange.min > 0 ? filters.spentRange.min : ''}
                      onChange={handleSpentRangeChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      min="0"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      name="max"
                      placeholder="Max"
                      value={filters.spentRange.max < Infinity ? filters.spentRange.max : ''}
                      onChange={handleSpentRangeChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Date Range</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      name="start"
                      value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                      onChange={handleDateRangeChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                    <span>to</span>
                    <input
                      type="date"
                      name="end"
                      value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                      onChange={handleDateRangeChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}