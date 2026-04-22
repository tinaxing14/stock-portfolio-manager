'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { HoldingWithValue, PortfolioGoal } from '@/lib/types';
import { getGoalPieData, formatCurrency } from '@/lib/utils';
import { usePortfolio } from '@/lib/PortfolioContext';

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  portfolioTotal: number;
  currentByCategory: Record<string, number>;
}

function GoalTooltip({ active, payload, portfolioTotal, currentByCategory }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0].payload;
  const targetValue = portfolioTotal * (value / 100);
  const currentValue = currentByCategory[name] ?? 0;
  const currentPct = portfolioTotal > 0 ? (currentValue / portfolioTotal) * 100 : 0;
  const delta = targetValue - currentValue;
  const isOver = delta < 0;
  const onTarget = Math.abs(delta) <= portfolioTotal * 0.001;

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-3.5 py-3 text-sm min-w-48 pointer-events-none">
      <div className="flex items-center gap-2 mb-2.5 pb-2.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fill }} />
        <span className="font-bold text-slate-900">{name}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-slate-400 text-xs">Target</span>
          <span className="font-semibold text-slate-700 tabular-nums text-xs">
            {value.toFixed(1)}%{portfolioTotal > 0 ? ` · ${formatCurrency(targetValue)}` : ''}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400 text-xs">Current</span>
          <span className="font-semibold text-slate-700 tabular-nums text-xs">
            {currentPct.toFixed(1)}%{portfolioTotal > 0 ? ` · ${formatCurrency(currentValue)}` : ''}
          </span>
        </div>
        {portfolioTotal > 0 && (
          <div className="flex justify-between gap-6 pt-1.5" style={{ borderTop: '1px solid #f1f5f9', marginTop: '0.25rem' }}>
            <span className="text-slate-400 text-xs">Difference</span>
            <span className={`font-bold text-xs tabular-nums ${onTarget ? 'text-slate-400' : isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
              {onTarget ? 'On target ✓' : `${isOver ? '−' : '+'}${formatCurrency(Math.abs(delta))}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props { goals: PortfolioGoal[]; holdings?: HoldingWithValue[]; portfolioTotal?: number }

export default function GoalPieChart({ goals, holdings = [], portfolioTotal = 0 }: Props) {
  const { colorMap } = usePortfolio();
  const data = getGoalPieData(goals, colorMap);
  const totalGoalPct = data.reduce((s, d) => s + d.value, 0);

  const currentByCategory = holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.category] = (acc[h.category] ?? 0) + h.totalValue;
    return acc;
  }, {});

  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center h-64 gap-3"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <p className="text-slate-400 text-sm font-medium">No goals set</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <h2 className="text-sm font-bold text-slate-800">Target Allocation</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          totalGoalPct === 100
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-amber-50 text-amber-600'
        }`}>
          {totalGoalPct < 100
            ? `${(100 - totalGoalPct).toFixed(0)}% unallocated`
            : totalGoalPct > 100
            ? `${(totalGoalPct - 100).toFixed(0)}% over`
            : 'Fully allocated ✓'}
        </span>
      </div>

      <div className="p-5 flex gap-4">
        {/* Pie */}
        <div className="shrink-0 w-44">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={46} outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip
                content={(props: any) => (
                  <GoalTooltip {...props} portfolioTotal={portfolioTotal} currentByCategory={currentByCategory} />
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary table */}
        <div className="flex-1 min-w-0 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left pb-2 font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="text-right pb-2 font-bold text-slate-400 uppercase tracking-wider">Target</th>
                <th className="text-right pb-2 font-bold text-slate-400 uppercase tracking-wider">Current</th>
                <th className="text-right pb-2 font-bold text-slate-400 uppercase tracking-wider">Diff</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const currentValue = currentByCategory[row.name] ?? 0;
                const currentPct = portfolioTotal > 0 ? (currentValue / portfolioTotal) * 100 : 0;
                const diff = row.value - currentPct;
                const onTarget = Math.abs(diff) < 0.1;
                return (
                  <tr key={i} style={{ borderBottom: i < data.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <td className="py-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.fill }} />
                      <span className="truncate text-slate-700 font-medium">{row.name}</span>
                    </td>
                    <td className="py-2 text-right text-slate-700 font-bold tabular-nums">{row.value.toFixed(1)}%</td>
                    <td className="py-2 text-right text-slate-500 tabular-nums">{currentPct.toFixed(1)}%</td>
                    <td className={`py-2 text-right font-bold tabular-nums ${
                      onTarget ? 'text-slate-400' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {onTarget ? '✓' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #f1f5f9' }}>
                <td className="pt-2.5 text-slate-500 font-bold uppercase tracking-wide text-xs">Total</td>
                <td className="pt-2.5 text-right text-slate-800 font-bold tabular-nums">{totalGoalPct.toFixed(1)}%</td>
                <td className="pt-2.5 text-right text-slate-500 tabular-nums">
                  {portfolioTotal > 0 ? '100%' : '—'}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
