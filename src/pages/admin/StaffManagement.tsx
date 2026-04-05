import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Users, IndianRupee } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { Staff } from '../../types/staff';
import StaffTable from '../../components/admin/staff/StaffTable';
import StaffForm from '../../components/admin/staff/StaffForm';
import StaffStats from '../../components/admin/staff/StaffStats';
import SalaryView from '../../components/admin/staff/SalaryView';
import { useGuestGuard } from '../../hooks/useGuestGuard';

export default function StaffManagement() {
  const { isGuest, guardAction } = useGuestGuard();
  const [activeTab, setActiveTab] = useState<'staff' | 'salary'>('staff');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    monthlySalary: 0,
    roleBreakdown: {} as Record<string, number>
  });

  const tabs = [
    { id: 'staff' as const, label: 'Staff List', icon: Users },
    { id: 'salary' as const, label: 'Salary', icon: IndianRupee }
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (staffData: Staff[]) => {
    const activeStaff = staffData.filter(s => s.is_active);
    const roleBreakdown = staffData.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalStaff: staffData.length,
      activeStaff: activeStaff.length,
      monthlySalary: activeStaff.reduce((sum, s) => sum + (s.monthly_salary || 0), 0),
      roleBreakdown
    });
  };

  const handleSubmit = async (formData: Partial<Staff> & { password?: string }) => {
    try {
      setIsSubmitting(true);
      const { password, ...staffData } = formData;

      if (editingStaff) {
        // Update existing staff
        const { error } = await supabase
          .from('staff')
          .update({
            full_name: staffData.full_name,
            phone: staffData.phone,
            role: staffData.role,
            joining_date: staffData.joining_date,
            monthly_salary: staffData.monthly_salary,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStaff.id);

        if (error) throw error;
        toast.success('Staff member updated successfully');
      } else {
        // Create new staff with auth account
        if (!password) {
          toast.error('Password is required for new staff');
          return;
        }

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: staffData.email!,
          password,
          options: {
            data: { name: staffData.full_name }
          }
        });

        if (authError) throw authError;

        // 2. Update profile role (trigger creates profile with role='customer')
        if (authData.user) {
          await supabase
            .from('profiles')
            .update({ role: staffData.role, phone: staffData.phone })
            .eq('id', authData.user.id);
        }

        // 3. Insert staff record
        const { error: staffError } = await supabase
          .from('staff')
          .insert([{
            user_id: authData.user?.id,
            full_name: staffData.full_name,
            email: staffData.email,
            phone: staffData.phone,
            role: staffData.role,
            joining_date: staffData.joining_date,
            monthly_salary: staffData.monthly_salary,
            is_active: true
          }]);

        if (staffError) throw staffError;
        toast.success('Staff member added successfully');
      }

      setShowForm(false);
      setEditingStaff(null);
      await fetchStaff();
    } catch (error: any) {
      console.error('Error saving staff member:', error);
      toast.error(error.message || 'Failed to save staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Staff member deleted successfully');
      await fetchStaff();
    } catch (error: any) {
      console.error('Error deleting staff member:', error);
      toast.error(error.message || 'Failed to delete staff member');
    }
  };

  const handleToggleStatus = async (id: string, status: boolean) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Staff member ${status ? 'activated' : 'deactivated'}`);
      await fetchStaff();
    } catch (error: any) {
      console.error('Error updating staff status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      toast.success(`Password reset email sent to ${email}`);
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast.error(error.message || 'Failed to send reset email');
    }
  };

  const filteredStaff = staff.filter(member =>
    member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-gray-600">Manage your restaurant staff</p>
        </div>
        {activeTab === 'staff' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => guardAction(() => setShowForm(true))}
            disabled={isGuest}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-5 h-5" />
            Add Staff
          </motion.button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent hover:text-emerald-500'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <StaffStats stats={stats} />

      {/* Staff List Tab */}
      {activeTab === 'staff' && (
        <>
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <StaffTable
              staff={filteredStaff}
              onEdit={(member) => { setEditingStaff(member); setShowForm(true); }}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onResetPassword={handleResetPassword}
              loading={loading}
            />
          </div>
        </>
      )}

      {/* Salary Tab */}
      {activeTab === 'salary' && (
        <SalaryView staff={staff} />
      )}

      <StaffForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingStaff(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingStaff}
        isLoading={isSubmitting}
      />
    </div>
  );
}
