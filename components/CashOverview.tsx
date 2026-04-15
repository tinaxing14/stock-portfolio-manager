'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { HoldingWithValue } from '@/lib/types';
import { formatCurrency, getTotalValue } from '@/lib/utils';
import { usePortfolio } from '@/lib/PortfolioContext';

interface Props { holdings: HoldingWithValue[] }

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

    // Find existing CASH holding
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
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Cash & Investments</h2>

      <div className="flex gap-6 items-center">
        {/* Pie */}
        {total > 0 && (
          <div className="flex-shrink-0 w-36">
            <ResponsiveContainer width="100%" height={144}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={65}
                  paddingAngle={2} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    `${formatCurrency(Number(value))} (${((Number(value) / total) * 100).toFixed(1)}%)`,
                    '',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stats */}
        <div className="flex-1 space-y-4">
          {/* Cash row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700">Cash</span>
            </div>
            {editing ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <span className="px-2 text-sm text-slate-400 bg-slate-50 border-r border-slate-200 py-1.5">$</span>
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    step="100"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveCash(); if (e.key === 'Escape') setEditing(false); }}
                    className="w-32 px-2 py-1.5 text-sm text-right focus:outline-none"
                  />
                </div>
                <button onClick={saveCash}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                  Save
                </button>
                <button onClick={() => setEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-1.5">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">{formatCurrency(cashValue)}</span>
                <span className="text-xs text-slate-400">({cashPct.toFixed(1)}%)</span>
                <button onClick={startEdit}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-medium ml-1 transition-colors">
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Investments row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700">Investments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{formatCurrency(investedValue)}</span>
              <span className="text-xs text-slate-400">({investedPct.toFixed(1)}%)</span>
            </div>
          </div>

          {/* Divider + Total */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Portfolio</span>
            <span className="text-sm font-bold text-slate-800">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
