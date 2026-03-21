import React from 'react';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem } from '../../types/menu';

interface MenuTableProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string) => void;
  selectedCategory: string;
  isGuest?: boolean;
}

function MenuTable({ items, onEdit, onDelete, onToggleAvailability, selectedCategory, isGuest }: MenuTableProps) {
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.tr
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <td className="px-6 py-4">
                    <motion.img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    />
                  </td>
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4 capitalize">{item.category}</td>
                  <td className="px-6 py-4">₹{item.price}</td>
                  <td className="px-6 py-4">
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </motion.span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={isGuest ? {} : { scale: 1.1 }}
                        whileTap={isGuest ? {} : { scale: 0.9 }}
                        onClick={() => onEdit(item)}
                        disabled={isGuest}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Pencil className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={isGuest ? {} : { scale: 1.1 }}
                        whileTap={isGuest ? {} : { scale: 0.9 }}
                        onClick={() => onToggleAvailability(item.id)}
                        disabled={isGuest}
                        className={`p-2 ${
                          item.isAvailable
                            ? 'text-yellow-600 hover:bg-yellow-50'
                            : 'text-green-600 hover:bg-green-50'
                        } rounded-full disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {item.isAvailable ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </motion.button>
                      <motion.button
                        whileHover={isGuest ? {} : { scale: 1.1 }}
                        whileTap={isGuest ? {} : { scale: 0.9 }}
                        onClick={() => onDelete(item.id)}
                        disabled={isGuest}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MenuTable;