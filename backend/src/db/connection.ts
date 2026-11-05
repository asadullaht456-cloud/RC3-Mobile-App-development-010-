import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const defaultDbPath = path.resolve(process.cwd(), 'data', 'shared_living.db');
const dbPath = process.env.DATABASE_PATH ? path.resolve(process.cwd(), process.env.DATABASE_PATH) : defaultDbPath;

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: Database.Database = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency and persistence
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;

