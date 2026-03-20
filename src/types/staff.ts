// Staff types — V1 scope only (per PRD and Document 07)

export interface Staff {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'kitchen' | 'counter' | 'helper' | 'admin';
  daily_rate: number;
  join_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StaffAttendance {
  id: string;
  staff_id: string;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  check_in?: string;
  check_out?: string;
  notes?: string;
  created_at?: string;
}
