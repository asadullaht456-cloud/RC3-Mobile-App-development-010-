import { db } from './connection.js';

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      firebase_uid TEXT
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      unit TEXT NOT NULL CHECK(unit IN ('pack', 'dozen', 'bottle', 'bag')),
      requested_qty INTEGER NOT NULL CHECK(requested_qty > 0),
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Bought'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK(amount > 0),
      payer_id TEXT NOT NULL REFERENCES members(id),
      split_type TEXT NOT NULL CHECK(split_type IN ('EQUAL', 'CUSTOM')),
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expense_splits (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES members(id),
      owed_amount INTEGER NOT NULL CHECK(owed_amount >= 0)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES members(id),
      recipient_id TEXT NOT NULL REFERENCES members(id),
      amount INTEGER NOT NULL CHECK(amount > 0),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS device_tokens (
      token TEXT PRIMARY KEY,
      member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      updated_at TEXT NOT NULL
    );
  `);
}
