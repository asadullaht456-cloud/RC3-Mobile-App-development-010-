import { Router } from 'express';
import { createSettlement } from '../controllers/settlementController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, createSettlement);

export default router;

