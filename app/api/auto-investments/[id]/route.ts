import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { AutoInvestment } from '@/lib/types';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const inv = (await request.json()) as AutoInvestment;
  const result = db.prepare(`
    UPDATE auto_investments
    SET ticker = @ticker, name = @name, category = @category, sub_category = @subCategory,
        brokerage = @brokerage, frequency = @frequency, amount = @amount,
        next_run_at = @nextRunAt, updated_at = @updatedAt
    WHERE id = @id
  `).run(inv);
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(inv);
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = db.prepare('DELETE FROM auto_investments WHERE id = ?').run(id);
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
