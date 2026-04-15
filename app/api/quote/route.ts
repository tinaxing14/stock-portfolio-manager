import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)({ suppressNotices: ['yahooSurvey'] });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols') ?? '';
  const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);

  if (!symbols.length) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  const results: Record<string, { price: number | null; name: string | null }> = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      if (symbol === 'CASH') {
        results[symbol] = { price: null, name: 'Cash' };
        return;
      }
      try {
        const quote = await yf.quote(symbol) as any;
        results[symbol] = {
          price: quote.regularMarketPrice ?? null,
          name: quote.shortName ?? quote.longName ?? null,
        };
      } catch {
        results[symbol] = { price: null, name: null };
      }
    })
  );

  return NextResponse.json(results);
}
