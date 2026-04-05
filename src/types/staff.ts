// Staff types — simplified

export interface Staff {
  id: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'kitchen' | 'counter' | 'helper';
  joining_date: string;
  monthly_salary: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SalaryRecord {
  id: string;
  staff_id: string;
  month: number;
  year: number;
  total_working_days: number;
  days_worked: number;
  monthly_salary: number;
  amount_paid: number;
  status: 'paid' | 'pending';
  note: string | null;
  paid_at: string | null;
  created_at?: string;
  updated_at?: string;
}
