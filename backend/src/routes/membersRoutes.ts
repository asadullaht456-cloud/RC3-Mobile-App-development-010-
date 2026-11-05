import { Router } from 'express';
import { getMembers } from '../controllers/membersController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getMembers);

export default router;
