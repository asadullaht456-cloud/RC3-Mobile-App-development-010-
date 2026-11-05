import { Router } from 'express';
import {
  getShoppingList,
  addShoppingItem,
  checkoutShopping,
} from '../controllers/shoppingController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getShoppingList);
router.post('/', authMiddleware, addShoppingItem);
router.post('/checkout', authMiddleware, checkoutShopping);

export default router;

