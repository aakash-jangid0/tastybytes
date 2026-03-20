import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Phone, Calendar, Briefcase, FileText, Clock, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

import { Staff } from '../../../types/staff';

interface StaffFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Staff>, photoFile?: File | null) => void;
  initialData?: Partial<Staff>;
  isLoading?: boolean;
}

function StaffForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading
}: StaffFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    // Basic Information
    full_name: '',
    email: '',
    phone: '',
    role: 'server',
    department: 'service',
    start_date: new Date().toISOString().split('T')[0],

    // Additional Information
    date_of_birth: '',
    gender: '',
    marital_status: '',
    blood_group: '',
    nationality: '',

    // Employment Details
    employee_id: '',
    contract_type: 'permanent',
    hire_status: 'active',
    probation_end_date: '',
    notice_period: '30',
    joining_date: '',
    hourly_rate: '',

    // Other
    profile_photo_url: '',

    // Attendance & Working Hours
    working_hours_per_week: '40',
    weekend_availability: false,
    overtime_eligible: true,
    time_off_accrual_rate: '1.5',

    // Leave Management
    annual_leave_balance: '20',
    sick_leave_balance: '10',
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.profile_photo_url) {
        setPhotoPreview(initialData.profile_photo_url);
      }

      setFormData({
        full_name: initialData.full_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        role: initialData.role || 'server',
        department: initialData.department || 'service',
        start_date: initialData.start_date || new Date().toISOString().split('T')[0],

        // Additional Information
        date_of_birth: initialData.date_of_birth || '',
        gender: initialData.gender || '',
        marital_status: initialData.marital_status || '',
        blood_group: initialData.blood_group || '',
        nationality: initialData.nationality || '',

        // Employment Details
        employee_id: initialData.employee_id || '',
        contract_type: initialData.contract_type || 'permanent',
        hire_status: initialData.hire_status || 'active',
        probation_end_date: initialData.probation_end_date || '',
        notice_period: initialData.notice_period?.replace(' days', '') || '30',
        joining_date: initialData.joining_date || '',
        hourly_rate: initialData.hourly_rate !== undefined ? String(initialData.hourly_rate) : '',

        profile_photo_url: initialData.profile_photo_url || '',

        // Attendance & Working Hours
        working_hours_per_week: initialData.working_hours_per_week !== undefined ? String(initialData.working_hours_per_week) : '40',
        weekend_availability: initialData.weekend_availability || false,
        overtime_eligible: initialData.overtime_eligible || true,
        time_off_accrual_rate: initialData.time_off_accrual_rate !== undefined ? String(initialData.time_off_accrual_rate) : '1.5',

        // Leave Management
        annual_leave_balance: initialData.annual_leave_balance !== undefined ? String(initialData.annual_leave_balance) : '20',
        sick_leave_balance: initialData.sick_leave_balance !== undefined ? String(initialData.sick_leave_balance) : '10',
      });
    }
  }, [initialData]);

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image is too large. Please upload an image smaller than 5MB');
        return;
      }

      setPhotoFile(file);

      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file upload dialog
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Format the data properly
      const processedData: Partial<Staff> = {
        ...formData,
        notice_period: formData.notice_period + ' days',
        role: formData.role as 'admin' | 'manager' | 'chef' | 'server' | 'cashier',
        department: formData.department as 'kitchen' | 'service' | 'management' | 'accounts',
        contract_type: formData.contract_type as 'permanent' | 'contract' | 'part-time' | 'probation',
        hire_status: formData.hire_status as 'active' | 'on-leave' | 'terminated' | 'resigned',
        hourly_rate: formData.hourly_rate ? Number(formData.hourly_rate) : undefined,
        working_hours_per_week: formData.working_hours_per_week ? Number(formData.working_hours_per_week) : undefined,
        time_off_accrual_rate: formData.time_off_accrual_rate ? Number(formData.time_off_accrual_rate) : undefined,
        annual_leave_balance: formData.annual_leave_balance ? Number(formData.annual_leave_balance) : undefined,
        sick_leave_balance: formData.sick_leave_balance ? Number(formData.sick_leave_balance) : undefined,
      };

      onSubmit(processedData, photoFile);
      setPhotoFile(null);
      setPhotoPreview(null);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'server',
        department: 'service',
        start_date: new Date().toISOString().split('T')[0],
        date_of_birth: '',
        gender: '',
        marital_status: '',
        blood_group: '',
        nationality: '',
        employee_id: '',
        contract_type: 'permanent',
        hire_status: 'active',
        probation_end_date: '',
        notice_period: '30',
        joining_date: '',
        hourly_rate: '',
        profile_photo_url: '',
        working_hours_per_week: '40',
        weekend_availability: false,
        overtime_eligible: true,
        time_off_accrual_rate: '1.5',
        annual_leave_balance: '20',
        sick_leave_balance: '10',
      });
      setActiveTab('basic');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save staff member');
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'personal', label: 'Personal', icon: FileText },
  ];

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
        className="bg-white rounded-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto"
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

        <div className="flex border-b mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent hover:text-emerald-500"
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 relative rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handlePhotoUpload}
                      />
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                            setFormData({...formData, profile_photo_url: ''});
                          }}
                          className="px-4 py-2 text-sm text-red-500 hover:text-red-700 mt-2"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

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
          )}

          {/* Employment Details */}
          {activeTab === 'employment' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <div className="mt-1 relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contract Type
                  </label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="part-time">Part Time</option>
                    <option value="probation">Probation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={formData.hire_status}
                    onChange={(e) => setFormData({ ...formData, hire_status: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                    <option value="resigned">Resigned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Probation End Date
                  </label>
                  <input
                    type="date"
                    value={formData.probation_end_date}
                    onChange={(e) => setFormData({ ...formData, probation_end_date: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notice Period (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.notice_period}
                    onChange={(e) => setFormData({ ...formData, notice_period: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hourly Rate
                  </label>
                  <div className="mt-1 relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      className="pl-10 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Personal Information */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Marital Status
                  </label>
                  <select
                    value={formData.marital_status}
                    onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

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
