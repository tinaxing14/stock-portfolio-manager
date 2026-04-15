import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  db.transaction(() => {
    db.prepare('DELETE FROM holdings WHERE account_id = ?').run(id);
    db.prepare('DELETE FROM goals WHERE account_id = ?').run(id);
    db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  })();
  return new NextResponse(null, { status: 204 });
}
