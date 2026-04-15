'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { HoldingWithValue, PortfolioGoal } from '@/lib/types';
import { getAllocationRows } from '@/lib/utils';
import { usePortfolio } from '@/lib/PortfolioContext';

interface Props { holdings: HoldingWithValue[]; goals: PortfolioGoal[] }

export default function GoalsBarChart({ holdings, goals }: Props) {
  const { colorMap } = usePortfolio();
  const rows = getAllocationRows(holdings.filter((h) => h.category !== 'Cash'), goals).filter((r) =>
    r.category !== 'Cash' && goals.some((g) => g.category === r.category)
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Current vs Goal Allocation</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="category" tick={{ fontSize: 11 }} />
          <YAxis unit="%" tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
          <Legend />
          <Bar dataKey="currentPercent" name="Current %" radius={[4, 4, 0, 0]}>
            {rows.map((r, i) => (
              <Cell key={i} fill={Math.abs(r.diff) > 5 ? '#f43f5e' : (colorMap[r.category] ?? '#6366f1')} />
            ))}
          </Bar>
          <Bar dataKey="goalPercent" name="Goal %" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
