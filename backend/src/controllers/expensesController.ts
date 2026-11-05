import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { AuthenticatedRequest } from '../types/index.js';
import { pkrToPaisa, paisaToPkr } from '../utils/money.js';
import { calculateEqualSplit, calculateBudget } from '../services/financialEngine.js';
import { sendNotificationToMembers, checkAndSendBudgetAlert } from '../services/notifications.js';

const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  payer_id: z.string().min(1, 'Payer ID is required'),
  split_type: z.enum(['EQUAL', 'CUSTOM']),
  date: z.string().min(1, 'Date is required'),
  splits: z
    .array(
      z.object({
        member_id: z.string(),
        amount: z.number().optional(),
        owed_amount: z.number().optional(),
      })
    )
    .optional(),
});

export function getExpensesList(_req: AuthenticatedRequest, res: Response): void {
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC, rowid DESC').all();

  const formatted = expenses.map((e: any) => {
    const splits = db.prepare('SELECT member_id, owed_amount FROM expense_splits WHERE expense_id = ?').all(e.id);
    return {
      id: e.id,
      title: e.title,
      category: e.category,
      amount: paisaToPkr(e.amount),
      payer_id: e.payer_id,
      split_type: e.split_type,
      date: e.date,
      splits: splits.map((s: any) => ({
        member_id: s.member_id,
        owed_amount: paisaToPkr(s.owed_amount),
      })),
    };
  });

  res.status(200).json(formatted);
}

export async function createExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parsed = createExpenseSchema.parse(req.body);
  const totalPaisa = pkrToPaisa(parsed.amount);

  // Validate payer exists
  const payer = db.prepare('SELECT id, name FROM members WHERE id = ?').get(parsed.payer_id) as { id: string; name: string } | undefined;
  if (!payer) {
    res.status(400).json({ error: 'Payer member does not exist' });
    return;
  }

  // Calculate splits
  let splitRows: { member_id: string; owed_paisa: number }[] = [];

  if (parsed.split_type === 'EQUAL') {
    const splitMemberIds =
      parsed.splits && parsed.splits.length > 0
        ? parsed.splits.map((s) => s.member_id)
        : (db.prepare('SELECT id FROM members').all() as { id: string }[]).map((m) => m.id);

    splitRows = calculateEqualSplit(totalPaisa, splitMemberIds);
  } else {
    // Custom split validation
    if (!parsed.splits || parsed.splits.length === 0) {
      res.status(400).json({ error: 'Custom split requires splits array' });
      return;
    }

    let customSumPaisa = 0;
    for (const s of parsed.splits) {
      const val = s.owed_amount ?? s.amount ?? 0;
      const paisa = pkrToPaisa(val);
      customSumPaisa += paisa;
      splitRows.push({ member_id: s.member_id, owed_paisa: paisa });
    }

    if (customSumPaisa !== totalPaisa) {
      res.status(400).json({
        error: `Custom splits (${paisaToPkr(customSumPaisa)} PKR) must equal total amount (${parsed.amount} PKR) exactly`,
      });
      return;
    }
  }

  const expenseId = `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Insert in transaction
  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare(`
      INSERT INTO expenses (id, title, category, amount, payer_id, split_type, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(expenseId, parsed.title, parsed.category, totalPaisa, parsed.payer_id, parsed.split_type, parsed.date);

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
    id: expenseId,
    title: parsed.title,
    category: parsed.category,
    amount: parsed.amount,
    payer_id: parsed.payer_id,
    split_type: parsed.split_type,
    date: parsed.date,
    splits: splitRows.map((s) => ({
      member_id: s.member_id,
      owed_amount: paisaToPkr(s.owed_paisa),
    })),
  };

  res.status(201).json(responsePayload);

  // Push notification fire-and-forget
  const otherMembers = splitRows.filter((s) => s.member_id !== parsed.payer_id);
  for (const recipient of otherMembers) {
    sendNotificationToMembers(
      [recipient.member_id],
      'Expense Added',
      `You owe PKR ${paisaToPkr(recipient.owed_paisa).toFixed(2)} for ${parsed.title}`,
      { type: 'EXPENSE_ADDED', screen: 'Expenses', reference_id: expenseId }
    );
  }

  // Check budget status
  const budgetInfo = calculateBudget();
  checkAndSendBudgetAlert(budgetInfo.status, budgetInfo.spent_percentage);
}
