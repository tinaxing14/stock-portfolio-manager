'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency } from '@/lib/utils';

interface AccountSlice {
  accountId: string;
  name: string;
  cash: number;
  invested: number;
  total: number;
}

interface NonIraData {
  total: number;
  totalCash: number;
  totalInvested: number;
  cashPct: number;
  investedPct: number;
  byAccount: AccountSlice[];
}

function ChartTooltip({ active, payload, total }: { active?: boolean; payload?: any[]; total: number }) {
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

export default function NonIraAllocationCard() {
  const { snapshotTick } = usePortfolio();
  const [data, setData] = useState<NonIraData | null>(null);

  useEffect(() => {
    fetch('/api/portfolio-allocation')
      .then((r) => r.json())
      .then((d) => setData(d.nonIra))
      .catch(() => {});
  }, [snapshotTick]);

  if (!data || data.total === 0) return null;

  const pieData = [
    { name: 'Investments', value: data.totalInvested, fill: '#6366f1' },
    { name: 'Cash',        value: data.totalCash,     fill: '#22c55e' },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>

      {/* Header */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <h2 className="text-base font-bold text-slate-800">Non-IRA Allocation</h2>
        <p className="text-xs text-slate-400 mt-0.5">Cash vs investments across taxable accounts only</p>
      </div>

      <div className="p-6">
        <div className="flex gap-8 items-center mb-8">
          {/* Donut */}
          <div className="shrink-0 w-44">
            <ResponsiveContainer width="100%" height={176}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%"
                  innerRadius={48} outerRadius={80} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={(props: any) => <ChartTooltip {...props} total={data.total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Summary stats */}
          <div className="flex-1 space-y-4">
            {/* Investments */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">Investments</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-bold text-slate-900 tabular-nums">{formatCurrency(data.totalInvested)}</span>
                  <span className="text-sm font-bold text-indigo-500 tabular-nums">{data.investedPct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.investedPct}%` }} />
              </div>
            </div>

            {/* Cash */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">Cash</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-bold text-slate-900 tabular-nums">{formatCurrency(data.totalCash)}</span>
                  <span className="text-sm font-bold text-emerald-600 tabular-nums">{data.cashPct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.cashPct}%` }} />
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total (Non-IRA)</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(data.total)}</span>
            </div>
          </div>
        </div>

        {/* Per-account breakdown */}
        {data.byAccount.length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9' }}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-5 mb-4">By Account</p>
            <div className="space-y-5">
              {data.byAccount.map((acc) => {
                const accInvPct  = acc.total > 0 ? (acc.invested / acc.total) * 100 : 0;
                const accCashPct = acc.total > 0 ? (acc.cash     / acc.total) * 100 : 0;
                const ofTotal    = data.total > 0 ? (acc.total   / data.total) * 100 : 0;
                return (
                  <div key={acc.accountId}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{acc.name}</span>
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums">
                          {ofTotal.toFixed(1)}% of non-IRA
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-700 tabular-nums">{formatCurrency(acc.total)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-2.5">
                      <div className="bg-indigo-50 rounded-xl px-3.5 py-2.5">
                        <p className="text-xs text-indigo-400 font-medium mb-0.5">Invested</p>
                        <p className="text-sm font-bold text-indigo-700 tabular-nums">{formatCurrency(acc.invested)}</p>
                        <p className="text-xs text-indigo-400 tabular-nums mt-0.5">{accInvPct.toFixed(1)}% of account</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl px-3.5 py-2.5">
                        <p className="text-xs text-emerald-500 font-medium mb-0.5">Cash</p>
                        <p className="text-sm font-bold text-emerald-700 tabular-nums">{formatCurrency(acc.cash)}</p>
                        <p className="text-xs text-emerald-500 tabular-nums mt-0.5">{accCashPct.toFixed(1)}% of account</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-slate-100 flex">
                      <div className="h-full bg-indigo-400 transition-all duration-500" style={{ width: `${accInvPct}%` }} />
                      <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${accCashPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
