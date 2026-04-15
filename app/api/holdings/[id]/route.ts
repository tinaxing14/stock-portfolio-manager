import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Holding } from '@/lib/types';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const holding = await request.json() as Holding;
  const result = db.prepare(`
    UPDATE holdings
    SET ticker = @ticker, name = @name, shares = @shares,
        current_price = @currentPrice, brokerage = @brokerage,
        category = @category, sub_category = @subCategory, updated_at = @updatedAt
    WHERE id = @id
  `).run(holding);
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(holding);
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = db.prepare('DELETE FROM holdings WHERE id = ?').run(id);
  if (result.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
