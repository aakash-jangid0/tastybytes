import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Download,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { Staff, SalaryRecord } from '../../../types/staff';

interface SalaryViewProps {
  staff: Staff[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function SalaryView({ staff }: SalaryViewProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pay form state
  const [totalWorkingDays, setTotalWorkingDays] = useState(getDaysInMonth(selectedMonth, selectedYear));
  const [daysWorked, setDaysWorked] = useState(0);
  const [customAmount, setCustomAmount] = useState(0);
  const [payNote, setPayNote] = useState('');

  const activeStaff = staff.filter(s => s.is_active);

  useEffect(() => {
    fetchSalaryRecords();
  }, [selectedMonth, selectedYear]);

  const fetchSalaryRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('salary_records')
        .select('*')
        .eq('month', selectedMonth)
        .eq('year', selectedYear);

      if (error) throw error;
      setSalaryRecords(data || []);
    } catch (error) {
      console.error('Error fetching salary records:', error);
      toast.error('Failed to load salary records');
    } finally {
      setLoading(false);
    }
  };

  const getRecordForStaff = (staffId: string): SalaryRecord | undefined => {
    return salaryRecords.find(r => r.staff_id === staffId);
  };

  const navigateMonth = (direction: number) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const openPayModal = (member: Staff) => {
    const existing = getRecordForStaff(member.id);
    setSelectedStaff(member);
    setSelectedRecord(existing || null);

    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    setTotalWorkingDays(existing?.total_working_days || daysInMonth);
    setDaysWorked(existing?.days_worked || daysInMonth);
    setPayNote(existing?.note || '');

    const workDays = existing?.days_worked || daysInMonth;
    const totalDays = existing?.total_working_days || daysInMonth;
    const calculated = Math.round((member.monthly_salary / totalDays) * workDays);
    setCustomAmount(existing?.amount_paid || calculated);

    setShowPayModal(true);
  };

  const recalculateAmount = (days: number, total: number, salary: number) => {
    if (total <= 0) return 0;
    return Math.round((salary / total) * days);
  };

  const handleDaysWorkedChange = (val: number) => {
    setDaysWorked(val);
    if (selectedStaff) {
      setCustomAmount(recalculateAmount(val, totalWorkingDays, selectedStaff.monthly_salary));
    }
  };

  const handleTotalDaysChange = (val: number) => {
    setTotalWorkingDays(val);
    if (selectedStaff) {
      setCustomAmount(recalculateAmount(daysWorked, val, selectedStaff.monthly_salary));
    }
  };

