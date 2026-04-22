'use client';

import { useState } from 'react';
import { HoldingWithValue, Holding } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { usePortfolio } from '@/lib/PortfolioContext';
import { FALLBACK_COLOR } from '@/lib/constants';
import HoldingFormModal from './HoldingFormModal';
import LoadingSpinner from './LoadingSpinner';

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

export default function HoldingsList() {
  const {
    holdings, categories, brokerages, colorMap, brokerageColorMap,
    isCryptoAccount, deleteHolding, addBrokerage, deleteBrokerage, refreshPrices,
  } = usePortfolio();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [brokerageFilter, setBrokerageFilter] = useState('');
  const [editing, setEditing] = useState<Holding | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showManageBrokerages, setShowManageBrokerages] = useState(false);
  const [newBrokerage, setNewBrokerage] = useState('');
  const [newBrokerageColor, setNewBrokerageColor] = useState('#6366f1');
  const [confirmDeleteBrokerage, setConfirmDeleteBrokerage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ updated: number; failed: string[] } | null>(null);

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const result = await refreshPrices();
      setRefreshResult(result);
      setTimeout(() => setRefreshResult(null), 5000);
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = holdings.filter((h) => {
    if (h.category === 'Cash') return false;
    const q = search.toLowerCase();
    const bq = brokerageFilter.toLowerCase();
    return (
      (!q || h.ticker.toLowerCase().includes(q) || h.name.toLowerCase().includes(q)) &&
      (category === 'All' || h.category === category) &&
      (!bq || h.brokerage.toLowerCase().includes(bq))
    );
  });

  const handleAddBrokerage = () => {
    const name = newBrokerage.trim();
    if (!name) return;
    addBrokerage({ name, color: newBrokerageColor });
    setNewBrokerage('');
    setNewBrokerageColor('#6366f1');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2.5 flex-1 items-center">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><SearchIcon /></span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker or name…"
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            />
          </div>

          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => <option key={c.name}>{c.name}</option>)}
          </select>

          {/* Brokerage filter */}
          <div className="flex items-center gap-1.5">
            <input
              value={brokerageFilter}
              onChange={(e) => setBrokerageFilter(e.target.value)}
              placeholder="Filter by brokerage…"
              list="brokerage-list"
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            />
            <datalist id="brokerage-list">
              {brokerages.map((b) => <option key={b.name} value={b.name} />)}
            </datalist>
            <button
              onClick={() => setShowManageBrokerages((v) => !v)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                showManageBrokerages
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              Manage
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshPrices}
            disabled={refreshing || holdings.length === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            {refreshing ? <LoadingSpinner size="xs" /> : <RefreshIcon />}
            {refreshing ? 'Refreshing…' : 'Refresh Prices'}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}
          >
            <PlusIcon />
            Add Holding
          </button>
        </div>
      </div>

      {/* Refresh result banner */}
      {refreshResult && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2.5 ${
          refreshResult.failed.length === 0
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
            : 'bg-amber-50 border border-amber-100 text-amber-700'
        }`}>
          <span className="text-base">{refreshResult.failed.length === 0 ? '✓' : '⚠'}</span>
          {refreshResult.failed.length === 0 ? (
            <>Updated <strong>{refreshResult.updated}</strong> holding{refreshResult.updated !== 1 ? 's' : ''} with latest prices.</>
          ) : (
            <>Updated <strong>{refreshResult.updated}</strong> holding{refreshResult.updated !== 1 ? 's' : ''}. Could not fetch: <span className="font-semibold">{refreshResult.failed.join(', ')}</span></>
          )}
        </div>
      )}

      {/* Brokerage management panel */}
      {showManageBrokerages && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Manage Brokerages</h3>
          <div className="space-y-0.5 mb-4">
            {brokerages.length === 0 && (
              <p className="text-sm text-slate-400 py-2">No brokerages yet — add one below.</p>
            )}
            {brokerages.map((b) => (
              <div key={b.name} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: brokerageColorMap[b.name] ?? FALLBACK_COLOR }} />
                <span className="text-sm text-slate-700 flex-1 font-medium">{b.name}</span>
                {confirmDeleteBrokerage === b.name ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Remove?</span>
                    <button onClick={() => { deleteBrokerage(b.name); setConfirmDeleteBrokerage(null); }}
                      className="text-xs text-rose-600 font-semibold hover:underline">Yes</button>
                    <button onClick={() => setConfirmDeleteBrokerage(null)}
                      className="text-xs text-slate-400 hover:underline">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteBrokerage(b.name)}
                    className="text-xs text-slate-400 hover:text-rose-500 font-medium transition-colors">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
            <input
              value={newBrokerage}
              onChange={(e) => setNewBrokerage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newBrokerage.trim()) handleAddBrokerage(); }}
              placeholder="New brokerage name…"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
            <input
              type="color"
              value={newBrokerageColor}
              onChange={(e) => setNewBrokerageColor(e.target.value)}
              className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5"
              title="Pick color"
            />
            <button
              onClick={handleAddBrokerage}
              disabled={!newBrokerage.trim()}
              className="text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Holdings table */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><path d="M8 7V5a2 2 0 0 0-2-2"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-slate-700 font-semibold text-sm mb-1">
                {holdings.length === 0 ? 'No holdings yet' : 'No results match your filters'}
              </p>
              <p className="text-slate-400 text-xs">
                {holdings.length === 0 ? 'Add your first position to get started.' : 'Try adjusting the search or filters above.'}
              </p>
            </div>
            {holdings.length === 0 && (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold mt-1 transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}
              >
                <PlusIcon />
                Add Your First Holding
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                  {[isCryptoAccount ? 'Symbol' : 'Ticker', 'Name', isCryptoAccount ? 'Units' : 'Shares', 'Price', 'Value', '% Portfolio', 'Category', 'Sub-Category', 'Brokerage', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((h: HoldingWithValue, i) => (
                  <tr
                    key={h.id}
                    className="group transition-colors hover:bg-slate-50/70"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 tabular-nums">{h.ticker}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-50 truncate" title={h.name}>{h.name}</td>
                    <td className="px-4 py-3.5 text-slate-700 tabular-nums">
                      {isCryptoAccount ? h.shares.toLocaleString(undefined, { maximumFractionDigits: 8 }) : h.shares.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 tabular-nums">{formatCurrency(h.currentPrice)}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 tabular-nums">{formatCurrency(h.totalValue)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 tabular-nums">{formatPercent(h.portfolioPercent)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: colorMap[h.category] ?? FALLBACK_COLOR }}
                      >
                        {h.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{h.subCategory || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: brokerageColorMap[h.brokerage] ?? FALLBACK_COLOR }}
                      >
                        {h.brokerage}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditing(h)}
                          aria-label="Edit holding"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(h.id)}
                          aria-label="Delete holding"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showAdd || editing) && (
        <HoldingFormModal holding={editing} onClose={() => { setShowAdd(false); setEditing(null); }} />
      )}

      {/* Delete holding confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center mb-4 text-rose-500">
              <TrashIcon />
            </div>
            <h3 className="font-bold text-slate-900 mb-1.5">Delete Holding</h3>
            <p className="text-sm text-slate-500 mb-5">This will permanently remove this position from your portfolio.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteHolding(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
