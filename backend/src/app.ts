import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import membersRoutes from './routes/membersRoutes.js';
import shoppingRoutes from './routes/shoppingRoutes.js';
import expensesRoutes from './routes/expensesRoutes.js';
import financesRoutes from './routes/financesRoutes.js';
import settlementRoutes from './routes/settlementRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';

export function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json());

  // Health check (unprotected)
  app.use('/api', healthRoutes);

  // Protected API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/members', membersRoutes);
  app.use('/api/shopping', shoppingRoutes);
  app.use('/api/expenses', expensesRoutes);
  app.use('/api', financesRoutes); // /api/balances, /api/budget
  app.use('/api/settle', settlementRoutes);
  app.use('/api/devices', deviceRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
