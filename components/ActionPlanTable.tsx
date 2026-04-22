'use client';

import { HoldingWithValue, PortfolioGoal } from '@/lib/types';
import { getActionPlan, getTotalValue, formatCurrency, ActionItem, ActionVerb } from '@/lib/utils';
import { usePortfolio } from '@/lib/PortfolioContext';
import { FALLBACK_COLOR } from '@/lib/constants';

const ACTION_CONFIG: Record<ActionVerb, { pill: string; row: string; label: string }> = {
  'SELL ALL':  { pill: 'bg-rose-100 text-rose-700',        row: 'bg-rose-50/40',    label: 'Sell All' },
  'SELL':      { pill: 'bg-orange-100 text-orange-700',    row: 'bg-orange-50/40',  label: 'Sell' },
  'BUY':       { pill: 'bg-emerald-100 text-emerald-700',  row: 'bg-emerald-50/30', label: 'Buy' },
  'ON TARGET': { pill: 'bg-slate-100 text-slate-500',      row: '',                 label: 'On Target' },
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
      <div className="bg-white rounded-2xl p-8 text-center"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <p className="text-slate-400 text-sm">Add holdings to generate your rebalancing plan.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4"
        style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <h2 className="text-base font-bold text-slate-900">Rebalancing Action Plan</h2>
          <p className="text-xs text-slate-400 mt-0.5">Based on total portfolio value of {formatCurrency(total)}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {totalToSell > 0 && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-600 text-xs">Sell <span className="font-bold text-rose-600">{formatCurrency(totalToSell)}</span></span>
            </div>
          )}
          {totalToBuy > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600 text-xs">Buy <span className="font-bold text-emerald-600">{formatCurrency(totalToBuy)}</span></span>
            </div>
          )}
          {onTarget > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-slate-400 text-xs">{onTarget} on target</span>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
              {['Category', 'Action', 'Current Value', 'Current %', 'Goal %', 'Target Value', 'Amount'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item: ActionItem, i) => {
              const cfg = ACTION_CONFIG[item.action];
              return (
                <tr
                  key={item.category}
                  className={`${cfg.row} transition-colors`}
                  style={{ borderBottom: i < items.length - 1 ? '1px solid #f8fafc' : 'none' }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: colorMap[item.category] ?? FALLBACK_COLOR }} />
                      <span className="font-semibold text-slate-800">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide ${cfg.pill}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 tabular-nums font-medium">{formatCurrency(item.currentValue)}</td>
                  <td className="px-5 py-3.5 text-slate-700 tabular-nums">{item.currentPercent.toFixed(1)}%</td>
                  <td className="px-5 py-3.5 text-slate-400 tabular-nums">{item.goalPercent > 0 ? `${item.goalPercent}%` : '—'}</td>
                  <td className="px-5 py-3.5 text-slate-400 tabular-nums">{item.goalPercent > 0 ? formatCurrency(item.targetValue) : '—'}</td>
                  <td className={`px-5 py-3.5 font-bold tabular-nums ${
                    item.action === 'ON TARGET' ? 'text-slate-300' :
                    item.action === 'BUY' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {item.action === 'ON TARGET'
                      ? <span className="text-slate-400 text-base">✓</span>
                      : item.action === 'BUY'
                      ? `+${formatCurrency(item.delta)}`
                      : `-${formatCurrency(Math.abs(item.delta))}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {goals.length === 0 && (
        <p className="px-6 py-4 text-xs text-slate-400" style={{ borderTop: '1px solid #f1f5f9' }}>
          No goals set — visit the Goals page to define your target allocations.
        </p>
      )}
    </div>
  );
}
