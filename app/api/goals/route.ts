import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { PortfolioGoal } from '@/lib/types';

interface GoalRow { account_id: string; category: string; goal_percent: number }

function getGoals(accountId: string): PortfolioGoal[] {
  const rows = db.prepare('SELECT category, goal_percent FROM goals WHERE account_id = ? ORDER BY goal_percent DESC').all(accountId) as GoalRow[];
  return rows.map((r) => ({ category: r.category, goalPercent: r.goal_percent }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') ?? 'brokerage';
  return NextResponse.json(getGoals(accountId));
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') ?? 'brokerage';
  const goals = (await request.json()) as PortfolioGoal[];
  db.transaction(() => {
    db.prepare('DELETE FROM goals WHERE account_id = ?').run(accountId);
    const insert = db.prepare('INSERT INTO goals (account_id, category, goal_percent) VALUES (?, ?, ?)');
    for (const g of goals) insert.run(accountId, g.category, g.goalPercent);
  })();
  return NextResponse.json(goals);
}
