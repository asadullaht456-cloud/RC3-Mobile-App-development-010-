import { Request } from 'express';

export interface Member {
  id: string;
  name: string;
  email: string;
  firebase_uid: string | null;
}

export type ShoppingItemUnit = 'pack' | 'dozen' | 'bottle' | 'bag';
export type ShoppingItemStatus = 'Pending' | 'Bought';

export interface ShoppingItem {
  id: string;
  title: string;
  unit: ShoppingItemUnit;
  requested_qty: number;
  status: ShoppingItemStatus;
}

export type SplitType = 'EQUAL' | 'CUSTOM';

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number; // in integer paisa
  payer_id: string;
  split_type: SplitType;
  date: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  member_id: string;
  owed_amount: number; // in integer paisa
}

export interface Settlement {
  id: string;
  sender_id: string;
  recipient_id: string;
  amount: number; // in integer paisa
  created_at: string;
}

export interface DeviceToken {
  token: string;
  member_id: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: any;
}

export interface AuthenticatedRequest extends Request {
  member?: Member;
}
