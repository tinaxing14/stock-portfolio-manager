import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { AutoInvestment } from '@/lib/types';

interface AutoInvestRow {
  id: string; account_id: string; ticker: string; name: string;
  category: string; sub_category: string; brokerage: string;
  frequency: string; amount: number;
  next_run_at: string; last_run_at: string | null;
  created_at: string; updated_at: string;
}

function toAutoInvestment(row: AutoInvestRow): AutoInvestment {
  return {
    id: row.id, accountId: row.account_id, ticker: row.ticker, name: row.name,
    category: row.category, subCategory: row.sub_category, brokerage: row.brokerage,
    frequency: row.frequency as AutoInvestment['frequency'], amount: row.amount,
    nextRunAt: row.next_run_at, lastRunAt: row.last_run_at,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') ?? 'brokerage';
  const rows = db.prepare(
    'SELECT * FROM auto_investments WHERE account_id = ? ORDER BY created_at DESC'
  ).all(accountId) as AutoInvestRow[];
  return NextResponse.json(rows.map(toAutoInvestment));
}

export async function POST(request: Request) {
  const inv = (await request.json()) as AutoInvestment;
  db.prepare(`
    INSERT INTO auto_investments
      (id, account_id, ticker, name, category, sub_category, brokerage, frequency, amount, next_run_at, last_run_at, created_at, updated_at)
    VALUES
      (@id, @accountId, @ticker, @name, @category, @subCategory, @brokerage, @frequency, @amount, @nextRunAt, @lastRunAt, @createdAt, @updatedAt)
  `).run(inv);
  return NextResponse.json(inv, { status: 201 });
}
