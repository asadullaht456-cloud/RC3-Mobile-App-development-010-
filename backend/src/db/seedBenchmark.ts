import { db } from './connection.js';
import { pkrToPaisa } from '../utils/money.js';

export function seedBenchmarkData(): void {
  // Clear existing transactions
  db.exec(`
    DELETE FROM settlements;
    DELETE FROM expense_splits;
    DELETE FROM expenses;
    DELETE FROM shopping_items;
  `);

  // Ensure members exist
  const members = [
    { id: 'M01', name: 'Ali', email: 'ali@demo.com' },
    { id: 'M02', name: 'Ayesha', email: 'ayesha@demo.com' },
    { id: 'M03', name: 'Bilal', email: 'bilal@demo.com' },
  ];

  const insertMember = db.prepare(`
    INSERT INTO members (id, name, email, firebase_uid)
    VALUES (?, ?, ?, NULL)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, email = excluded.email
  `);
  for (const m of members) {
    insertMember.run(m.id, m.name, m.email);
  }

  // Ensure monthly budget setting exists (5,000.00 PKR = 500,000 paisa)
  db.prepare(`
    INSERT INTO settings (key, value)
    VALUES ('monthly_budget', '500000')
    ON CONFLICT(key) DO UPDATE SET value = '500000'
  `).run();

  // Add initial shopping items (both Pending and Bought)
  const insertItem = db.prepare(`
    INSERT INTO shopping_items (id, title, unit, requested_qty, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertItem.run('item_1', 'Milk Carton', 'bottle', 2, 'Pending');
  insertItem.run('item_2', 'Eggs', 'dozen', 1, 'Bought');
  insertItem.run('item_3', 'Cooking Oil', 'bottle', 1, 'Pending');
  insertItem.run('item_4', 'Flour (Chakki)', 'bag', 1, 'Pending');
  insertItem.run('item_5', 'Tea Bags', 'pack', 1, 'Bought');

  const insertExpense = db.prepare(`
    INSERT INTO expenses (id, title, category, amount, payer_id, split_type, date)
    VALUES (?, ?, ?, ?, ?, 'EQUAL', ?)
  `);

  const insertSplit = db.prepare(`
    INSERT INTO expense_splits (id, expense_id, member_id, owed_amount)
    VALUES (?, ?, ?, ?)
  `);

  // Expense 1: Ali pays 1,650.00 PKR (165,000 paisa) - 55,000 paisa each
  const exp1Id = 'exp_bench_1';
  insertExpense.run(exp1Id, 'Monthly Groceries', 'Groceries', pkrToPaisa(1650), 'M01', '2026-11-01');
  insertSplit.run('split_1_1', exp1Id, 'M01', 55000);
  insertSplit.run('split_1_2', exp1Id, 'M02', 55000);
  insertSplit.run('split_1_3', exp1Id, 'M03', 55000);

  // Expense 2: Ayesha pays 950.00 PKR (95,000 paisa) - 31,667 / 31,667 / 31,666 paisa
  const exp2Id = 'exp_bench_2';
  insertExpense.run(exp2Id, 'Internet & Gas Bill', 'Utilities', pkrToPaisa(950), 'M02', '2026-11-02');
  insertSplit.run('split_2_1', exp2Id, 'M01', 31667);
  insertSplit.run('split_2_2', exp2Id, 'M02', 31667);
  insertSplit.run('split_2_3', exp2Id, 'M03', 31666);

  // Expense 3: Bilal pays 1,600.00 PKR (160,000 paisa)
  const exp3Id = 'exp_bench_3';
  insertExpense.run(exp3Id, 'Maintenance & Repairs', 'Maintenance', pkrToPaisa(1600), 'M03', '2026-11-03');
  insertSplit.run('split_3_1', exp3Id, 'M01', 53333);
  insertSplit.run('split_3_2', exp3Id, 'M02', 53333);
  insertSplit.run('split_3_3', exp3Id, 'M03', 53334);

  // Net calculation:
  // Ali: paid 165,000, owed (55,000 + 31,667 + 53,334 = 140,001) -> net +24,999 paisa (+250.00 PKR with rounding)
  // Ayesha: paid 95,000, owed (55,000 + 31,667 + 53,333 = 140,000) -> net -45,000 paisa (-450.00 PKR)
  // Bilal: paid 160,000, owed (55,000 + 31,666 + 53,333 = 139,999) -> net +20,001 paisa (+200.00 PKR with rounding)
  // To make paisa exact integers:
  // Adjust: M01 share in exp3 to 53333, M03 share to 53334:
  // Ali: paid 165000, owed 55000 + 31667 + 53333 = 140000 -> +25,000 paisa = +250.00 PKR
  // Ayesha: paid 95000, owed 55000 + 31667 + 53333 = 140000 -> -45,000 paisa = -450.00 PKR
  // Bilal: paid 160000, owed 55000 + 31666 + 53334 = 140000 -> +20,000 paisa = +200.00 PKR
}
