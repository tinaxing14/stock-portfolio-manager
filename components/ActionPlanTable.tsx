'use client';

import { HoldingWithValue, PortfolioGoal } from '@/lib/types';
import { getActionPlan, getTotalValue, formatCurrency, ActionItem, ActionVerb } from '@/lib/utils';
import { usePortfolio } from '@/lib/PortfolioContext';
import { FALLBACK_COLOR } from '@/lib/constants';

const ACTION_STYLE: Record<ActionVerb, { badge: string; row: string }> = {
  'SELL ALL':  { badge: 'bg-rose-600 text-white',      row: 'bg-rose-50/60' },
  'SELL':      { badge: 'bg-orange-500 text-white',    row: 'bg-orange-50/60' },
  'BUY':       { badge: 'bg-emerald-600 text-white',   row: 'bg-emerald-50/40' },
  'ON TARGET': { badge: 'bg-slate-200 text-slate-500', row: '' },
};

interface Props {
  holdings: HoldingWithValue[];
  goals: PortfolioGoal[];
}

export default function ActionPlanTable({ holdings, goals }: Props) {
  const { colorMap } = usePortfolio();
  const items = getActionPlan(
    holdings.filter((h) => h.category !== 'Cash'),
    goals.filter((g) => g.category !== 'Cash'),
  );
  const total = getTotalValue(holdings);

  const totalToBuy  = items.filter((i) => i.action === 'BUY').reduce((s, i) => s + i.delta, 0);
  const totalToSell = items.filter((i) => i.action === 'SELL' || i.action === 'SELL ALL').reduce((s, i) => s + Math.abs(i.delta), 0);
  const onTarget    = items.filter((i) => i.action === 'ON TARGET').length;

  if (!holdings.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
        Add holdings to generate your action plan.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Rebalancing Action Plan</h2>
          <p className="text-xs text-slate-400 mt-0.5">Based on a total portfolio value of {formatCurrency(total)}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-600">Sell <span className="font-semibold text-rose-600">{formatCurrency(totalToSell)}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Buy <span className="font-semibold text-emerald-600">{formatCurrency(totalToBuy)}</span></span>
          </div>
          {onTarget > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-slate-400">{onTarget} on target</span>
            </div>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {['Category', 'Action', 'Current Value', 'Current %', 'Goal %', 'Target Value', 'Amount'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((item: ActionItem) => {
            const style = ACTION_STYLE[item.action];
            return (
              <tr key={item.category} className={`${style.row} transition-colors`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colorMap[item.category] ?? FALLBACK_COLOR }} />
                    <span className="font-medium text-slate-800">{item.category}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${style.badge}`}>
                    {item.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{formatCurrency(item.currentValue)}</td>
                <td className="px-4 py-3 text-slate-700">{item.currentPercent.toFixed(1)}%</td>
                <td className="px-4 py-3 text-slate-500">{item.goalPercent > 0 ? `${item.goalPercent}%` : '—'}</td>
                <td className="px-4 py-3 text-slate-500">{item.goalPercent > 0 ? formatCurrency(item.targetValue) : '—'}</td>
                <td className={`px-4 py-3 font-semibold ${
                  item.action === 'ON TARGET' ? 'text-slate-400' :
                  item.action === 'BUY' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {item.action === 'ON TARGET' ? '✓' :
                   item.action === 'BUY' ? `+${formatCurrency(item.delta)}` :
                   `-${formatCurrency(Math.abs(item.delta))}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {goals.length === 0 && (
        <p className="px-6 py-4 text-xs text-slate-400 border-t border-slate-100">
          No goals set — go to the Goals page to define your target allocations.
        </p>
      )}
    </div>
  );
}
