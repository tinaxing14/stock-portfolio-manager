import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Account } from '@/lib/types';
import { generateId } from '@/lib/utils';

export async function GET() {
  const rows = db.prepare('SELECT id, name, type, created_at FROM accounts ORDER BY created_at').all() as { id: string; name: string; type: string; created_at: string }[];
  return NextResponse.json(rows.map((r) => ({ id: r.id, name: r.name, type: (r.type ?? 'stock') as Account['type'], createdAt: r.created_at })));
}

export async function POST(request: Request) {
  const { name, type = 'stock' } = await request.json() as { name: string; type?: Account['type'] };
  const id = generateId();
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO accounts (id, name, type, created_at) VALUES (?, ?, ?, ?)').run(id, name, type, createdAt);
  return NextResponse.json({ id, name, type, createdAt } satisfies Account, { status: 201 });
}
