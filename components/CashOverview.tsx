'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { HoldingWithValue } from '@/lib/types';
import { formatCurrency, getTotalValue } from '@/lib/utils';
import { usePortfolio } from '@/lib/PortfolioContext';

interface Props { holdings: HoldingWithValue[] }

function CashTooltip({ active, payload, total }: { active?: boolean; payload?: any[]; total: number }) {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0].payload;
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-3.5 py-2.5 text-sm pointer-events-none">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fill }} />
        <span className="font-bold text-slate-900">{name}</span>
      </div>
      <div className="text-slate-700 font-semibold tabular-nums">{formatCurrency(value)}</div>
      <div className="text-slate-400 text-xs mt-0.5">{pct.toFixed(1)}% of total</div>
    </div>
  );
}

export default function CashOverview({ holdings }: Props) {
  const { addHolding, updateHolding, holdings: allHoldings } = usePortfolio();
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const total = getTotalValue(holdings);
  const cashValue = holdings
    .filter((h) => h.category === 'Cash')
    .reduce((s, h) => s + h.totalValue, 0);
  const investedValue = total - cashValue;
  const cashPct = total > 0 ? (cashValue / total) * 100 : 0;
  const investedPct = total > 0 ? (investedValue / total) * 100 : 0;

  const pieData = [
    { name: 'Investments', value: investedValue, fill: '#6366f1' },
    { name: 'Cash', value: cashValue, fill: '#22c55e' },
  ].filter((d) => d.value > 0);

  function startEdit() {
    setInputValue(cashValue.toFixed(2));
    setEditing(true);
  }

  function saveCash() {
    const newAmount = parseFloat(inputValue);
    if (isNaN(newAmount) || newAmount < 0) { setEditing(false); return; }
    const cashHolding = allHoldings.find((h) => h.ticker === 'CASH');
    if (cashHolding) {
      updateHolding({ ...cashHolding, shares: 1, currentPrice: newAmount });
    } else {
      addHolding({
        ticker: 'CASH',
        name: 'Cash',
        shares: 1,
        currentPrice: newAmount,
        category: 'Cash',
        subCategory: 'Cash',
        brokerage: 'Other',
      });
    }
    setEditing(false);
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <h2 className="text-sm font-bold text-slate-800">Cash &amp; Investments</h2>
      </div>

      <div className="p-5 flex gap-6 items-center">
        {/* Pie */}
        {total > 0 && (
          <div className="shrink-0 w-36">
            <ResponsiveContainer width="100%" height={144}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={38} outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={(props: any) => <CashTooltip {...props} total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stats */}
        <div className="flex-1 space-y-3.5">
          {/* Cash row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700">Cash</span>
            </div>
            {editing ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <span className="px-2.5 text-sm text-slate-400 bg-slate-50 border-r border-slate-200 py-1.5">$</span>
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    step="100"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveCash(); if (e.key === 'Escape') setEditing(false); }}
                    className="w-32 px-2.5 py-1.5 text-sm text-right focus:outline-none tabular-nums"
                  />
                </div>
                <button
                  onClick={saveCash}
                  className="text-xs text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-1.5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(cashValue)}</span>
                <span className="text-xs text-slate-400 tabular-nums">({cashPct.toFixed(1)}%)</span>
                <button
                  onClick={startEdit}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Investments row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700">Investments</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(investedValue)}</span>
              <span className="text-xs text-slate-400 tabular-nums">({investedPct.toFixed(1)}%)</span>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3.5" style={{ borderTop: '1px solid #f1f5f9' }}>
            <span className="text-sm font-semibold text-slate-500">Total Portfolio</span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
