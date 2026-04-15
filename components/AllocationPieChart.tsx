'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { HoldingWithValue } from '@/lib/types';
import { formatCurrency, formatPercent, getPieData } from '@/lib/utils';
import { usePortfolio } from '@/lib/PortfolioContext';

interface Props { holdings: HoldingWithValue[] }

export default function AllocationPieChart({ holdings }: Props) {
  const { colorMap } = usePortfolio();
  const data = getPieData(holdings, colorMap);
  const total = holdings.reduce((s, h) => s + h.totalValue, 0);

  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center h-80">
        <p className="text-slate-400 text-sm">No holdings yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Allocation by Category</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value">
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Pie>
          <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Value']} />
          <Legend
            formatter={(value, entry: any) => `${value} (${formatPercent((entry.payload.value / total) * 100)})`}
            iconSize={10} iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
