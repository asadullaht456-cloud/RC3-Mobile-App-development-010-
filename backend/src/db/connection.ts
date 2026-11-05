import { DatabaseSync } from 'node:sqlite';
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

export interface Statement {
  run(...params: any[]): any;
  get(...params: any[]): any;
  all(...params: any[]): any[];
}

export interface Database {
  exec(sql: string): void;
  prepare(sql: string): Statement;
  pragma(sql: string): any;
}

class SqliteDatabase implements Database {
  private rawDb: DatabaseSync;

  constructor(filePath: string) {
    this.rawDb = new DatabaseSync(filePath);
  }

  exec(sql: string): void {
    this.rawDb.exec(sql);
  }

  prepare(sql: string): Statement {
    const stmt = this.rawDb.prepare(sql);
    return {
      run: (...params: any[]) => stmt.run(...params),
      get: (...params: any[]) => stmt.get(...params),
      all: (...params: any[]) => stmt.all(...params),
    };
  }

  pragma(pragmaSql: string): any {
    return this.rawDb.exec(`PRAGMA ${pragmaSql}`);
  }
}

export const db: Database = new SqliteDatabase(dbPath);

// Enable foreign keys and WAL mode for better concurrency and persistence
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
