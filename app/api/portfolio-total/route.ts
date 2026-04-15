import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const row = db.prepare('SELECT SUM(shares * current_price) as total FROM holdings').get() as { total: number | null };
  const total = row.total ?? 0;

  const byAccount = db.prepare(
    'SELECT account_id, SUM(shares * current_price) as value FROM holdings GROUP BY account_id'
  ).all() as { account_id: string; value: number }[];

  const accounts = byAccount.map(({ account_id, value }) => ({
    accountId: account_id,
    value,
    percent: total > 0 ? (value / total) * 100 : 0,
  }));

  return NextResponse.json({ total, accounts });
}
