'use client';

import { useState } from 'react';
import { HoldingWithValue, Holding } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { usePortfolio } from '@/lib/PortfolioContext';
import { FALLBACK_COLOR } from '@/lib/constants';
import HoldingFormModal from './HoldingFormModal';

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
      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticker or name..."
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="All">All Categories</option>
            {categories.map((c) => <option key={c.name}>{c.name}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <input
              value={brokerageFilter}
              onChange={(e) => setBrokerageFilter(e.target.value)}
              placeholder="Filter by brokerage..."
              list="brokerage-list"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <datalist id="brokerage-list">
              {brokerages.map((b) => <option key={b.name} value={b.name} />)}
            </datalist>
            <button
              onClick={() => setShowManageBrokerages((v) => !v)}
              className={`px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                showManageBrokerages
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title="Manage brokerages"
            >
              Manage
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshPrices}
            disabled={refreshing || holdings.length === 0}
            className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {refreshing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                Refreshing...
              </>
            ) : (
              <>↻ Refresh Prices</>
            )}
          </button>
          <button onClick={() => setShowAdd(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Add Holding
          </button>
        </div>
      </div>

      {refreshResult && (
        <div className={`rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 ${
          refreshResult.failed.length === 0
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border border-amber-200 text-amber-700'
        }`}>
          {refreshResult.failed.length === 0 ? (
            <>✓ Updated {refreshResult.updated} holding{refreshResult.updated !== 1 ? 's' : ''} with latest prices.</>
          ) : (
            <>
              ✓ Updated {refreshResult.updated} holding{refreshResult.updated !== 1 ? 's' : ''}.
              {' '}Could not fetch: <span className="font-medium">{refreshResult.failed.join(', ')}</span>
            </>
          )}
        </div>
      )}

      {/* Inline brokerage management */}
      {showManageBrokerages && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Manage Brokerages</h3>
          <div className="space-y-1 mb-3">
            {brokerages.length === 0 && (
              <p className="text-sm text-slate-400 py-1">No brokerages yet.</p>
            )}
            {brokerages.map((b) => (
              <div key={b.name} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: brokerageColorMap[b.name] ?? FALLBACK_COLOR }} />
                <span className="text-sm text-slate-700 flex-1">{b.name}</span>
                {confirmDeleteBrokerage === b.name ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Remove?</span>
                    <button onClick={() => { deleteBrokerage(b.name); setConfirmDeleteBrokerage(null); }}
                      className="text-xs text-rose-600 font-medium hover:underline">Yes</button>
                    <button onClick={() => setConfirmDeleteBrokerage(null)}
                      className="text-xs text-slate-400 hover:underline">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteBrokerage(b.name)}
                    className="text-xs text-rose-400 hover:text-rose-600 font-medium transition-colors">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              value={newBrokerage}
              onChange={(e) => setNewBrokerage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newBrokerage.trim()) handleAddBrokerage(); }}
              placeholder="New brokerage name..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="color"
              value={newBrokerageColor}
              onChange={(e) => setNewBrokerageColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5"
              title="Pick color"
            />
            <button
              onClick={handleAddBrokerage}
              disabled={!newBrokerage.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            {holdings.length === 0 ? 'No holdings yet — add your first position.' : 'No results match your filters.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[isCryptoAccount ? 'Symbol' : 'Ticker', 'Name', isCryptoAccount ? 'Units' : 'Shares', 'Price', 'Value', '% of Portfolio', 'Category', 'Sub-Category', 'Brokerage', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((h: HoldingWithValue) => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800">{h.ticker}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{h.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {isCryptoAccount ? h.shares.toLocaleString(undefined, { maximumFractionDigits: 8 }) : h.shares.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(h.currentPrice)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(h.totalValue)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatPercent(h.portfolioPercent)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: colorMap[h.category] ?? FALLBACK_COLOR }}>
                      {h.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{h.subCategory || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: brokerageColorMap[h.brokerage] ?? FALLBACK_COLOR }}>
                      {h.brokerage}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(h)} className="text-indigo-500 hover:text-indigo-700 text-xs font-medium">Edit</button>
                      <button onClick={() => setConfirmDelete(h.id)} className="text-rose-400 hover:text-rose-600 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(showAdd || editing) && (
        <HoldingFormModal holding={editing} onClose={() => { setShowAdd(false); setEditing(null); }} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4">
            <h3 className="font-semibold text-slate-800 mb-2">Delete Holding</h3>
            <p className="text-sm text-slate-500 mb-5">This will permanently remove this position.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => { deleteHolding(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
