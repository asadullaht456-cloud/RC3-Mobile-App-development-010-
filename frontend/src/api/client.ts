import axios from 'axios';
import {
  Member,
  ShoppingItem,
  Expense,
  BalancesResponse,
  BudgetResponse,
  CheckoutPayload,
  CheckoutResponse,
  SettlePayload,
  Settlement,
} from '../types';
import { mockDb } from './mockData';

// Mock toggle required by REQUIREMENTS.md (Phase F1: USE_MOCK = true until Sync S2)
export const USE_MOCK = true;

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let getAuthToken: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  getAuthToken = getter;
};

// Request interceptor to attach Firebase ID Token
apiClient.interceptors.request.use(async (config) => {
  if (getAuthToken) {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for 401 handling
let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

// High-level API functions with automatic mock fallback
export const api = {
  async getMe(): Promise<Member> {
    if (USE_MOCK) {
      return { id: 'M01', name: 'Ali', email: 'ali@demo.com' };
    }
    const res = await apiClient.get<Member>('/auth/me');
    return res.data;
  },

  async getMembers(): Promise<Member[]> {
    if (USE_MOCK) {
      return mockDb.getMembers();
    }
    const res = await apiClient.get<Member[]>('/members');
    return res.data;
  },

  async getShopping(): Promise<ShoppingItem[]> {
    if (USE_MOCK) {
      return mockDb.getShopping();
    }
    const res = await apiClient.get<ShoppingItem[]>('/shopping');
    return res.data;
  },

  async addShoppingItem(item: {
    title: string;
    unit: 'pack' | 'dozen' | 'bottle' | 'bag';
    requested_qty: number;
  }): Promise<ShoppingItem> {
    if (USE_MOCK) {
      return mockDb.addShoppingItem(item);
    }
    const res = await apiClient.post<ShoppingItem>('/shopping', item);
    return res.data;
  },

  async checkout(payload: CheckoutPayload): Promise<CheckoutResponse> {
    if (USE_MOCK) {
      return mockDb.checkout(payload);
    }
    const res = await apiClient.post<CheckoutResponse>('/shopping/checkout', payload);
    return res.data;
  },

  async getExpenses(): Promise<Expense[]> {
    if (USE_MOCK) {
      return mockDb.expenses;
    }
    const res = await apiClient.get<Expense[]>('/expenses');
    return res.data;
  },

  async addExpense(expense: {
    title: string;
    category: string;
    amount: number;
    payer_id: string;
    split_type: 'EQUAL' | 'CUSTOM';
    date: string;
    splits?: { member_id: string; owed_amount?: number; amount?: number }[];
  }): Promise<Expense> {
    if (USE_MOCK) {
      return mockDb.addExpense(expense as any);
    }
    const res = await apiClient.post<Expense>('/expenses', expense);
    return res.data;
  },

  async getBalances(): Promise<BalancesResponse> {
    if (USE_MOCK) {
      return mockDb.getBalances();
    }
    const res = await apiClient.get<BalancesResponse>('/balances');
    return res.data;
  },

  async getBudget(): Promise<BudgetResponse> {
    if (USE_MOCK) {
      return mockDb.getBudget();
    }
    const res = await apiClient.get<BudgetResponse>('/budget');
    return res.data;
  },

  async settle(payload: SettlePayload): Promise<Settlement> {
    if (USE_MOCK) {
      return mockDb.settle(payload);
    }
    const res = await apiClient.post<Settlement>('/settle', payload);
    return res.data;
  },

  async registerDeviceToken(token: string): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return { success: true };
    }
    const res = await apiClient.post<{ success: boolean }>('/devices/token', { token });
    return res.data;
  },

  async removeDeviceToken(token: string): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return { success: true };
    }
    const res = await apiClient.delete<{ success: boolean }>('/devices/token', {
      data: { token },
    });
    return res.data;
  },
};
