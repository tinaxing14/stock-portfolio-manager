import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(_req: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  db.prepare('DELETE FROM brokerages WHERE name = ?').run(decodeURIComponent(name));
  return new NextResponse(null, { status: 204 });
}
