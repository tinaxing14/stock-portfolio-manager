import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Holding } from '@/lib/types';

interface HoldingRow {
  id: string; ticker: string; name: string;
  shares: number; current_price: number;
  brokerage: string; category: string; sub_category: string;
  account_id: string; created_at: string; updated_at: string;
}

function toHolding(row: HoldingRow): Holding {
  return {
    id: row.id, ticker: row.ticker, name: row.name,
    shares: row.shares, currentPrice: row.current_price,
    brokerage: row.brokerage, category: row.category,
    subCategory: row.sub_category ?? '',
    accountId: row.account_id,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') ?? 'brokerage';
  const rows = db.prepare('SELECT * FROM holdings WHERE account_id = ? ORDER BY category, ticker').all(accountId) as HoldingRow[];
  return NextResponse.json(rows.map(toHolding));
}

export async function POST(request: Request) {
  const holding = (await request.json()) as Holding;
  db.prepare(`
    INSERT INTO holdings (id, ticker, name, shares, current_price, brokerage, category, sub_category, account_id, created_at, updated_at)
    VALUES (@id, @ticker, @name, @shares, @currentPrice, @brokerage, @category, @subCategory, @accountId, @createdAt, @updatedAt)
  `).run(holding);
  return NextResponse.json(holding, { status: 201 });
}
