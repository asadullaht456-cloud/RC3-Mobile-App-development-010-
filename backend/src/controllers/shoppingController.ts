import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { AuthenticatedRequest, ShoppingItem } from '../types/index.js';
import { pkrToPaisa, paisaToPkr } from '../utils/money.js';
import { calculateEqualSplit, calculateBudget } from '../services/financialEngine.js';
import { sendNotificationToMembers, checkAndSendBudgetAlert } from '../services/notifications.js';

const createShoppingItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  unit: z.enum(['pack', 'dozen', 'bottle', 'bag'], {
    errorMap: () => ({ message: "Unit must be one of 'pack', 'dozen', 'bottle', 'bag'" }),
  }),
  requested_qty: z.number().int().min(1, 'Quantity must be at least 1'),
});

const checkoutSchema = z.object({
  item_ids: z.array(z.string()).min(1, 'At least one item must be selected'),
  total_paid: z.number().positive('Total paid must be greater than 0'),
  payer_id: z.string().min(1, 'Payer ID is required'),
  split_members: z.array(z.string()).min(1, 'At least one split member is required'),
});

export function getShoppingList(_req: AuthenticatedRequest, res: Response): void {
  const stmt = db.prepare('SELECT * FROM shopping_items ORDER BY rowid DESC');
  const items = stmt.all() as ShoppingItem[];
  res.status(200).json(items);
}

export function addShoppingItem(req: AuthenticatedRequest, res: Response): void {
  const parsed = createShoppingItemSchema.parse(req.body);

  const id = `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const status = 'Pending';

  const stmt = db.prepare(`
    INSERT INTO shopping_items (id, title, unit, requested_qty, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, parsed.title, parsed.unit, parsed.requested_qty, status);

  const newItem: ShoppingItem = {
    id,
    title: parsed.title,
    unit: parsed.unit,
    requested_qty: parsed.requested_qty,
    status,
  };

  res.status(201).json(newItem);
}

export async function checkoutShopping(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parsed = checkoutSchema.parse(req.body);
  const totalPaisa = pkrToPaisa(parsed.total_paid);

  const payer = db.prepare('SELECT id, name FROM members WHERE id = ?').get(parsed.payer_id);
  if (!payer) {
    res.status(400).json({ error: 'Payer member does not exist' });
    return;
  }

  const expenseId = `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const title = `Checkout: ${parsed.item_ids.length} item${parsed.item_ids.length > 1 ? 's' : ''}`;
  const category = 'Groceries';
  const today = new Date().toISOString().split('T')[0];

  const splitRows = calculateEqualSplit(totalPaisa, parsed.split_members);

  db.exec('BEGIN TRANSACTION');
  try {
    // 1. Mark items as Bought
    const updateItem = db.prepare("UPDATE shopping_items SET status = 'Bought' WHERE id = ?");
    for (const itemId of parsed.item_ids) {
      updateItem.run(itemId);
    }

    // 2. Insert expense
    db.prepare(`
      INSERT INTO expenses (id, title, category, amount, payer_id, split_type, date)
      VALUES (?, ?, ?, ?, ?, 'EQUAL', ?)
    `).run(expenseId, title, category, totalPaisa, parsed.payer_id, today);

    // 3. Insert splits
    const insertSplit = db.prepare(`
      INSERT INTO expense_splits (id, expense_id, member_id, owed_amount)
      VALUES (?, ?, ?, ?)
    `);

    for (const split of splitRows) {
      const splitId = `split_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      insertSplit.run(splitId, expenseId, split.member_id, split.owed_paisa);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const responsePayload = {
    success: true,
    expense: {
      id: expenseId,
      title,
      category,
      amount: parsed.total_paid,
      payer_id: parsed.payer_id,
      split_type: 'EQUAL',
      date: today,
    },
    bought_item_ids: parsed.item_ids,
  };

  res.status(201).json(responsePayload);

  // Send push notification fire-and-forget
  const otherMembers = splitRows.filter((s) => s.member_id !== parsed.payer_id);
  for (const recipient of otherMembers) {
    sendNotificationToMembers(
      [recipient.member_id],
      'Expense Added',
      `You owe PKR ${paisaToPkr(recipient.owed_paisa).toFixed(2)} for ${category}`,
      { type: 'EXPENSE_ADDED', screen: 'Expenses', reference_id: expenseId }
    );
  }

  const budgetInfo = calculateBudget();
  checkAndSendBudgetAlert(budgetInfo.status, budgetInfo.spent_percentage);
}
