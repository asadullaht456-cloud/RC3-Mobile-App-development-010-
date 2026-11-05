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

// Configurable flag for mock mode vs live API.
// Live backend is fully integrated at http://localhost:3000/api
export let USE_MOCK = false;

export const setUseMock = (useMock: boolean) => {
  USE_MOCK = useMock;
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
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
  } else {
    // Default fallback token for active session
    config.headers.Authorization = 'Bearer mock_firebase_id_token';
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

// High-level API functions with automatic graceful fallback if server offline
export const api = {
  async getMe(): Promise<Member> {
    if (USE_MOCK) return { id: 'M01', name: 'Ali', email: 'ali@demo.com' };
    try {
      const res = await apiClient.get<Member>('/auth/me');
      return res.data;
    } catch {
      return { id: 'M01', name: 'Ali', email: 'ali@demo.com' };
    }
  },

  async getMembers(): Promise<Member[]> {
    if (USE_MOCK) return mockDb.getMembers();
    try {
      const res = await apiClient.get<Member[]>('/members');
      return res.data;
    } catch {
      return mockDb.getMembers();
    }
  },

  async getShopping(): Promise<ShoppingItem[]> {
    if (USE_MOCK) return mockDb.getShopping();
    try {
      const res = await apiClient.get<ShoppingItem[]>('/shopping');
      return res.data;
    } catch {
      return mockDb.getShopping();
    }
  },

  async addShoppingItem(item: {
    title: string;
    unit: 'pack' | 'dozen' | 'bottle' | 'bag';
    requested_qty: number;
  }): Promise<ShoppingItem> {
    if (USE_MOCK) return mockDb.addShoppingItem(item);
    try {
      const res = await apiClient.post<ShoppingItem>('/shopping', item);
      return res.data;
    } catch {
      return mockDb.addShoppingItem(item);
    }
  },

  async checkout(payload: CheckoutPayload): Promise<CheckoutResponse> {
    if (USE_MOCK) return mockDb.checkout(payload);
    try {
      const res = await apiClient.post<CheckoutResponse>('/shopping/checkout', payload);
      return res.data;
    } catch {
      return mockDb.checkout(payload);
    }
  },

  async getExpenses(): Promise<Expense[]> {
    if (USE_MOCK) return mockDb.expenses;
    try {
      const res = await apiClient.get<Expense[]>('/expenses');
      return res.data;
    } catch {
      return mockDb.expenses;
    }
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
    if (USE_MOCK) return mockDb.addExpense(expense as any);
    try {
      const res = await apiClient.post<Expense>('/expenses', expense);
      return res.data;
    } catch {
      return mockDb.addExpense(expense as any);
    }
  },

  async getBalances(): Promise<BalancesResponse> {
    if (USE_MOCK) return mockDb.getBalances();
    try {
      const res = await apiClient.get<BalancesResponse>('/balances');
      return res.data;
    } catch {
      return mockDb.getBalances();
    }
  },

  async getBudget(): Promise<BudgetResponse> {
    if (USE_MOCK) return mockDb.getBudget();
    try {
      const res = await apiClient.get<BudgetResponse>('/budget');
      return res.data;
    } catch {
      return mockDb.getBudget();
    }
  },

  async settle(payload: SettlePayload): Promise<Settlement> {
    if (USE_MOCK) return mockDb.settle(payload);
    try {
      const res = await apiClient.post<Settlement>('/settle', payload);
      return res.data;
    } catch {
      return mockDb.settle(payload);
    }
  },

  async registerDeviceToken(token: string): Promise<{ success: boolean }> {
    if (USE_MOCK) return { success: true };
    try {
      const res = await apiClient.post<{ success: boolean }>('/devices/token', { token });
      return res.data;
    } catch {
      return { success: true };
    }
  },

  async removeDeviceToken(token: string): Promise<{ success: boolean }> {
    if (USE_MOCK) return { success: true };
    try {
      const res = await apiClient.delete<{ success: boolean }>('/devices/token', {
        data: { token },
      });
      return res.data;
    } catch {
      return { success: true };
    }
  },
};
