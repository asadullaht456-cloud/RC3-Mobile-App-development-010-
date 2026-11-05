import { Response } from 'express';
import { db } from '../db/connection.js';
import { AuthenticatedRequest } from '../types/index.js';

export function getMembers(_req: AuthenticatedRequest, res: Response): void {
  const stmt = db.prepare('SELECT id, name, email FROM members ORDER BY id ASC');
  const members = stmt.all();
  res.status(200).json(members);
}

