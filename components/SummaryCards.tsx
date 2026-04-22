'use client';

import { HoldingWithValue, PortfolioGoal } from '@/lib/types';
import { formatCurrency, formatPercent, getTotalValue, getAllocationRows } from '@/lib/utils';

interface Props { holdings: HoldingWithValue[]; goals: PortfolioGoal[] }

const CardIcon = ({ bg, children }: { bg: string; children: React.ReactNode }) => (
  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
    {children}
  </div>
);

const icons = {
  portfolio: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><path d="M8 7V5a2 2 0 0 0-2-2"/>
      <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  ),
  largest: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  target: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  holdings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
};

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

  const isOffTarget = maxDiff && Math.abs(maxDiff.diff) > 5;

  const cards = [
    {
      label: 'Portfolio Value',
      value: formatCurrency(totalValue),
      sub: `${holdings.length} position${holdings.length !== 1 ? 's' : ''} · ${brokerageCount} brokerage${brokerageCount !== 1 ? 's' : ''}`,
      icon: <CardIcon bg="bg-indigo-50">{icons.portfolio}</CardIcon>,
      valueColor: 'text-slate-900',
      trend: null,
    },
    {
      label: 'Largest Category',
      value: largestCategory ? largestCategory.name : '—',
      sub: largestCategory
        ? `${formatCurrency(largestCategory.value)} · ${formatPercent(investmentTotal > 0 ? (largestCategory.value / investmentTotal) * 100 : 0)}`
        : 'No holdings yet',
      icon: <CardIcon bg="bg-sky-50">{icons.largest}</CardIcon>,
      valueColor: 'text-slate-900',
      trend: null,
    },
    {
      label: 'Most Off-Target',
      value: maxDiff ? maxDiff.category : '—',
      sub: maxDiff
        ? `${maxDiff.diff > 0 ? '+' : ''}${formatPercent(maxDiff.diff)} vs ${formatPercent(maxDiff.goalPercent)} goal`
        : 'Set goals to track',
      icon: <CardIcon bg={isOffTarget ? 'bg-rose-50' : 'bg-violet-50'}>{icons.target}</CardIcon>,
      valueColor: isOffTarget ? 'text-rose-600' : 'text-slate-900',
      trend: maxDiff ? (isOffTarget ? 'over' : 'on') : null,
    },
    {
      label: 'Total Holdings',
      value: String(holdings.length),
      sub: `${new Set(holdings.map((h) => h.category)).size} categor${new Set(holdings.map((h) => h.category)).size !== 1 ? 'ies' : 'y'}`,
      icon: <CardIcon bg="bg-emerald-50">{icons.holdings}</CardIcon>,
      valueColor: 'text-slate-900',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white rounded-2xl p-5 flex gap-4 items-start"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          {c.icon}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">{c.label}</p>
            <p className={`text-2xl font-bold tabular-nums tracking-tight leading-none mb-1.5 ${c.valueColor}`}>
              {c.value}
            </p>
            <p className="text-xs text-slate-400 truncate">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
