import React from 'react';
import { motion } from 'framer-motion';
import { MenuItem } from '../../types/menu';
import { Pizza, IndianRupee, Clock } from 'lucide-react';

interface MenuStatsProps {
  items: MenuItem[];
}

function MenuStats({ items }: MenuStatsProps) {
  const totalItems = items.length;
  const availableItems = items.filter(item => item.isAvailable).length;
  const averagePrice = items.reduce((acc, item) => acc + item.price, 0) / totalItems;

  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      icon: Pizza,
      color: 'bg-blue-500',
    },
    {
      label: 'Available Items',
      value: availableItems,
      icon: Clock,
      color: 'bg-green-500',
    },
    {
      label: 'Average Price',
      value: `₹${averagePrice.toFixed(2)}`,
      icon: IndianRupee,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 mr-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default MenuStats;