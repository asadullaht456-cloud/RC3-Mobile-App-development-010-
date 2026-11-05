import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { AuthenticatedRequest } from '../types/index.js';
import { pkrToPaisa, paisaToPkr } from '../utils/money.js';
import { calculateBalances } from '../services/financialEngine.js';
import { sendNotificationToMembers } from '../services/notifications.js';

const settleSchema = z.object({
  sender_id: z.string().min(1, 'Sender ID is required'),
  recipient_id: z.string().min(1, 'Recipient ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
});

export async function createSettlement(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parsed = settleSchema.parse(req.body);

  if (parsed.sender_id === parsed.recipient_id) {
    res.status(400).json({ error: 'Sender and recipient cannot be the same member' });
    return;
  }

  const { balances } = calculateBalances();
  const senderBalance = balances.find((b) => b.member_id === parsed.sender_id);
  const recipientBalance = balances.find((b) => b.member_id === parsed.recipient_id);

  if (!senderBalance || !recipientBalance) {
    res.status(400).json({ error: 'Sender or recipient does not exist' });
    return;
  }

  // Sender must owe money (net_balance < 0)
  if (senderBalance.net_balance >= 0) {
    res.status(400).json({
      error: `Sender ${senderBalance.name} does not currently owe any money`,
    });
    return;
  }

  // Recipient must be owed money (net_balance > 0)
  if (recipientBalance.net_balance <= 0) {
    res.status(400).json({
      error: `Recipient ${recipientBalance.name} is not currently owed any money`,
    });
    return;
  }

  const senderDebt = Math.abs(senderBalance.net_balance);
  const recipientCredit = recipientBalance.net_balance;

  // Over-settlement rejection
  if (parsed.amount > senderDebt + 0.001) {
    res.status(400).json({
      error: `Amount exceeds sender's total debt of ${senderDebt.toFixed(2)} PKR`,
    });
    return;
  }

  if (parsed.amount > recipientCredit + 0.001) {
    res.status(400).json({
      error: `Amount exceeds recipient's outstanding credit of ${recipientCredit.toFixed(2)} PKR`,
    });
    return;
  }

  const settleId = `settle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const settlePaisa = pkrToPaisa(parsed.amount);
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO settlements (id, sender_id, recipient_id, amount, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(settleId, parsed.sender_id, parsed.recipient_id, settlePaisa, createdAt);

  const responsePayload = {
    id: settleId,
    sender_id: parsed.sender_id,
    recipient_id: parsed.recipient_id,
    amount: parsed.amount,
    created_at: createdAt,
  };

  res.status(200).json(responsePayload);

  // Send push notification to recipient
  sendNotificationToMembers(
    [parsed.recipient_id],
    'Settlement Received',
    `${senderBalance.name} paid you PKR ${parsed.amount.toFixed(2)}`,
    { type: 'SETTLEMENT_RECORDED', screen: 'Expenses', reference_id: settleId }
  );
}

