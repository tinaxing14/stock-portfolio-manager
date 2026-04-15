'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Holding } from '@/lib/types';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency } from '@/lib/utils';

interface Props {
  holding?: Holding | null;
  onClose: () => void;
}

type PriceState =
  | { status: 'idle' }
  | { status: 'fetching' }
  | { status: 'ok'; price: number }
  | { status: 'error'; message: string };

export default function HoldingFormModal({ holding, onClose }: Props) {
  const { addHolding, updateHolding, categories, brokerages, isCryptoAccount } = usePortfolio();
  const isEdit = !!holding;
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    ticker: holding?.ticker ?? '',
    name: holding?.name ?? '',
    shares: holding ? String(holding.shares) : '',
    brokerage: holding?.brokerage ?? (brokerages[0]?.name ?? ''),
    category: holding?.category ?? (categories[0]?.name ?? ''),
    subCategory: holding?.subCategory ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [priceState, setPriceState] = useState<PriceState>({ status: 'idle' });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const fetchPrice = useCallback(async (ticker: string) => {
    const t = ticker.trim().toUpperCase();
    if (!t || t === 'CASH') {
      setPriceState({ status: 'idle' });
      return;
    }
    setPriceState({ status: 'fetching' });
    try {
      const endpoint = isCryptoAccount ? `/api/crypto-quote?symbols=${t}` : `/api/quote?symbols=${t}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      const result = data[t] as { price: number | null; name: string | null } | undefined;
      if (result?.price != null) {
        setPriceState({ status: 'ok', price: result.price });
        setErrors((e) => ({ ...e, price: '' }));
        if (result.name) {
          setForm((f) => ({ ...f, name: f.name === '' || f.name === f.ticker ? result.name! : f.name }));
        }
      } else {
        const label = isCryptoAccount ? 'crypto symbol' : 'ticker symbol';
        setPriceState({ status: 'error', message: `Could not find "${t}" — check the ${label}` });
      }
    } catch {
      setPriceState({ status: 'error', message: 'Failed to fetch price' });
    }
  }, [isCryptoAccount]);

  // Auto-fetch live price when editing an existing holding.
  // Depends on fetchPrice so it re-runs once isCryptoAccount resolves
  // from its initial false (empty accounts state) to the real value.
  useEffect(() => {
    if (holding) fetchPrice(holding.ticker);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPrice]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.ticker.trim()) errs.ticker = 'Ticker is required';
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.shares || isNaN(Number(form.shares)) || Number(form.shares) <= 0) errs.shares = 'Enter a valid number of shares';
    if (!form.category.trim()) errs.category = 'Category is required';
    if (!form.brokerage.trim()) errs.brokerage = 'Brokerage is required';
    if (priceState.status !== 'ok' && form.ticker.trim().toUpperCase() !== 'CASH') {
      errs.price = priceState.status === 'error' ? priceState.message : 'Fetch a price first by entering a ticker';
    }
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const ticker = form.ticker.trim().toUpperCase();
    const currentPrice = ticker === 'CASH'
      ? (holding?.currentPrice ?? 1)
      : (priceState as { status: 'ok'; price: number }).price;

    const data = {
      ticker,
      name: form.name.trim(),
      shares: parseFloat(form.shares),
      currentPrice,
      brokerage: form.brokerage,
      category: form.category,
      subCategory: form.subCategory.trim(),
    };
    if (isEdit && holding) { updateHolding({ ...holding, ...data }); }
    else { addHolding(data); }
    onClose();
  }

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[key] ? 'border-rose-400' : 'border-slate-200'}`}
      />
      {errors[key] && <p className="text-xs text-rose-500 mt-1">{errors[key]}</p>}
    </div>
  );

  const isCash = form.ticker.trim().toUpperCase() === 'CASH';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? 'Edit' : 'Add'} {isCryptoAccount ? 'Crypto Asset' : 'Holding'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symbol / Ticker + fetch price */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {isCryptoAccount ? 'Crypto Symbol' : 'Ticker Symbol'}
            </label>
            <div className="flex gap-2">
              <input
                value={form.ticker}
                onChange={(e) => set('ticker', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchPrice(form.ticker); } }}
                placeholder={isCryptoAccount ? 'e.g. BTC, ETH, SOL' : 'e.g. VOO'}
                className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase ${errors.ticker ? 'border-rose-400' : 'border-slate-200'}`}
              />
              {!isCash && (
                <button
                  type="button"
                  onClick={() => fetchPrice(form.ticker)}
                  disabled={!form.ticker.trim() || priceState.status === 'fetching'}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {priceState.status === 'fetching' ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                      Fetching...
                    </span>
                  ) : 'Get Price'}
                </button>
              )}
            </div>
            {errors.ticker && <p className="text-xs text-rose-500 mt-1">{errors.ticker}</p>}
          </div>

          {/* Live price display */}
          {!isCash && (
            <div className={`rounded-lg px-3 py-2.5 text-sm border ${
              priceState.status === 'ok'
                ? 'bg-emerald-50 border-emerald-200'
                : priceState.status === 'error'
                ? 'bg-rose-50 border-rose-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              {priceState.status === 'ok' && (
                <span className="text-emerald-700 font-medium">
                  Live price: {formatCurrency(priceState.price)}
                </span>
              )}
              {priceState.status === 'error' && (
                <span className="text-rose-600">{priceState.message}</span>
              )}
              {priceState.status === 'fetching' && (
                <span className="text-slate-400">Fetching live price...</span>
              )}
              {priceState.status === 'idle' && (
                <span className="text-slate-400">
                  Enter a {isCryptoAccount ? 'symbol' : 'ticker'} and click Get Price
                </span>
              )}
            </div>
          )}
          {errors.price && <p className="text-xs text-rose-500 -mt-2">{errors.price}</p>}

          {field('Name', 'name', 'text', isCryptoAccount ? 'e.g. Bitcoin' : 'e.g. Vanguard S&P 500')}
          {field(isCryptoAccount ? 'Units / Coins' : 'Shares', 'shares', 'number', '0.00000000')}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.category ? 'border-rose-400' : 'border-slate-200'}`}
              >
                <option value="">Select category...</option>
                {categories.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
              {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
            </div>
            {field('Sub-Category', 'subCategory', 'text', 'e.g. Large Cap')}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Brokerage</label>
            <select
              value={form.brokerage}
              onChange={(e) => set('brokerage', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.brokerage ? 'border-rose-400' : 'border-slate-200'}`}
            >
              <option value="">Select brokerage...</option>
              {brokerages.map((b) => <option key={b.name}>{b.name}</option>)}
            </select>
            {errors.brokerage && <p className="text-xs text-rose-500 mt-1">{errors.brokerage}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
              {isEdit ? 'Save Changes' : 'Add Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
