export interface Shift {
  id: number;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  position?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: number;
  item_name: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  category?: string;
  notes?: string;
  is_low_stock: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryHistory {
  id: number;
  item_id: number;
  item_name: string;
  change_type: 'in' | 'out';
  quantity: number;
  reason?: string;
  created_at: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  priority: 'high' | 'normal' | 'low';
  is_read: boolean;
  author?: string;
  created_at: string;
  updated_at: string;
}

export interface StockChange {
  change_type: 'in' | 'out';
  quantity: number;
  reason?: string;
}

export interface DailyFlag {
  date: string;
  is_flagged: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export type BottomTabParamList = {
  Shifts: undefined;
  Inventory: undefined;
  Notices: undefined;
  Input: undefined;
};