  const handlePaySalary = async (markAsPaid: boolean) => {
    if (!selectedStaff) return;

    try {
      setIsSubmitting(true);

      const record = {
        staff_id: selectedStaff.id,
        month: selectedMonth,
        year: selectedYear,
        total_working_days: totalWorkingDays,
        days_worked: daysWorked,
        monthly_salary: selectedStaff.monthly_salary,
        amount_paid: customAmount,
        status: markAsPaid ? 'paid' : 'pending',
        note: payNote || null,
        paid_at: markAsPaid ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      if (selectedRecord) {
        // Update existing
        const { error } = await supabase
          .from('salary_records')
          .update(record)
          .eq('id', selectedRecord.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('salary_records')
          .insert([record]);
        if (error) throw error;
      }

      toast.success(markAsPaid ? 'Salary marked as paid!' : 'Salary record saved');
      setShowPayModal(false);
      setSelectedStaff(null);
      setSelectedRecord(null);
      await fetchSalaryRecords();
    } catch (error: any) {
      console.error('Error saving salary record:', error);
      toast.error(error.message || 'Failed to save salary record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPending = async (record: SalaryRecord) => {
    try {
      const { error } = await supabase
        .from('salary_records')
        .update({ status: 'pending', paid_at: null, updated_at: new Date().toISOString() })
        .eq('id', record.id);
      if (error) throw error;
      toast.success('Marked as pending');
      await fetchSalaryRecords();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  // Stats
  const totalPaid = salaryRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount_paid, 0);
  const totalPending = activeStaff.reduce((sum, s) => {
    const rec = getRecordForStaff(s.id);
    if (!rec || rec.status === 'pending') {
      return sum + (rec?.amount_paid || s.monthly_salary);
    }
    return sum;
  }, 0);
  const paidCount = salaryRecords.filter(r => r.status === 'paid').length;
  const pendingCount = activeStaff.length - paidCount;

  // Filter staff
  const filteredStaff = activeStaff.filter(member => {
    const record = getRecordForStaff(member.id);
    if (filterStatus === 'paid') return record?.status === 'paid';
    if (filterStatus === 'pending') return !record || record.status === 'pending';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Month Navigator + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Month Navigator */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-center min-w-[140px]">
              <p className="text-lg font-bold text-gray-900">{MONTH_NAMES[selectedMonth - 1]}</p>
              <p className="text-sm text-gray-500">{selectedYear}</p>
            </div>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-xl font-bold text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400">{paidCount} staff</p>
            </div>
          </div>
        </div>

        {/* Total Pending */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-orange-600">₹{totalPending.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400">{pendingCount} staff</p>
            </div>
          </div>
        </div>

        {/* Total Payroll */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Payroll</p>
              <p className="text-xl font-bold text-blue-600">
                ₹{(totalPaid + totalPending).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-400">{activeStaff.length} active staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        {(['all', 'paid', 'pending'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filterStatus === status
                ? status === 'paid'
                  ? 'bg-emerald-100 text-emerald-700'
                  : status === 'pending'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-200 text-gray-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {status === 'all' ? 'All' : status === 'paid' ? `Paid (${paidCount})` : `Pending (${pendingCount})`}
          </button>
        ))}
      </div>

      {/* Salary Records Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Worked</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Salary</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No {filterStatus !== 'all' ? filterStatus : ''} salary records for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  const record = getRecordForStaff(member.id);
                  const isPaid = record?.status === 'paid';

                  return (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-emerald-700">
                              {member.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 capitalize">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {record ? (
                          <span className="text-sm text-gray-700">
                            {record.days_worked} / {record.total_working_days}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                        ₹{member.monthly_salary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {record ? (
                          <span className={`text-sm font-semibold ${isPaid ? 'text-emerald-600' : 'text-orange-600'}`}>
                            ₹{record.amount_paid.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Paid
                          </span>
                        ) : record?.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                            <Clock className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Not Set
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-[160px]">
                        {record?.note ? (
                          <p className="text-xs text-gray-500 truncate" title={record.note}>{record.note}</p>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openPayModal(member)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              isPaid
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                            }`}
                          >
                            {isPaid ? 'View / Edit' : record ? 'Pay Now' : 'Set Salary'}
                          </button>
                          {isPaid && (
                            <button
                              onClick={() => handleMarkPending(record!)}
                              className="px-2 py-1.5 text-xs text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Mark as pending"
                            >
                              Undo
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Salary Modal */}
      <AnimatePresence>
        {showPayModal && selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowPayModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedRecord?.status === 'paid' ? 'Salary Details' : 'Pay Salary'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </p>
                </div>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Staff Info */}
              <div className="p-5 bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-700">
                      {selectedStaff.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedStaff.full_name}</p>
                    <p className="text-sm text-gray-500 capitalize">{selectedStaff.role} &bull; ₹{selectedStaff.monthly_salary.toLocaleString('en-IN')}/month</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-5 space-y-5">
                {/* Working Days Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Total Working Days
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={totalWorkingDays}
                      onChange={(e) => handleTotalDaysChange(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Days Worked
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={totalWorkingDays}
                      value={daysWorked}
                      onChange={(e) => handleDaysWorkedChange(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="bg-emerald-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Salary</span>
                    <span className="text-gray-900">₹{selectedStaff.monthly_salary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Per Day</span>
                    <span className="text-gray-900">
                      ₹{totalWorkingDays > 0 ? Math.round(selectedStaff.monthly_salary / totalWorkingDays).toLocaleString('en-IN') : 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Days Worked</span>
                    <span className="text-gray-900">{daysWorked} / {totalWorkingDays}</span>
                  </div>
                  <div className="border-t border-emerald-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-700">Calculated Amount</span>
                    <span className="font-semibold text-emerald-700">
                      ₹{recalculateAmount(daysWorked, totalWorkingDays, selectedStaff.monthly_salary).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Amount to Pay <span className="text-gray-400 font-normal">(you can adjust)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-semibold"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Note <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="e.g., Deducted 2 days leave, bonus included..."
                    rows={2}
                    className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm"
                  />
                </div>

                {/* Paid At Info */}
                {selectedRecord?.paid_at && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Paid on {new Date(selectedRecord.paid_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePaySalary(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
                >
                  Save as Pending
                </button>
                <button
                  onClick={() => handlePaySalary(true)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Mark as Paid'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SalaryView;
