'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { HoldingWithValue } from '@/lib/types';
import { formatCurrency, getTotalValue } from '@/lib/utils';
import { usePortfolio } from '@/lib/PortfolioContext';
import { FALLBACK_COLOR } from '@/lib/constants';

const SUB_COLORS = [
  '#6366f1','#3b82f6','#0ea5e9','#10b981','#f59e0b',
  '#8b5cf6','#ec4899','#f97316','#eab308','#ef4444',
  '#06b6d4','#84cc16','#a855f7','#14b8a6','#f43f5e',
];

interface SliceData { name: string; value: number; fill: string }

function buildCategorySlices(holdings: HoldingWithValue[], colorMap: Record<string, string>): SliceData[] {
  const map = new Map<string, number>();
  for (const h of holdings) map.set(h.category, (map.get(h.category) ?? 0) + h.totalValue);
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, fill: colorMap[name] ?? FALLBACK_COLOR }))
    .sort((a, b) => b.value - a.value);
}

function buildSubCategorySlices(holdings: HoldingWithValue[], category: string): SliceData[] {
  const filtered = holdings.filter((h) => h.category === category);
  const map = new Map<string, number>();
  for (const h of filtered) {
    const key = h.subCategory || h.ticker;
    map.set(key, (map.get(key) ?? 0) + h.totalValue);
  }
  return Array.from(map.entries())
    .map(([name, value], i) => ({ name, value, fill: SUB_COLORS[i % SUB_COLORS.length] }))
    .sort((a, b) => b.value - a.value);
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 7}
    startAngle={startAngle} endAngle={endAngle} fill={fill} />;
};

function PieTooltip({ active, payload, total }: { active?: boolean; payload?: any[]; total: number }) {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0].payload;
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-3.5 py-2.5 text-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fill }} />
        <span className="font-bold text-slate-900">{name}</span>
      </div>
      <div className="text-slate-700 font-semibold tabular-nums">{formatCurrency(value)}</div>
      <div className="text-slate-400 text-xs mt-0.5">{pct.toFixed(1)}% of portfolio</div>
    </div>
  );
}

export default function DrilldownPieChart({ holdings }: { holdings: HoldingWithValue[] }) {
  const { colorMap } = usePortfolio();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const investmentHoldings = holdings.filter((h) => h.category !== 'Cash');
  const total = getTotalValue(investmentHoldings);
  const data: SliceData[] = selectedCategory
    ? buildSubCategorySlices(investmentHoldings, selectedCategory)
    : buildCategorySlices(investmentHoldings, colorMap);

  if (!investmentHoldings.length) {
    return (
      <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center h-64 gap-3"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
          </svg>
        </div>
        <p className="text-slate-400 text-sm font-medium">No holdings yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
        {selectedCategory && (
          <button
            onClick={() => { setSelectedCategory(null); setActiveIndex(null); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
        )}
        <h2 className="text-sm font-bold text-slate-800">
          {selectedCategory ? `${selectedCategory} — Detail` : 'Current Allocation'}
        </h2>
        {!selectedCategory && (
          <span className="ml-auto text-xs text-slate-400">Click a slice to drill down</span>
        )}
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
                activeShape={activeIndex !== null ? renderActiveShape : undefined}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(entry: { name?: string }) => {
                  if (!selectedCategory && entry.name) setSelectedCategory(entry.name);
                }}
                style={{ cursor: selectedCategory ? 'default' : 'pointer' }}
              >
                {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip content={(props: any) => <PieTooltip {...props} total={total} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary table */}
        <div className="flex-1 min-w-0 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th className="text-left pb-2 font-bold text-slate-400 uppercase tracking-wider">
                  {selectedCategory ? 'Sub-Category' : 'Category'}
                </th>
                <th className="text-right pb-2 font-bold text-slate-400 uppercase tracking-wider">Value</th>
                <th className="text-right pb-2 font-bold text-slate-400 uppercase tracking-wider">%</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={i}
                  className={`group ${!selectedCategory ? 'cursor-pointer' : ''} transition-colors hover:bg-slate-50`}
                  onClick={() => { if (!selectedCategory && row.name) setSelectedCategory(row.name); }}
                  style={{ borderBottom: i < data.length - 1 ? '1px solid #f8fafc' : 'none' }}
                >
                  <td className="py-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.fill }} />
                    <span className="truncate text-slate-700 font-medium">{row.name}</span>
                  </td>
                  <td className="py-2 text-right text-slate-700 font-semibold tabular-nums">{formatCurrency(row.value)}</td>
                  <td className="py-2 text-right tabular-nums">
                    <span className="text-slate-500 font-bold">{((row.value / total) * 100).toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #f1f5f9' }}>
                <td className="pt-2.5 text-slate-500 font-bold uppercase tracking-wide text-xs">Total</td>
                <td className="pt-2.5 text-right text-slate-800 font-bold tabular-nums">{formatCurrency(total)}</td>
                <td className="pt-2.5 text-right text-slate-500 font-bold">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
