import { Router } from 'express';
import { getMembers, addMember } from '../controllers/membersController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getMembers);
router.post('/', authMiddleware, addMember);

export default router;

