import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key') ?? 'dashboard';
  const row = db.prepare('SELECT content FROM notes WHERE key = ?').get(key) as { content: string } | undefined;
  return NextResponse.json({ content: row?.content ?? '' });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key') ?? 'dashboard';
  const { content } = await request.json() as { content: string };
  const now = new Date().toISOString();
  db.prepare('INSERT OR REPLACE INTO notes (key, content, updated_at) VALUES (?, ?, ?)').run(key, content, now);
  return NextResponse.json({ key, content });
}
