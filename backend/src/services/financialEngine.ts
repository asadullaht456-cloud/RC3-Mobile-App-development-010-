import { db } from '../db/connection.js';
import { pkrToPaisa, paisaToPkr } from '../utils/money.js';

export interface SplitResult {
  member_id: string;
  owed_paisa: number;
}

/**
 * Calculates equal split with remainder distributed 1 paisa each to members sorted ascending by ID.
 */
export function calculateEqualSplit(totalPaisa: number, memberIds: string[]): SplitResult[] {
  const sortedIds = [...memberIds].sort();
  const n = sortedIds.length;
  if (n === 0) return [];

  const base = Math.floor(totalPaisa / n);
  const remainder = totalPaisa % n;

  return sortedIds.map((id, index) => ({
    member_id: id,
    owed_paisa: base + (index < remainder ? 1 : 0),
  }));
}

export interface MemberBalanceResult {
  member_id: string;
  name: string;
  net_balance: number; // in PKR
  status: 'owed' | 'owes';
}

/**
 * Calculates net balances for all members using:
 * Net Balance = (Paid for Expenses - Share Owed) + (Settlements Sent - Settlements Received)
 * Positive means member is owed money. Negative means member owes money.
 */
export function calculateBalances(): { balances: MemberBalanceResult[]; total_net_sum: number } {
  const members = db.prepare('SELECT id, name FROM members ORDER BY id ASC').all() as {
    id: string;
    name: string;
  }[];

  // 1. Total paid by member for expenses
  const paidStmt = db.prepare(`
    SELECT payer_id, COALESCE(SUM(amount), 0) as total_paid
    FROM expenses
    GROUP BY payer_id
  `);
  const paidMap = new Map<string, number>();
  for (const row of paidStmt.all() as { payer_id: string; total_paid: number }[]) {
    paidMap.set(row.payer_id, row.total_paid);
  }

  // 2. Total share owed by member across all splits
  const owedStmt = db.prepare(`
    SELECT member_id, COALESCE(SUM(owed_amount), 0) as total_owed
    FROM expense_splits
    GROUP BY member_id
  `);
  const owedMap = new Map<string, number>();
  for (const row of owedStmt.all() as { member_id: string; total_owed: number }[]) {
    owedMap.set(row.member_id, row.total_owed);
  }

  // 3. Settlements received (cash in hand -> reduces what member is owed)
  const receivedStmt = db.prepare(`
    SELECT recipient_id, COALESCE(SUM(amount), 0) as total_received
    FROM settlements
    GROUP BY recipient_id
  `);
  const receivedMap = new Map<string, number>();
  for (const row of receivedStmt.all() as { recipient_id: string; total_received: number }[]) {
    receivedMap.set(row.recipient_id, row.total_received);
  }

  // 4. Settlements sent (cash paid out -> settles what member owed)
  const sentStmt = db.prepare(`
    SELECT sender_id, COALESCE(SUM(amount), 0) as total_sent
    FROM settlements
    GROUP BY sender_id
  `);
  const sentMap = new Map<string, number>();
  for (const row of sentStmt.all() as { sender_id: string; total_sent: number }[]) {
    sentMap.set(row.sender_id, row.total_sent);
  }

  // Compute Net Balance in integer paisa for each member
  const balances: MemberBalanceResult[] = members.map((m) => {
    const paid = paidMap.get(m.id) || 0;
    const owed = owedMap.get(m.id) || 0;
    const received = receivedMap.get(m.id) || 0;
    const sent = sentMap.get(m.id) || 0;

    const netPaisa = paid - owed + sent - received;
    const netPkr = paisaToPkr(netPaisa);

    return {
      member_id: m.id,
      name: m.name,
      net_balance: netPkr,
      status: netPkr >= 0 ? ('owed' as const) : ('owes' as const),
    };
  });

  const total_net_sum = Number(
    balances.reduce((acc, b) => acc + b.net_balance, 0).toFixed(2)
  );

  return { balances, total_net_sum };
}

/**
 * Calculates current monthly budget status
 */
export function calculateBudget(): {
  total_spent: number;
  budget_limit: number;
  remaining: number;
  spent_percentage: number;
  status: 'Safe' | 'Near Limit' | 'Exceeded';
} {
  const spentStmt = db.prepare('SELECT COALESCE(SUM(amount), 0) as total_spent FROM expenses');
  const spentPaisa = (spentStmt.get() as { total_spent: number }).total_spent;

  const budgetStmt = db.prepare("SELECT value FROM settings WHERE key = 'monthly_budget'");
  const budgetRow = budgetStmt.get() as { value: string } | undefined;
  const budgetLimitPaisa = budgetRow ? parseInt(budgetRow.value, 10) : 500000;

  const total_spent = paisaToPkr(spentPaisa);
  const budget_limit = paisaToPkr(budgetLimitPaisa);
  const remaining = Number(Math.max(0, budget_limit - total_spent).toFixed(2));
  const spent_percentage = Number(((total_spent / budget_limit) * 100).toFixed(1));

  let status: 'Safe' | 'Near Limit' | 'Exceeded' = 'Safe';
  if (spent_percentage >= 100.0) {
    status = 'Exceeded';
  } else if (spent_percentage >= 80.0) {
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
