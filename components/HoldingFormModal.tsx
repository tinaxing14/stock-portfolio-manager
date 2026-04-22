'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Holding } from '@/lib/types';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  holding?: Holding | null;
  onClose: () => void;
}

type PriceState =
  | { status: 'idle' }
  | { status: 'fetching' }
  | { status: 'ok'; price: number }
  | { status: 'error'; message: string };

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

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
    if (!t || t === 'CASH') { setPriceState({ status: 'idle' }); return; }
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

  const isCash = form.ticker.trim().toUpperCase() === 'CASH';

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-white ${
      hasError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
    }`;

  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? 'Edit' : 'Add'} {isCryptoAccount ? 'Crypto Asset' : 'Holding'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? 'Update position details' : `Enter details for your new ${isCryptoAccount ? 'crypto' : 'stock'} position`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Ticker + Get Price */}
          <div>
            <label className={labelClass}>{isCryptoAccount ? 'Crypto Symbol' : 'Ticker Symbol'}</label>
            <div className="flex gap-2">
              <input
                value={form.ticker}
                onChange={(e) => set('ticker', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchPrice(form.ticker); } }}
                placeholder={isCryptoAccount ? 'e.g. BTC, ETH, SOL' : 'e.g. VOO, AAPL'}
                maxLength={20}
                className={`flex-1 border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all uppercase font-semibold tracking-wider ${errors.ticker ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'}`}
              />
              {!isCash && (
                <button
                  type="button"
                  onClick={() => fetchPrice(form.ticker)}
                  disabled={!form.ticker.trim() || priceState.status === 'fetching'}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                >
                  {priceState.status === 'fetching' ? (
                    <><LoadingSpinner size="xs" /> Fetching…</>
                  ) : 'Get Price'}
                </button>
              )}
            </div>
            {errors.ticker && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.ticker}</p>}
          </div>

          {/* Live price pill */}
          {!isCash && (
            <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2.5 ${
              priceState.status === 'ok'
                ? 'bg-emerald-50 border border-emerald-100'
                : priceState.status === 'error'
                ? 'bg-rose-50 border border-rose-100'
                : 'bg-slate-50 border border-slate-100'
            }`}>
              {priceState.status === 'ok' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-emerald-700 font-semibold">Live price: {formatCurrency(priceState.price)}</span>
                </>
              )}
              {priceState.status === 'error' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                  <span className="text-rose-600">{priceState.message}</span>
                </>
              )}
              {priceState.status === 'fetching' && (
                <><LoadingSpinner size="xs" /><span className="text-slate-400">Fetching live price…</span></>
              )}
              {priceState.status === 'idle' && (
                <span className="text-slate-400">Enter a {isCryptoAccount ? 'symbol' : 'ticker'} and click Get Price</span>
              )}
            </div>
          )}
          {errors.price && <p className="text-xs text-rose-500 -mt-2 font-medium">{errors.price}</p>}

          {/* Name */}
          <div>
            <label className={labelClass}>Name</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder={isCryptoAccount ? 'e.g. Bitcoin' : 'e.g. Vanguard S&P 500 ETF'}
              maxLength={100}
              className={inputClass(!!errors.name)}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.name}</p>}
          </div>

          {/* Shares */}
          <div>
            <label className={labelClass}>{isCryptoAccount ? 'Units / Coins' : 'Shares'}</label>
            <input
              type="number"
              value={form.shares}
              onChange={(e) => set('shares', e.target.value)}
              placeholder="0.00"
              step="any"
              className={inputClass(!!errors.shares)}
            />
            {errors.shares && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.shares}</p>}
          </div>

          {/* Category + Sub-category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={inputClass(!!errors.category)}
              >
                <option value="">Select…</option>
                {categories.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
              {errors.category && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.category}</p>}
            </div>
            <div>
              <label className={labelClass}>Sub-Category</label>
              <input
                value={form.subCategory}
                onChange={(e) => set('subCategory', e.target.value)}
                placeholder="e.g. Large Cap"
                maxLength={100}
                className={inputClass(false)}
              />
            </div>
          </div>

          {/* Brokerage */}
          <div>
            <label className={labelClass}>Brokerage</label>
            <select
              value={form.brokerage}
              onChange={(e) => set('brokerage', e.target.value)}
              className={inputClass(!!errors.brokerage)}
            >
              <option value="">Select…</option>
              {brokerages.map((b) => <option key={b.name}>{b.name}</option>)}
            </select>
            {errors.brokerage && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.brokerage}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 text-white rounded-xl py-2.5 text-sm font-bold transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}
            >
              {isEdit ? 'Save Changes' : 'Add Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
