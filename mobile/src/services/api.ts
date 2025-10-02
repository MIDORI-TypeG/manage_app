import axios from 'axios';
import { Shift, InventoryItem, InventoryHistory, Notice, StockChange, DailyFlag } from '../types';

// モバイルアプリからバックエンドへの接続URL
// 開発中はExpoのトンネルURLやローカルIPアドレスを使用する場合があります
// 本番環境ではデプロイされたバックエンドのURLを設定します
const API_BASE_URL = 'http://localhost:5000/api'; // 開発環境の例

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// エラーハンドリング
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// シフト関連API
export const shiftAPI = {
  getAll: async (startDate?: string, endDate?: string): Promise<Shift[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(`/shifts?${params.toString()}`);
    return response.data;
  },

  getByDate: async (date: string): Promise<Shift[]> => {
    const response = await api.get(`/shifts/date/${date}`);
    return response.data;
  },

  create: async (shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>): Promise<Shift> => {
    const response = await api.post('/shifts', shift);
    return response.data;
  },

  update: async (id: number, shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    await api.put(`/shifts/${id}`, shift);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/shifts/${id}`);
  },
};

// 在庫関連API
export const inventoryAPI = {
  getAll: async (params?: { category: string }): Promise<InventoryItem[]> => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  getAlerts: async (): Promise<InventoryItem[]> => {
    const response = await api.get('/inventory/alerts');
    return response.data;
  },

  getHistory: async (itemId: number): Promise<InventoryHistory[]> => {
    const response = await api.get(`/inventory/${itemId}/history`);
    return response.data;
  },

  create: async (item: Omit<InventoryItem, 'id' | 'is_low_stock' | 'created_at' | 'updated_at'>): Promise<InventoryItem> => {
    const response = await api.post('/inventory', item);
    return response.data;
  },

  update: async (id: number, item: Omit<InventoryItem, 'id' | 'is_low_stock' | 'created_at' | 'updated_at'>): Promise<void> => {
    await api.put(`/inventory/${id}`, item);
  },

  changeStock: async (id: number, change: StockChange): Promise<{ message: string; new_stock: number }> => {
    const response = await api.post(`/inventory/${id}/stock-change`, change);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },

  updateStatus: async (id: number, status: string): Promise<{ message: string; status: string }> => {
    const response = await api.patch(`/inventory/${id}/status`, { status });
    return response.data;
  },
};

// お知らせ関連API
export const noticeAPI = {
  getAll: async (priority?: string, isRead?: boolean): Promise<Notice[]> => {
    const params = new URLSearchParams();
    if (priority) params.append('priority', priority);
    if (isRead !== undefined) params.append('is_read', isRead.toString());
    
    const response = await api.get(`/notices?${params.toString()}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notices/unread-count');
    return response.data.count;
  },

  getById: async (id: number): Promise<Notice> => {
    const response = await api.get(`/notices/${id}`);
    return response.data;
  },

  create: async (notice: Omit<Notice, 'id' | 'is_read' | 'created_at' | 'updated_at'>): Promise<Notice> => {
    const response = await api.post('/notices', notice);
    return response.data;
  },

  update: async (id: number, notice: Omit<Notice, 'id' | 'is_read' | 'created_at' | 'updated_at'>): Promise<void> => {
    await api.put(`/notices/${id}`, notice);
  },

  markAsRead: async (id: number, isRead: boolean): Promise<void> => {
    await api.patch(`/notices/${id}/read-status`, { is_read: isRead });
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notices/mark-all-read');
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/notices/${id}`);
  },
};

// フラグ関連API
export const flagsAPI = {
  getForMonth: async (month: string): Promise<DailyFlag[]> => {
    const response = await api.get(`/flags?month=${month}`);
    return response.data;
  },

  setFlag: async (date: string, is_flagged: boolean): Promise<{ message: string; date: string; is_flagged: boolean }> => {
    const response = await api.post('/flags', { date, is_flagged });
    return response.data;
  },
};

export default api;