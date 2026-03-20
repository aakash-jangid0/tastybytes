import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { CustomerStats } from '../../../types/Customer';

interface CustomerStatsProps {
  stats: CustomerStats;
}

export default function CustomerStatsComponent({ stats }: CustomerStatsProps) {
  const statItems = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: <Users className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-100',
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers,
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      color: 'bg-green-50 border-green-100',
    },
    {
      title: 'Average Spend',
      value: `Rs${stats.averageSpend.toFixed(2)}`,
      icon: <DollarSign className="w-5 h-5 text-orange-500" />,
      color: 'bg-orange-50 border-orange-100',
    },
    {
      title: 'New This Month',
      value: stats.newThisMonth,
      icon: <Calendar className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50 border-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-4 rounded-lg border ${item.color}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">{item.title}</p>
              <p className="text-2xl font-semibold mt-1">{item.value}</p>
            </div>
            <div className="p-3 rounded-full bg-white shadow-sm">
              {item.icon}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}