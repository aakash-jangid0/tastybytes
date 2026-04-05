import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Phone, IndianRupee, Calendar, Lock } from 'lucide-react';
import { Staff } from '../../../types/staff';

interface StaffFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Staff> & { password?: string }) => void;
  initialData?: Partial<Staff> | null;
  isLoading?: boolean;
}

function StaffForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading
}: StaffFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'helper',
    joining_date: new Date().toISOString().split('T')[0],
    monthly_salary: '',
    password: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        role: initialData.role || 'helper',
        joining_date: initialData.joining_date || new Date().toISOString().split('T')[0],
        monthly_salary: initialData.monthly_salary !== undefined ? String(initialData.monthly_salary) : '',
        password: ''
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'helper',
        joining_date: new Date().toISOString().split('T')[0],
        monthly_salary: '',
        password: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { password, monthly_salary, ...rest } = formData;
    onSubmit({
      ...rest,
      role: rest.role as Staff['role'],
      monthly_salary: Number(monthly_salary),
      ...(password ? { password } : {})
    });
  };

  if (!isOpen) return null;

  const isEditing = !!initialData;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        data-lenis-prevent
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="staff@example.com"
                  required
                  disabled={isEditing}
                />
              </div>
              {isEditing && (
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="10-digit number"
                  required
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="admin">Admin</option>
                <option value="kitchen">Kitchen</option>
                <option value="counter">Counter</option>
                <option value="helper">Helper</option>
              </select>
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Monthly Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  value={formData.monthly_salary}
                  onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                  className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {isEditing && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder={isEditing ? 'Leave blank to keep current' : 'Set login password'}
                  required={!isEditing}
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Min 6 characters. Used for staff login.</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Add'} Staff Member
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default StaffForm;
