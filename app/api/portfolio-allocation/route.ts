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

  const isIra = (accountId: string) => /ira/i.test(nameMap[accountId] ?? '');

  const byAccount = rows
    .map((r) => ({
      accountId: r.account_id,
      name: nameMap[r.account_id] ?? r.account_id,
      cash: r.cash ?? 0,
      invested: r.invested ?? 0,
      total: (r.cash ?? 0) + (r.invested ?? 0),
      isIra: isIra(r.account_id),
    }))
    .sort((a, b) => b.total - a.total);

  const totalCash     = byAccount.reduce((s, r) => s + r.cash,     0);
  const totalInvested = byAccount.reduce((s, r) => s + r.invested, 0);
  const total         = totalCash + totalInvested;

  const nonIraRows    = byAccount.filter((r) => !r.isIra);
  const nonIraCash     = nonIraRows.reduce((s, r) => s + r.cash,     0);
  const nonIraInvested = nonIraRows.reduce((s, r) => s + r.invested, 0);
  const nonIraTotal    = nonIraCash + nonIraInvested;

  return NextResponse.json({
    total,
    totalCash,
    totalInvested,
    cashPct:     total > 0 ? (totalCash     / total) * 100 : 0,
    investedPct: total > 0 ? (totalInvested / total) * 100 : 0,
    byAccount,
    nonIra: {
      total: nonIraTotal,
      totalCash: nonIraCash,
      totalInvested: nonIraInvested,
      cashPct:     nonIraTotal > 0 ? (nonIraCash     / nonIraTotal) * 100 : 0,
      investedPct: nonIraTotal > 0 ? (nonIraInvested / nonIraTotal) * 100 : 0,
      byAccount: nonIraRows,
    },
  });
}
