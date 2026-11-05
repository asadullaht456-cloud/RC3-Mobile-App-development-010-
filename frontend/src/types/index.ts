export type MemberId = 'M01' | 'M02' | 'M03' | string;

export interface Member {
  id: MemberId;
  name: string;
  email: string;
}

export type ShoppingUnit = 'pack' | 'dozen' | 'bottle' | 'bag';
export type ShoppingStatus = 'Pending' | 'Bought';

export interface ShoppingItem {
  id: string;
  title: string;
  unit: ShoppingUnit;
  requested_qty: number;
  status: ShoppingStatus;
}

export type SplitType = 'EQUAL' | 'CUSTOM';

export interface ExpenseSplit {
  member_id: MemberId;
  owed_amount?: number;
  amount?: number;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  payer_id: MemberId;
  split_type: SplitType;
  date: string;
  splits?: ExpenseSplit[];
}

export interface MemberBalance {
  member_id: MemberId;
  name: string;
  net_balance: number;
  status: 'owed' | 'owes';
}

export interface BalancesResponse {
  balances: MemberBalance[];
  total_net_sum: number;
}

export type BudgetStatus = 'Safe' | 'Near Limit' | 'Exceeded';

export interface BudgetResponse {
  total_spent: number;
  budget_limit: number;
  remaining: number;
  spent_percentage: number;
  status: BudgetStatus;
}

export interface Settlement {
  id: string;
  sender_id: MemberId;
  recipient_id: MemberId;
  amount: number;
  created_at: string;
}

export interface CheckoutPayload {
  item_ids: string[];
  total_paid: number;
  payer_id: MemberId;
  split_members: MemberId[];
}

export interface CheckoutResponse {
  success: boolean;
  expense: Expense;
  bought_item_ids: string[];
}

export interface SettlePayload {
  sender_id: MemberId;
  recipient_id: MemberId;
  amount: number;
}

export interface NotificationPayload {
  notification: {
    title: string;
    body: string;
  };
  data: {
    type: 'EXPENSE_ADDED' | 'SETTLEMENT_RECORDED' | 'BUDGET_ALERT';
    screen: 'Home' | 'Shopping' | 'Expenses';
    reference_id?: string;
  };
}

export interface ApiError {
  error: string;
  details?: any;
}
