'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency } from '@/lib/utils';

interface AllocationData {
  total: number;
  totalCash: number;
  totalInvested: number;
  cashPct: number;
  investedPct: number;
  byAccount: { accountId: string; name: string; cash: number; invested: number; total: number }[];
}

function Tooltip_({ active, payload, total }: { active?: boolean; payload?: any[]; total: number }) {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0].payload;
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-3.5 py-2.5 text-sm pointer-events-none">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fill }} />
        <span className="font-bold text-slate-900">{name}</span>
      </div>
      <div className="text-slate-700 font-semibold tabular-nums">{formatCurrency(value)}</div>
      <div className="text-slate-400 text-xs mt-0.5">{pct.toFixed(1)}% of total</div>
    </div>
  );
}

export default function TotalAllocationCard() {
  const { snapshotTick } = usePortfolio();
  const [data, setData] = useState<AllocationData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/portfolio-allocation')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [snapshotTick]);

  if (!data || data.total === 0) return null;

  const pieData = [
    { name: 'Investments', value: data.totalInvested, fill: '#6366f1' },
    { name: 'Cash', value: data.totalCash, fill: '#22c55e' },
  ].filter((d) => d.value > 0);

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Total Portfolio Allocation</h2>
          <p className="text-xs text-slate-400 mt-0.5">Cash vs investments across all accounts</p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          {expanded ? 'Hide breakdown' : 'By account'}
        </button>
      </div>

      <div className="p-5">
        <div className="flex gap-6 items-center">
          {/* Donut */}
          <div className="shrink-0 w-36">
            <ResponsiveContainer width="100%" height={144}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={38} outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={(props: any) => <Tooltip_ {...props} total={data.total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            {/* Invested */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-sm font-semibold text-slate-700">Investments</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(data.totalInvested)}</span>
                <span className="text-xs font-semibold text-indigo-500 tabular-nums w-14 text-right">{data.investedPct.toFixed(1)}%</span>
              </div>
            </div>

            {/* Cash */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-slate-700">Cash</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(data.totalCash)}</span>
                <span className="text-xs font-semibold text-emerald-600 tabular-nums w-14 text-right">{data.cashPct.toFixed(1)}%</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full overflow-hidden bg-slate-100 flex">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${data.investedPct}%` }}
              />
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${data.cashPct}%` }}
              />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Net Worth</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(data.total)}</span>
            </div>
          </div>
        </div>

        {/* Per-account breakdown */}
        {expanded && data.byAccount.length > 0 && (
          <div className="mt-4 pt-4 space-y-2.5" style={{ borderTop: '1px solid #f1f5f9' }}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">By Account</p>
            {data.byAccount.map((acc) => {
              const accInvPct  = acc.total > 0 ? (acc.invested / acc.total) * 100 : 0;
              const accCashPct = acc.total > 0 ? (acc.cash    / acc.total) * 100 : 0;
              return (
                <div key={acc.accountId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600">{acc.name}</span>
                    <div className="flex items-center gap-3 text-xs tabular-nums text-slate-500">
                      <span className="text-indigo-500 font-semibold">{formatCurrency(acc.invested)} invested</span>
                      {acc.cash > 0 && <span className="text-emerald-600 font-semibold">{formatCurrency(acc.cash)} cash</span>}
                      <span className="text-slate-400">{formatCurrency(acc.total)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-100 flex">
                    <div className="h-full bg-indigo-400" style={{ width: `${accInvPct}%` }} />
                    <div className="h-full bg-emerald-400" style={{ width: `${accCashPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
