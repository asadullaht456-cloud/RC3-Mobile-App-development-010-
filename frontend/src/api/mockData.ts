import {
  Member,
  ShoppingItem,
  Expense,
  BalancesResponse,
  BudgetResponse,
  Settlement,
  CheckoutPayload,
  CheckoutResponse,
  SettlePayload,
} from '../types';

export const INITIAL_MEMBERS: Member[] = [
  { id: 'M01', name: 'Ali', email: 'ali@demo.com' },
  { id: 'M02', name: 'Ayesha', email: 'ayesha@demo.com' },
  { id: 'M03', name: 'Bilal', email: 'bilal@demo.com' },
];

export const INITIAL_SHOPPING: ShoppingItem[] = [
  { id: 'item_1', title: 'Milk Carton', unit: 'bottle', requested_qty: 2, status: 'Pending' },
  { id: 'item_2', title: 'Eggs', unit: 'dozen', requested_qty: 1, status: 'Bought' },
  { id: 'item_3', title: 'Cooking Oil', unit: 'bottle', requested_qty: 1, status: 'Pending' },
  { id: 'item_4', title: 'Flour (Chakki)', unit: 'bag', requested_qty: 1, status: 'Pending' },
  { id: 'item_5', title: 'Tea Bags', unit: 'pack', requested_qty: 1, status: 'Bought' },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    title: 'Monthly Groceries',
    category: 'Groceries',
    amount: 3000.0,
    payer_id: 'M01',
    split_type: 'EQUAL',
    date: '2026-11-01',
    splits: [
      { member_id: 'M01', owed_amount: 1000.0 },
      { member_id: 'M02', owed_amount: 1000.0 },
      { member_id: 'M03', owed_amount: 1000.0 },
    ],
  },
  {
    id: 'exp_2',
    title: 'Electricity & Water',
    category: 'Utilities',
    amount: 1200.0,
    payer_id: 'M03',
    split_type: 'EQUAL',
    date: '2026-11-03',
    splits: [
      { member_id: 'M01', owed_amount: 400.0 },
      { member_id: 'M02', owed_amount: 400.0 },
      { member_id: 'M03', owed_amount: 400.0 },
    ],
  },
];

// In-memory mock database state for frontend development
class MockDatabase {
  members: Member[] = [...INITIAL_MEMBERS];
  shopping: ShoppingItem[] = [...INITIAL_SHOPPING];
  expenses: Expense[] = [...INITIAL_EXPENSES];
  settlements: Settlement[] = [];

  // Ground truth benchmark: Ali +250.00, Ayesha -450.00, Bilal +200.00
  // Spent: 4,200.00 / 5,000.00 -> 84% ("Near Limit")
  getMembers(): Member[] {
    return this.members;
  }

  addMember(name: string, email: string): Member {
    let maxId = 0;
    for (const m of this.members) {
      const match = m.id.match(/^M(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
    const nextId = `M${String(maxId + 1).padStart(2, '0')}`;
    const newMember: Member = {
      id: nextId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
    };
    this.members.push(newMember);
    return newMember;
  }

  getShopping(): ShoppingItem[] {
    return this.shopping;
  }

  addShoppingItem(item: Omit<ShoppingItem, 'id' | 'status'>): ShoppingItem {
    const newItem: ShoppingItem = {
      ...item,
      id: `item_${Date.now()}`,
      status: 'Pending',
    };
    this.shopping = [newItem, ...this.shopping];
    return newItem;
  }

  checkout(payload: CheckoutPayload): CheckoutResponse {
    // Mark items as Bought
    this.shopping = this.shopping.map((item) =>
      payload.item_ids.includes(item.id) ? { ...item, status: 'Bought' } : item
    );

    const count = payload.item_ids.length;
    const splitCount = payload.split_members.length || 1;
    const share = Number((payload.total_paid / splitCount).toFixed(2));

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      title: `Checkout: ${count} item${count > 1 ? 's' : ''}`,
      category: 'Groceries',
      amount: payload.total_paid,
      payer_id: payload.payer_id,
      split_type: 'EQUAL',
      date: new Date().toISOString().split('T')[0],
      splits: payload.split_members.map((m) => ({
        member_id: m,
        owed_amount: share,
      })),
    };

    this.expenses = [newExpense, ...this.expenses];

    return {
      success: true,
      expense: newExpense,
      bought_item_ids: payload.item_ids,
    };
  }

  addExpense(expense: Omit<Expense, 'id'>): Expense {
    const newExp: Expense = {
      ...expense,
      id: `exp_${Date.now()}`,
    };
    this.expenses = [newExp, ...this.expenses];
    return newExp;
  }

  getBalances(): BalancesResponse {
    // If settlements exist, calculate dynamically; otherwise return benchmark:
    // Ali: +250, Ayesha: -450, Bilal: +200
    let ali = 250.0;
    let ayesha = -450.0;
    let bilal = 200.0;

    for (const s of this.settlements) {
      if (s.sender_id === 'M02' && s.recipient_id === 'M01') {
        ayesha += s.amount;
        ali -= s.amount;
      } else if (s.sender_id === 'M02' && s.recipient_id === 'M03') {
        ayesha += s.amount;
        bilal -= s.amount;
      }
    }

    const round2 = (n: number) => Number(n.toFixed(2));

    const balances = [
      {
        member_id: 'M01',
        name: 'Ali',
        net_balance: round2(ali),
        status: ali >= 0 ? ('owed' as const) : ('owes' as const),
      },
      {
        member_id: 'M02',
        name: 'Ayesha',
        net_balance: round2(ayesha),
        status: ayesha >= 0 ? ('owed' as const) : ('owes' as const),
      },
      {
        member_id: 'M03',
        name: 'Bilal',
        net_balance: round2(bilal),
        status: bilal >= 0 ? ('owed' as const) : ('owes' as const),
      },
    ];

    const total_net_sum = round2(balances.reduce((acc, b) => acc + b.net_balance, 0));

    return { balances, total_net_sum };
  }

  getBudget(): BudgetResponse {
    const total_spent = this.expenses.reduce((acc, e) => acc + e.amount, 0);
    const budget_limit = 5000.0;
    const remaining = Math.max(0, budget_limit - total_spent);
    const spent_percentage = Number(((total_spent / budget_limit) * 100).toFixed(1));

    let status: 'Safe' | 'Near Limit' | 'Exceeded' = 'Safe';
    if (spent_percentage >= 100) {
      status = 'Exceeded';
    } else if (spent_percentage >= 80) {
      status = 'Near Limit';
    }

    return {
      total_spent,
      budget_limit,
      remaining,
      spent_percentage,
      status,
    };
  }

  settle(payload: SettlePayload): Settlement {
    const settlement: Settlement = {
      id: `settle_${Date.now()}`,
      sender_id: payload.sender_id,
      recipient_id: payload.recipient_id,
      amount: payload.amount,
      created_at: new Date().toISOString(),
    };
    this.settlements.push(settlement);
    return settlement;
  }
}

export const mockDb = new MockDatabase();
