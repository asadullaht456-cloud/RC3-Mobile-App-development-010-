import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { initializeDatabase } from './db/schema.js';
import { seedDatabase } from './db/seed.js';

const PORT = Number(process.env.PORT) || 3000;

// Initialize DB schema & seeds
initializeDatabase();
seedDatabase();

const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Shared Living Backend server listening on http://0.0.0.0:${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
});
