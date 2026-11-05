import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { calculateBalances, calculateBudget } from '../services/financialEngine.js';

export function getBalances(_req: AuthenticatedRequest, res: Response): void {
  const result = calculateBalances();
  res.status(200).json(result);
}

export function getBudget(_req: AuthenticatedRequest, res: Response): void {
  const result = calculateBudget();
  res.status(200).json(result);
}
