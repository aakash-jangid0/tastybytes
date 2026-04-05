import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, IndianRupee } from 'lucide-react';

interface StaffStatsProps {
  stats: {
    totalStaff: number;
    activeStaff: number;
    monthlySalary: number;
    roleBreakdown: Record<string, number>;
  };
}

function StaffStats({ stats }: StaffStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Staff</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-4 space-y-1">
          {Object.entries(stats.roleBreakdown).map(([role, count]) => (
            <div key={role} className="flex justify-between text-sm">
              <span className="text-gray-500 capitalize">{role}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Active Staff</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.activeStaff}</p>
          </div>
          <div className="bg-emerald-100 p-3 rounded-lg">
            <UserCheck className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {stats.totalStaff > 0
            ? `${Math.round((stats.activeStaff / stats.totalStaff) * 100)}% of total staff`
            : 'No staff members yet'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Monthly Payroll</p>
            <p className="text-2xl font-bold text-orange-600">
              ₹{stats.monthlySalary.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-orange-100 p-3 rounded-lg">
            <IndianRupee className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">Active staff salaries</p>
      </motion.div>
    </div>
  );
}

export default StaffStats;
