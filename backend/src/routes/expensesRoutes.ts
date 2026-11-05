import { Router } from 'express';
import { getExpensesList, createExpense } from '../controllers/expensesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getExpensesList);
router.post('/', authMiddleware, createExpense);

export default router;

