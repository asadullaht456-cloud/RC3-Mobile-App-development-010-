import { Router } from 'express';
import { getBalances, getBudget } from '../controllers/financesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/balances', authMiddleware, getBalances);
router.get('/budget', authMiddleware, getBudget);

export default router;
