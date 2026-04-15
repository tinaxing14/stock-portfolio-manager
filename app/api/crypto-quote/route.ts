import { NextResponse } from 'next/server';

// Well-known symbol → CoinGecko ID mapping for instant lookups without a search call
const KNOWN: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  XRP: 'ripple', ADA: 'cardano', AVAX: 'avalanche-2', DOGE: 'dogecoin',
  TRX: 'tron', DOT: 'polkadot', MATIC: 'matic-network', SHIB: 'shiba-inu',
  LTC: 'litecoin', LINK: 'chainlink', BCH: 'bitcoin-cash', NEAR: 'near',
  UNI: 'uniswap', ICP: 'internet-computer', APT: 'aptos', SUI: 'sui',
  ARB: 'arbitrum', OP: 'optimism', ATOM: 'cosmos', XLM: 'stellar',
  ETC: 'ethereum-classic', FIL: 'filecoin', INJ: 'injective-protocol',
  HBAR: 'hedera-hashgraph', VET: 'vechain', ALGO: 'algorand',
  AAVE: 'aave', MKR: 'maker', CRV: 'curve-dao-token', SNX: 'havven',
  COMP: 'compound-coin', GRT: 'the-graph', SAND: 'the-sandbox',
  MANA: 'decentraland', AXS: 'axie-infinity', FTM: 'fantom',
  THETA: 'theta-token', XMR: 'monero', XTZ: 'tezos', QNT: 'quant-network',
  TON: 'the-open-network', SEI: 'sei-network', PEPE: 'pepe',
  WIF: 'dogwifcoin', BONK: 'bonk', JUP: 'jupiter-exchange-solana',
  PYTH: 'pyth-network', JTO: 'jito-governance-token',
};

const COINGECKO = 'https://api.coingecko.com/api/v3';

// Resolve a symbol to a CoinGecko ID. First checks KNOWN map, then searches.
async function resolveId(symbol: string): Promise<{ id: string; name: string } | null> {
  const upper = symbol.toUpperCase();
  if (KNOWN[upper]) {
    // Still need the name — will be filled from the price batch response
    return { id: KNOWN[upper], name: '' };
  }
  try {
    const res = await fetch(`${COINGECKO}/search?query=${encodeURIComponent(symbol)}`);
    if (!res.ok) return null;
    const data = await res.json() as { coins: { id: string; symbol: string; name: string; market_cap_rank: number }[] };
    const match = data.coins
      .filter((c) => c.symbol.toLowerCase() === symbol.toLowerCase())
      .sort((a, b) => (a.market_cap_rank ?? 9999) - (b.market_cap_rank ?? 9999))[0];
    return match ? { id: match.id, name: match.name } : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols') ?? '';
  const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);

  if (!symbols.length) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  // Resolve all symbols to CoinGecko IDs in parallel
  const resolved = await Promise.all(symbols.map(async (sym) => ({ sym, info: await resolveId(sym) })));

  const idToSymbol: Record<string, string> = {};
  const idsToFetch: string[] = [];
  for (const { sym, info } of resolved) {
    if (info) {
      idToSymbol[info.id] = sym;
      idsToFetch.push(info.id);
    }
  }

  const results: Record<string, { price: number | null; name: string | null }> = {};
  // Default all to null
  for (const sym of symbols) results[sym] = { price: null, name: null };

  if (idsToFetch.length) {
    try {
      const priceRes = await fetch(
        `${COINGECKO}/coins/markets?vs_currency=usd&ids=${idsToFetch.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=false`
      );
      if (priceRes.ok) {
        const coins = await priceRes.json() as { id: string; symbol: string; name: string; current_price: number }[];
        for (const coin of coins) {
          const sym = idToSymbol[coin.id];
          if (sym) {
            results[sym] = { price: coin.current_price ?? null, name: coin.name ?? null };
          }
        }
      }
    } catch { /* leave as null */ }
  }

  return NextResponse.json(results);
}
