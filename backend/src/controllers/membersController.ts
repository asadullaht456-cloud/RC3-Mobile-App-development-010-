import { Response } from 'express';
import { db } from '../db/connection.js';
import { AuthenticatedRequest } from '../types/index.js';

export function getMembers(_req: AuthenticatedRequest, res: Response): void {
  const stmt = db.prepare('SELECT id, name, email FROM members ORDER BY id ASC');
  const members = stmt.all();
  res.status(200).json(members);
}

export function addMember(req: AuthenticatedRequest, res: Response): void {
  const { name, email } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Valid member name is required' });
    return;
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'Valid member email is required' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // Check if email already registered
  const existing = db.prepare('SELECT id FROM members WHERE LOWER(email) = ?').get(cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'A member with this email already belongs to this house' });
    return;
  }

  // Calculate next sequential ID (e.g. M04, M05...)
  const allMembers = db.prepare('SELECT id FROM members').all() as { id: string }[];
  let maxId = 0;
  for (const m of allMembers) {
    const match = m.id.match(/^M(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxId) maxId = num;
    }
  }
  const nextId = `M${String(maxId + 1).padStart(2, '0')}`;

  db.prepare('INSERT INTO members (id, name, email) VALUES (?, ?, ?)').run(
    nextId,
    cleanName,
    cleanEmail
  );

  const created = db.prepare('SELECT id, name, email FROM members WHERE id = ?').get(nextId);
  res.status(201).json(created);
}

