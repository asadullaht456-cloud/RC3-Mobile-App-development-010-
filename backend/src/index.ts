import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { initializeDatabase } from './db/schema.js';
import { seedBenchmarkData } from './db/seedBenchmark.js';

const PORT = Number(process.env.PORT) || 3000;

// Initialize DB schema & benchmark data
initializeDatabase();
seedBenchmarkData();

const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Shared Living Backend server listening on http://0.0.0.0:${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
});
