import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') ?? 'brokerage';

  const rows = db.prepare(
    'SELECT date, value FROM portfolio_snapshots WHERE account_id = ? ORDER BY date ASC'
  ).all(accountId) as { date: string; value: number }[];

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') ?? 'brokerage';

  // Compute value server-side so the client doesn't need to pass it
  const row = db.prepare(
    'SELECT COALESCE(SUM(shares * current_price), 0) as value FROM holdings WHERE account_id = ?'
  ).get(accountId) as { value: number };

  if (row.value === 0) return NextResponse.json({ recorded: false });

  const now = new Date().toISOString();
  const date = now.slice(0, 10); // YYYY-MM-DD

  db.prepare(`
    INSERT INTO portfolio_snapshots (account_id, date, value, recorded_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(account_id, date) DO UPDATE SET value = excluded.value, recorded_at = excluded.recorded_at
  `).run(accountId, date, row.value, now);

  return NextResponse.json({ recorded: true, date, value: row.value });
}
