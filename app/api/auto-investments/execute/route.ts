import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { AutoInvestment, Holding } from '@/lib/types';

interface AutoInvestRow {
  id: string; account_id: string; ticker: string; name: string;
  category: string; sub_category: string; brokerage: string;
  frequency: string; amount: number;
  next_run_at: string; last_run_at: string | null;
  created_at: string; updated_at: string;
}

interface HoldingRow {
  id: string; ticker: string; name: string;
  shares: number; current_price: number; brokerage: string;
  category: string; sub_category: string; account_id: string;
  created_at: string; updated_at: string;
}

function toHolding(row: HoldingRow): Holding {
  return {
    id: row.id, ticker: row.ticker, name: row.name,
    shares: row.shares, currentPrice: row.current_price,
    brokerage: row.brokerage, category: row.category,
    subCategory: row.sub_category ?? '', accountId: row.account_id,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
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

function advanceDate(isoDate: string, frequency: string): string {
  const d = new Date(isoDate);
  switch (frequency) {
    case 'weekly':    d.setDate(d.getDate() + 7); break;
    case 'biweekly':  d.setDate(d.getDate() + 14); break;
    case 'monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
  }
  return d.toISOString();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// POST /api/auto-investments/execute
// Query params:
//   accountId=<id>&checkDue=true — catch up all overdue investments for the account
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') ?? 'brokerage';
  const checkDue = searchParams.get('checkDue') === 'true';

  const now = new Date().toISOString();

  if (!checkDue) {
    return NextResponse.json({ error: 'Provide checkDue=true' }, { status: 400 });
  }

  const investments = db.prepare(
    "SELECT * FROM auto_investments WHERE account_id = ? AND next_run_at <= ?"
  ).all(accountId, now) as AutoInvestRow[];

  const updatedHoldings: Holding[] = [];
  const updatedInvestments: AutoInvestment[] = [];

  for (const inv of investments) {
    // Determine how many periods are due
    let periods = 0;
    let nextRunAt = inv.next_run_at;

    while (new Date(nextRunAt) <= new Date(now)) {
      periods++;
      nextRunAt = advanceDate(nextRunAt, inv.frequency);
    }

    if (periods === 0) continue;

    const totalAmount = inv.amount * periods;

    // Match by ticker + account + brokerage (when set) so the same ticker at
    // two different brokerages (e.g. VFIAX at Vanguard vs Robinhood) stays separate
    const holding = (
      inv.brokerage
        ? db.prepare('SELECT * FROM holdings WHERE ticker = ? AND account_id = ? AND brokerage = ? LIMIT 1')
            .get(inv.ticker, inv.account_id, inv.brokerage)
        : db.prepare('SELECT * FROM holdings WHERE ticker = ? AND account_id = ? LIMIT 1')
            .get(inv.ticker, inv.account_id)
    ) as HoldingRow | undefined;

    let resultHolding: Holding;

    if (holding && holding.current_price > 0) {
      const addedShares = totalAmount / holding.current_price;
      const newShares = holding.shares + addedShares;
      db.prepare('UPDATE holdings SET shares = ?, updated_at = ? WHERE id = ?')
        .run(newShares, now, holding.id);
      resultHolding = toHolding({ ...holding, shares: newShares, updated_at: now });
    } else if (holding) {
      // Holding exists but price is 0 — add dollar amount as shares (price=1 placeholder)
      const newShares = holding.shares + totalAmount;
      db.prepare('UPDATE holdings SET shares = ?, current_price = 1, updated_at = ? WHERE id = ?')
        .run(newShares, now, holding.id);
      resultHolding = toHolding({ ...holding, shares: newShares, current_price: 1, updated_at: now });
    } else {
      // No holding yet — create one (price placeholder = 1, user should refresh prices)
      const newId = generateId();
      const newRow: HoldingRow = {
        id: newId, ticker: inv.ticker, name: inv.name,
        shares: totalAmount, current_price: 1,
        brokerage: inv.brokerage || 'Other', category: inv.category || 'Other',
        sub_category: inv.sub_category, account_id: inv.account_id,
        created_at: now, updated_at: now,
      };
      db.prepare(`
        INSERT INTO holdings (id, ticker, name, shares, current_price, brokerage, category, sub_category, account_id, created_at, updated_at)
        VALUES (@id, @ticker, @name, @shares, @current_price, @brokerage, @category, @sub_category, @account_id, @created_at, @updated_at)
      `).run(newRow);
      resultHolding = toHolding(newRow);
    }

    updatedHoldings.push(resultHolding);

    // Advance the schedule
    db.prepare('UPDATE auto_investments SET next_run_at = ?, last_run_at = ?, updated_at = ? WHERE id = ?')
      .run(nextRunAt, now, now, inv.id);
    updatedInvestments.push(toAutoInvestment({ ...inv, next_run_at: nextRunAt, last_run_at: now, updated_at: now }));
  }

  return NextResponse.json({ updatedHoldings, updatedInvestments });
}
