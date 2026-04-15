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
  return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
    startAngle={startAngle} endAngle={endAngle} fill={fill} />;
};

function PieTooltip({ active, payload, total }: { active?: boolean; payload?: any[]; total: number }) {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0].payload;
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
        <span className="font-semibold text-slate-800">{name}</span>
      </div>
      <div className="text-slate-600">{formatCurrency(value)}</div>
      <div className="text-slate-400 text-xs">{pct.toFixed(1)}% of portfolio</div>
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">No holdings yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {selectedCategory && (
          <button onClick={() => { setSelectedCategory(null); setActiveIndex(null); }}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
            ← All
          </button>
        )}
        {selectedCategory && <span className="text-slate-300 text-xs">/</span>}
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          {selectedCategory ? `${selectedCategory} — Sub-Categories` : 'Current Allocation'}
        </h2>
        {!selectedCategory && (
          <span className="ml-auto text-xs text-slate-400">Click slice to drill down</span>
        )}
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
              <tr className="text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="text-left pb-2 font-semibold">
                  {selectedCategory ? 'Sub-Category' : 'Category'}
                </th>
                <th className="text-right pb-2 font-semibold">Value</th>
                <th className="text-right pb-2 font-semibold">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, i) => (
                <tr
                  key={i}
                  className={`${!selectedCategory ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                  onClick={() => { if (!selectedCategory && row.name) setSelectedCategory(row.name); }}
                >
                  <td className="py-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: row.fill }} />
                    <span className="truncate text-slate-700">{row.name}</span>
                  </td>
                  <td className="py-1.5 text-right text-slate-700 font-medium">{formatCurrency(row.value)}</td>
                  <td className="py-1.5 text-right text-slate-500 font-semibold">
                    {((row.value / total) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="pt-2 text-slate-500 font-semibold">Total</td>
                <td className="pt-2 text-right text-slate-700 font-semibold">{formatCurrency(total)}</td>
                <td className="pt-2 text-right text-slate-500 font-semibold">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
