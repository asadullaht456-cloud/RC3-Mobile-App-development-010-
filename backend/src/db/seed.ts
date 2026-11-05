import { db } from './connection.js';

export function seedDatabase(): void {
  // Check if members already exist
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM members');
  const result = countStmt.get() as { count: number };

  if (result.count === 0) {
    const insertMember = db.prepare(`
      INSERT INTO members (id, name, email, firebase_uid)
      VALUES (?, ?, ?, NULL)
    `);

    insertMember.run('M01', 'Ali', 'ali@demo.com');
    insertMember.run('M02', 'Ayesha', 'ayesha@demo.com');
    insertMember.run('M03', 'Bilal', 'bilal@demo.com');

    console.log('🌱 Seeded 3 initial members: Ali (M01), Ayesha (M02), Bilal (M03)');
  }

  // Seed default settings if not exists
  const budgetStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const budgetSetting = budgetStmt.get('monthly_budget');

  if (!budgetSetting) {
    const insertSetting = db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
    `);
    // 5000.00 PKR = 500000 paisa
    insertSetting.run('monthly_budget', '500000');
    console.log('🌱 Seeded default monthly budget: 5,000.00 PKR (500000 paisa)');
  }
}

export function resetToSeed(): void {
  db.exec(`
    DELETE FROM settlements;
    DELETE FROM expense_splits;
    DELETE FROM expenses;
    DELETE FROM shopping_items;
    DELETE FROM device_tokens;
    DELETE FROM settings;
    DELETE FROM members;
  `);
  seedDatabase();
}

