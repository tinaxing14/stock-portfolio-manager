import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { DEFAULT_CATEGORIES, DEFAULT_BROKERAGES, DEFAULT_ACCOUNTS, DEFAULT_GOALS } from './constants';

// Real data: ~/.stock-portfolio/portfolio.db  (outside git, survives branch switches)
// Mock data: data/mock-portfolio.db           (committed, tripled values for demos)
//
// Run with real data:  npm run dev
// Run with mock data:  npm run dev:mock
const HOME_DB = path.join(os.homedir(), '.stock-portfolio', 'portfolio.db');
const MOCK_DB = path.join(process.cwd(), 'data', 'mock-portfolio.db');
const DB_PATH = process.env.MOCK_DATA === 'true' ? MOCK_DB : HOME_DB;

const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Core tables
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    name  TEXT PRIMARY KEY,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS brokerages (
    name  TEXT PRIMARY KEY,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS holdings (
    id            TEXT PRIMARY KEY,
    ticker        TEXT NOT NULL,
    name          TEXT NOT NULL,
    shares        REAL NOT NULL,
    current_price REAL NOT NULL,
    brokerage     TEXT NOT NULL,
    category      TEXT NOT NULL,
    account_id    TEXT NOT NULL DEFAULT 'brokerage',
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS goals (
    account_id   TEXT NOT NULL,
    category     TEXT NOT NULL,
    goal_percent REAL NOT NULL,
    PRIMARY KEY (account_id, category)
  );

  CREATE TABLE IF NOT EXISTS notes (
    key        TEXT PRIMARY KEY,
    content    TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auto_investments (
    id           TEXT PRIMARY KEY,
    account_id   TEXT NOT NULL,
    ticker       TEXT NOT NULL,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL DEFAULT '',
    sub_category TEXT NOT NULL DEFAULT '',
    brokerage    TEXT NOT NULL DEFAULT '',
    frequency    TEXT NOT NULL,
    amount       REAL NOT NULL,
    next_run_at  TEXT NOT NULL,
    last_run_at  TEXT,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    account_id  TEXT NOT NULL,
    date        TEXT NOT NULL,
    value       REAL NOT NULL,
    recorded_at TEXT NOT NULL,
    PRIMARY KEY (account_id, date)
  );
`);

// Migrations: add columns if missing
try { db.exec(`ALTER TABLE holdings ADD COLUMN account_id TEXT NOT NULL DEFAULT 'brokerage'`); } catch { /* exists */ }
try { db.exec(`ALTER TABLE holdings ADD COLUMN sub_category TEXT NOT NULL DEFAULT ''`); } catch { /* exists */ }
try { db.exec(`ALTER TABLE accounts ADD COLUMN type TEXT NOT NULL DEFAULT 'stock'`); } catch { /* exists */ }

// Migrate: re-create goals table with account_id if it's still the old schema
const goalsCols = (db.prepare(`PRAGMA table_info(goals)`).all() as { name: string }[]).map((c) => c.name);
if (!goalsCols.includes('account_id')) {
  db.exec(`
    DROP TABLE goals;
    CREATE TABLE goals (
      account_id   TEXT NOT NULL,
      category     TEXT NOT NULL,
      goal_percent REAL NOT NULL,
      PRIMARY KEY (account_id, category)
    );
  `);
}

// Seed defaults on first run
const seedIfEmpty = db.transaction(() => {
  if ((db.prepare('SELECT COUNT(*) as n FROM accounts').get() as { n: number }).n === 0) {
    const ins = db.prepare('INSERT OR IGNORE INTO accounts (id, name, created_at) VALUES (?, ?, ?)');
    for (const a of DEFAULT_ACCOUNTS) ins.run(a.id, a.name, a.createdAt);
  }
  if ((db.prepare('SELECT COUNT(*) as n FROM categories').get() as { n: number }).n === 0) {
    const ins = db.prepare('INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)');
    for (const c of DEFAULT_CATEGORIES) ins.run(c.name, c.color);
  }
  if ((db.prepare('SELECT COUNT(*) as n FROM brokerages').get() as { n: number }).n === 0) {
    const ins = db.prepare('INSERT OR IGNORE INTO brokerages (name, color) VALUES (?, ?)');
    for (const b of DEFAULT_BROKERAGES) ins.run(b.name, b.color);
  }
  const brokerageGoalCount = (db.prepare(`SELECT COUNT(*) as n FROM goals WHERE account_id = 'brokerage'`).get() as { n: number }).n;
  if (brokerageGoalCount === 0) {
    const ins = db.prepare('INSERT OR IGNORE INTO goals (account_id, category, goal_percent) VALUES (?, ?, ?)');
    for (const g of DEFAULT_GOALS) ins.run('brokerage', g.category, g.goalPercent);
  }
});
seedIfEmpty();

export default db;
