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
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2.5 text-sm min-w-[200px]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
        <span className="font-semibold text-slate-800">{name}</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Target</span>
          <span className="font-medium text-slate-700">{value.toFixed(1)}%{portfolioTotal > 0 ? ` · ${formatCurrency(targetValue)}` : ''}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Current</span>
          <span className="font-medium text-slate-700">{currentPct.toFixed(1)}%{portfolioTotal > 0 ? ` · ${formatCurrency(currentValue)}` : ''}</span>
        </div>
        {portfolioTotal > 0 && (
          <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 mt-1">
            <span className="text-slate-400">Difference</span>
            <span className={`font-semibold ${onTarget ? 'text-slate-400' : isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
              {onTarget ? 'On target' : `${isOver ? '−' : '+'}${formatCurrency(Math.abs(delta))}`}
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">No goals set</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Target Allocation</h2>
        <span className={`text-xs font-medium ${totalGoalPct === 100 ? 'text-emerald-600' : 'text-amber-500'}`}>
          {totalGoalPct < 100
            ? `${(100 - totalGoalPct).toFixed(0)}% unallocated`
            : totalGoalPct > 100
            ? `${(totalGoalPct - 100).toFixed(0)}% over`
            : 'Fully allocated ✓'}
        </span>
      </div>

      <div className="flex gap-4">
        {/* Pie */}
        <div className="flex-shrink-0 w-48">
          <ResponsiveContainer width="100%" height={192}>
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip content={(props: any) => <GoalTooltip {...props} portfolioTotal={portfolioTotal} currentByCategory={currentByCategory} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary table */}
        <div className="flex-1 min-w-0 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="text-left pb-2 font-semibold">Category</th>
                <th className="text-right pb-2 font-semibold">Target</th>
                <th className="text-right pb-2 font-semibold">Current</th>
                <th className="text-right pb-2 font-semibold">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, i) => {
                const currentValue = currentByCategory[row.name] ?? 0;
                const currentPct = portfolioTotal > 0 ? (currentValue / portfolioTotal) * 100 : 0;
                const diff = row.value - currentPct;
                const onTarget = Math.abs(diff) < 0.1;
                return (
                  <tr key={i}>
                    <td className="py-1.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: row.fill }} />
                      <span className="truncate text-slate-700">{row.name}</span>
                    </td>
                    <td className="py-1.5 text-right text-slate-700 font-semibold">{row.value.toFixed(1)}%</td>
                    <td className="py-1.5 text-right text-slate-500">{currentPct.toFixed(1)}%</td>
                    <td className={`py-1.5 text-right font-semibold ${onTarget ? 'text-slate-400' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {onTarget ? '✓' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="pt-2 text-slate-500 font-semibold">Total</td>
                <td className="pt-2 text-right text-slate-700 font-semibold">{totalGoalPct.toFixed(1)}%</td>
                <td className="pt-2 text-right text-slate-500">
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
