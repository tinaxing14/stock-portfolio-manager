'use client';

import { useState, useCallback, useMemo } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { AutoInvestment, InvestFrequency } from '@/lib/types';
import { formatCurrency, generateId } from '@/lib/utils';

// ─── Projection math ─────────────────────────────────────────────────────────
// Total = current holding value + (amount per period × periods per year × years)
// No growth assumption — purely contributions added to existing position.

const FREQ_PERIODS: Record<InvestFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
};

const FREQ_LABELS: Record<InvestFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};

const FREQ_COLORS: Record<InvestFrequency, string> = {
  weekly:    'bg-violet-100 text-violet-700',
  biweekly:  'bg-blue-100 text-blue-700',
  monthly:   'bg-indigo-100 text-indigo-700',
  quarterly: 'bg-amber-100 text-amber-700',
};

function dcaProjection(currentValue: number, amountPerPeriod: number, periodsPerYear: number, years: number): number {
  return currentValue + amountPerPeriod * periodsPerYear * years;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function nextRunLabel(iso: string): { label: string; urgent: boolean } {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return { label: 'Overdue', urgent: true };
  if (days === 0) return { label: 'Today', urgent: true };
  if (days === 1) return { label: 'Tomorrow', urgent: false };
  if (days <= 7) return { label: `In ${days}d`, urgent: false };
  return { label: formatDate(iso), urgent: false };
}

// ─── Form defaults ────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  ticker: '',
  name: '',
  category: '',
  subCategory: '',
  brokerage: '',
  frequency: 'monthly' as InvestFrequency,
  amount: '',
  nextRunAt: new Date().toISOString().slice(0, 10),
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AutoInvestmentTracker() {
  const {
    holdings, autoInvestments, categories, brokerages,
    addAutoInvestment, updateAutoInvestment, deleteAutoInvestment,
  } = usePortfolio();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Map ticker → current total value held in this account
  const holdingValueByTicker = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of holdings) {
      map[h.ticker] = (map[h.ticker] ?? 0) + h.totalValue;
    }
    return map;
  }, [holdings]);

  // Unique tickers from existing holdings (for autocomplete)
  const holdingTickers = useMemo(() => [...new Set(holdings.map((h) => h.ticker))].sort(), [holdings]);

  // Auto-fill name/category/brokerage when ticker matches a holding
  const handleTickerChange = useCallback((ticker: string) => {
    setForm((prev) => {
      const match = holdings.find((h) => h.ticker.toUpperCase() === ticker.toUpperCase());
      return {
        ...prev,
        ticker: ticker.toUpperCase(),
        name: match ? match.name : prev.name,
        category: match ? match.category : prev.category,
        subCategory: match ? match.subCategory : prev.subCategory,
        brokerage: match ? match.brokerage : prev.brokerage,
      };
    });
  }, [holdings]);

  const openAdd = useCallback(() => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((inv: AutoInvestment) => {
    setForm({
      ticker: inv.ticker,
      name: inv.name,
      category: inv.category,
      subCategory: inv.subCategory,
      brokerage: inv.brokerage,
      frequency: inv.frequency,
      amount: String(inv.amount),
      nextRunAt: inv.nextRunAt.slice(0, 10),
    });
    setEditingId(inv.id);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }, []);

  const handleSave = useCallback(() => {
    const amount = parseFloat(form.amount);
    if (!form.ticker || !form.name || isNaN(amount) || amount <= 0) return;

    const data = {
      ticker: form.ticker,
      name: form.name,
      category: form.category,
      subCategory: form.subCategory,
      brokerage: form.brokerage,
      frequency: form.frequency,
      amount,
      nextRunAt: new Date(form.nextRunAt + 'T09:00:00').toISOString(),
      lastRunAt: null,
    };

    if (editingId) {
      const existing = autoInvestments.find((a) => a.id === editingId)!;
      updateAutoInvestment({ ...existing, ...data, updatedAt: new Date().toISOString() });
    } else {
      addAutoInvestment(data);
    }
    closeForm();
  }, [form, editingId, autoInvestments, addAutoInvestment, updateAutoInvestment, closeForm]);

  const isFormValid = form.ticker.trim() && form.name.trim() && parseFloat(form.amount) > 0;

  if (autoInvestments.length === 0 && !showForm) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="text-2xl mb-2">📅</div>
        <p className="text-slate-700 font-medium mb-1">No automatic investments set up</p>
        <p className="text-slate-400 text-sm mb-4">Schedule recurring purchases to dollar-cost average into any holding.</p>
        <button
          onClick={openAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Investment
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Automatic Investment Tracker</h2>
          <p className="text-xs text-slate-400 mt-0.5">Scheduled purchases · 1, 3, and 5-year projections</p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Investment
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            {editingId ? 'Edit Automatic Investment' : 'New Automatic Investment'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Ticker */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ticker</label>
              <input
                value={form.ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                list="auto-invest-tickers"
                placeholder="e.g. VFIAX"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
              <datalist id="auto-invest-tickers">
                {holdingTickers.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Vanguard 500 Index"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value as InvestFrequency }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {(Object.keys(FREQ_LABELS) as InvestFrequency[]).map((f) => (
                  <option key={f} value={f}>{FREQ_LABELS[f]}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Amount per period ($)</label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                <span className="px-3 py-2 text-sm text-slate-400 bg-slate-50 border-r border-slate-200">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="500"
                  className="flex-1 px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                list="auto-invest-categories"
                placeholder="e.g. S&P500"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="auto-invest-categories">
                {categories.map((c) => <option key={c.name} value={c.name} />)}
              </datalist>
            </div>

            {/* Next Run */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">First / Next Run Date</label>
              <input
                type="date"
                value={form.nextRunAt}
                onChange={(e) => setForm((p) => ({ ...p, nextRunAt: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Brokerage */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Brokerage</label>
              <input
                value={form.brokerage}
                onChange={(e) => setForm((p) => ({ ...p, brokerage: e.target.value }))}
                list="auto-invest-brokerages"
                placeholder="e.g. Vanguard"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="auto-invest-brokerages">
                {brokerages.map((b) => <option key={b.name} value={b.name} />)}
              </datalist>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={!isFormValid}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {editingId ? 'Save Changes' : 'Add Investment'}
            </button>
            <button
              onClick={closeForm}
              className="border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {autoInvestments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-235">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Ticker / Name', 'Brokerage', 'Frequency', 'Per Period', 'Next Run', 'Current Value', '1-Year', '2-Year', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {autoInvestments.map((inv) => {
                const currentValue = holdingValueByTicker[inv.ticker] ?? 0;
                const n = FREQ_PERIODS[inv.frequency];
                const proj1 = dcaProjection(currentValue, inv.amount, n, 1);
                const proj2 = dcaProjection(currentValue, inv.amount, n, 2);
                const { label: nextLabel, urgent } = nextRunLabel(inv.nextRunAt);

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Ticker / Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-block bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded font-mono">
                          {inv.ticker}
                        </span>
                        <span className="text-slate-600 text-xs truncate max-w-[130px]">{inv.name}</span>
                      </div>
                      {inv.lastRunAt && (
                        <p className="text-xs text-slate-400 mt-0.5 pl-0.5">Last: {formatDate(inv.lastRunAt)}</p>
                      )}
                    </td>

                    {/* Brokerage */}
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {inv.brokerage || <span className="text-slate-400">—</span>}
                    </td>

                    {/* Frequency */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${FREQ_COLORS[inv.frequency]}`}>
                        {FREQ_LABELS[inv.frequency]}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {formatCurrency(inv.amount)}
                    </td>

                    {/* Next Run */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${urgent ? 'text-rose-600' : 'text-slate-600'}`}>
                        {nextLabel}
                      </span>
                    </td>

                    {/* Current Value */}
                    <td className="px-4 py-3 text-slate-700">
                      {currentValue > 0 ? formatCurrency(currentValue) : <span className="text-slate-400">—</span>}
                    </td>

                    {/* Projections */}
                    <td className="px-4 py-3 font-medium text-emerald-700">{formatCurrency(proj1)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(proj2)}</td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(inv)}
                          title="Edit"
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          ✎
                        </button>

                        {/* Delete */}
                        {confirmDelete === inv.id ? (
                          <span className="flex items-center gap-1">
                            <button
                              onClick={() => { deleteAutoInvestment(inv.id); setConfirmDelete(null); }}
                              className="px-2 py-1 rounded text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 rounded text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(inv.id)}
                            title="Delete"
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals footer */}
      {autoInvestments.length > 0 && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-6 text-xs text-slate-500">
          {(['weekly', 'biweekly', 'monthly', 'quarterly'] as InvestFrequency[]).map((freq) => {
            const total = autoInvestments.filter((a) => a.frequency === freq).reduce((s, a) => s + a.amount, 0);
            return total > 0 ? (
              <span key={freq}>{FREQ_LABELS[freq]}: <span className="font-semibold text-slate-700">{formatCurrency(total)}</span></span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
