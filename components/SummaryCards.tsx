'use client';

import { HoldingWithValue, PortfolioGoal } from '@/lib/types';
import { formatCurrency, formatPercent, getTotalValue, getAllocationRows } from '@/lib/utils';

interface Props { holdings: HoldingWithValue[]; goals: PortfolioGoal[] }

export default function SummaryCards({ holdings, goals }: Props) {
  const totalValue = getTotalValue(holdings);
  const investmentHoldings = holdings.filter((h) => h.category !== 'Cash');
  const investmentTotal = getTotalValue(investmentHoldings);
  const rows = getAllocationRows(holdings, goals).filter((r) => r.category !== 'Cash');
  const maxDiff = rows.reduce<typeof rows[0] | null>(
    (max, r) => (max === null || Math.abs(r.diff) > Math.abs(max.diff) ? r : max), null
  );
  const brokerageCount = new Set(holdings.map((h) => h.brokerage)).size;

  const categoryTotals = investmentHoldings.reduce<Record<string, number>>((acc, h) => {
    acc[h.category] = (acc[h.category] ?? 0) + h.totalValue;
    return acc;
  }, {});
  const largestCategory = Object.entries(categoryTotals)
    .reduce<{ name: string; value: number } | null>(
      (max, [name, value]) => (max === null || value > max.value ? { name, value } : max), null
    );

  const cards = [
    {
      label: 'Total Portfolio Value',
      value: formatCurrency(totalValue),
      sub: `${holdings.length} position${holdings.length !== 1 ? 's' : ''} across ${brokerageCount} brokerage${brokerageCount !== 1 ? 's' : ''}`,
      color: 'bg-indigo-50 border-indigo-200',
      valueColor: 'text-indigo-700',
    },
    {
      label: 'Largest Investment',
      value: largestCategory ? largestCategory.name : '—',
      sub: largestCategory
        ? `${formatCurrency(largestCategory.value)} · ${formatPercent(investmentTotal > 0 ? (largestCategory.value / investmentTotal) * 100 : 0)}`
        : 'No holdings yet',
      color: 'bg-blue-50 border-blue-200',
      valueColor: 'text-blue-700',
    },
    {
      label: 'Most Off-Target',
      value: maxDiff ? maxDiff.category : '—',
      sub: maxDiff
        ? `${maxDiff.diff > 0 ? '+' : ''}${formatPercent(maxDiff.diff)} vs ${formatPercent(maxDiff.goalPercent)} goal`
        : 'Set goals to track',
      color: maxDiff && Math.abs(maxDiff.diff) > 5 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200',
      valueColor: maxDiff && Math.abs(maxDiff.diff) > 5 ? 'text-rose-700' : 'text-emerald-700',
    },
    {
      label: 'Holdings',
      value: String(holdings.length),
      sub: `${new Set(holdings.map((h) => h.category)).size} categories`,
      color: 'bg-violet-50 border-violet-200',
      valueColor: 'text-violet-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl border p-5 ${c.color}`}>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{c.label}</p>
          <p className={`text-2xl font-bold ${c.valueColor} mb-1`}>{c.value}</p>
          <p className="text-xs text-slate-500">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
