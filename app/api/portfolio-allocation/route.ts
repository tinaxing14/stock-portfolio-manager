import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const rows = db.prepare(`
    SELECT
      account_id,
      SUM(CASE WHEN category = 'Cash' THEN shares * current_price ELSE 0 END) AS cash,
      SUM(CASE WHEN category != 'Cash' THEN shares * current_price ELSE 0 END) AS invested
    FROM holdings
    GROUP BY account_id
  `).all() as { account_id: string; cash: number; invested: number }[];

  const accounts = db.prepare('SELECT id, name FROM accounts').all() as { id: string; name: string }[];
  const nameMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  const totalCash     = rows.reduce((s, r) => s + (r.cash     ?? 0), 0);
  const totalInvested = rows.reduce((s, r) => s + (r.invested ?? 0), 0);
  const total         = totalCash + totalInvested;

  const byAccount = rows
    .map((r) => ({
      accountId: r.account_id,
      name: nameMap[r.account_id] ?? r.account_id,
      cash: r.cash ?? 0,
      invested: r.invested ?? 0,
      total: (r.cash ?? 0) + (r.invested ?? 0),
    }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    total,
    totalCash,
    totalInvested,
    cashPct:     total > 0 ? (totalCash     / total) * 100 : 0,
    investedPct: total > 0 ? (totalInvested / total) * 100 : 0,
    byAccount,
  });
}
