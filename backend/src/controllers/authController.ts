import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';

export function getMe(req: AuthenticatedRequest, res: Response): void {
  if (!req.member) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.status(200).json({
    id: req.member.id,
    name: req.member.name,
    email: req.member.email,
  });
}
