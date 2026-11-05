import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { AuthenticatedRequest } from '../types/index.js';

const tokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export function registerToken(req: AuthenticatedRequest, res: Response): void {
  const parsed = tokenSchema.parse(req.body);
  const memberId = req.member!.id;
  const now = new Date().toISOString();

  // Upsert device token
  db.prepare(`
    INSERT INTO device_tokens (token, member_id, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(token) DO UPDATE SET member_id = excluded.member_id, updated_at = excluded.updated_at
  `).run(parsed.token, memberId, now);

  res.status(200).json({ success: true });
}

export function removeToken(req: AuthenticatedRequest, res: Response): void {
  const parsed = tokenSchema.parse(req.body);

  db.prepare('DELETE FROM device_tokens WHERE token = ?').run(parsed.token);

  res.status(200).json({ success: true });
}
