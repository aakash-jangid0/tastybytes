export interface Customer {
id: string;
name: string;
email: string;
phone: string;
address?: string;
created_at: string;
last_visit?: string;
total_orders: number;
total_spent: number;
loyalty_points?: number;
notes?: string;
tags?: string[];
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  averageSpend: number;
  newThisMonth: number;
}

export interface CustomerFilters {
  search: string;
  status: string;
  sortBy: string;
  tags: string[];
  spentRange: { min: number; max: number };
  dateRange: { start: Date | null; end: Date | null };
  availableTags?: string[];
}