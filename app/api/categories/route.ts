import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { CategoryConfig } from '@/lib/types';

export async function GET() {
  return NextResponse.json(db.prepare('SELECT name, color FROM categories ORDER BY name').all());
}

export async function POST(request: Request) {
  const { name, color } = await request.json() as CategoryConfig;
  db.prepare('INSERT OR REPLACE INTO categories (name, color) VALUES (?, ?)').run(name, color);
  return NextResponse.json({ name, color }, { status: 201 });
}
