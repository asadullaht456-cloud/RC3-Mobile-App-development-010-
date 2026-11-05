import { Router } from 'express';
import { registerToken, removeToken } from '../controllers/deviceController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/token', authMiddleware, registerToken);
router.delete('/token', authMiddleware, removeToken);

export default router;

