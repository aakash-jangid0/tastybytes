import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, User, Mail, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StaffFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  isLoading?: boolean;
}

function StaffForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading
}: StaffFormProps) {
  const [formData, setFormData] = React.useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'server',
    department: 'service',
    profile_photo_url: ''
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        role: initialData.role || 'server',
        department: initialData.department || 'service',
        profile_photo_url: initialData.profile_photo_url || ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await onSubmit(formData);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'server',
        department: 'service',
        profile_photo_url: ''
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save staff member');
    }
  };

  if (!isOpen) return null;

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
        className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Role and Department */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Role & Department</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="chef">Chef</option>
                  <option value="server">Server</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="kitchen">Kitchen</option>
                  <option value="service">Service</option>
                  <option value="management">Management</option>
                  <option value="accounts">Accounts</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
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
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Add'} Staff Member
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default StaffForm;