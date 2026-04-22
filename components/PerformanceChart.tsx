'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import LoadingSpinner from './LoadingSpinner';

type Range = '1D' | '1W' | '1M' | 'YTD' | '1Y' | '3Y';

const RANGES: Range[] = ['1D', '1W', '1M', 'YTD', '1Y', '3Y'];

interface Snapshot { date: string; value: number; }

function getRangeCutoff(range: Range): string {
  const now = new Date();
  switch (range) {
    case '1D': { const d = new Date(now); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }
    case '1W': { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); }
    case '1M': { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); }
    case 'YTD': return `${now.getFullYear()}-01-01`;
    case '1Y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString().slice(0, 10); }
    case '3Y': { const d = new Date(now); d.setFullYear(d.getFullYear() - 3); return d.toISOString().slice(0, 10); }
  }
}

function formatXLabel(date: string, range: Range): string {
  const d = new Date(date + 'T00:00:00');
  if (range === '1D' || range === '1W') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (range === '1M' || range === 'YTD') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function formatDateFull(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 shadow-xl text-sm">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="font-bold text-slate-900 tabular-nums">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function PerformanceChart() {
  const { currentAccountId, snapshotTick, isAutoRefreshing } = usePortfolio();
  const [allSnapshots, setAllSnapshots] = useState<Snapshot[]>([]);
  const [range, setRange] = useState<Range>('1M');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/performance?accountId=${currentAccountId}`)
      .then((r) => r.json())
      .then((data: Snapshot[]) => { setAllSnapshots(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentAccountId, snapshotTick]);

  const cutoff = useMemo(() => getRangeCutoff(range), [range]);

  // Chart data: prepend one point before the cutoff for visual continuity at the left edge
  const filtered = useMemo(() => {
    if (allSnapshots.length === 0) return [];
    const result = allSnapshots.filter((s) => s.date >= cutoff);
    if (result.length === 0) return allSnapshots.slice(-2);
    const hasPrior = allSnapshots.find((s) => s.date < cutoff);
    if (hasPrior) return [hasPrior, ...result];
    return result;
  }, [allSnapshots, cutoff]);

  const chartData = useMemo(() =>
    filtered.map((s) => ({ label: formatXLabel(s.date, range), date: s.date, value: s.value })),
    [filtered, range]
  );

  // Current value = latest snapshot
  const currentValue = allSnapshots.length > 0 ? allSnapshots[allSnapshots.length - 1].value : null;
  const currentDate  = allSnapshots.length > 0 ? allSnapshots[allSnapshots.length - 1].date : null;

  // Starting value for the selected range = first snapshot AT or AFTER cutoff
  const rangeStart = useMemo(() => {
    const atOrAfter = allSnapshots.filter((s) => s.date >= cutoff);
    return atOrAfter[0] ?? null;
  }, [allSnapshots, cutoff]);

  const lineColor = '#6366f1';

  const yMin = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.floor(Math.min(...chartData.map((d) => d.value)) * 0.97);
  }, [chartData]);

  const yMax = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.ceil(Math.max(...chartData.map((d) => d.value)) * 1.03);
  }, [chartData]);

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex flex-wrap items-start justify-between gap-4"
        style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-slate-900">Account Value</h2>
            {isAutoRefreshing && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                <LoadingSpinner size="xs" />
                Updating…
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Total value snapshot recorded daily</p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                range === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats: current value + range start value */}
      {currentValue !== null && (
        <div className="px-6 py-4 flex flex-wrap gap-8" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <p className="text-xs font-medium text-slate-400 mb-0.5 uppercase tracking-wide">
              Current Value{currentDate ? ` · ${formatDateFull(currentDate)}` : ''}
            </p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              {formatCurrency(currentValue)}
            </p>
          </div>
          {rangeStart && rangeStart.date !== currentDate && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-0.5 uppercase tracking-wide">
                {range} ago · {formatDateFull(rangeStart.date)}
              </p>
              <p className="text-2xl font-bold text-slate-500 tabular-nums tracking-tight">
                {formatCurrency(rangeStart.value)}
              </p>
            </div>
          )}
          <div className="ml-auto text-right self-center">
            <p className="text-xs font-medium text-slate-400 mb-0.5 uppercase tracking-wide">Snapshots</p>
            <p className="text-sm font-semibold text-slate-600">{allSnapshots.length} days recorded</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="px-2 pt-2 pb-4">
        {loading ? (
          <div className="h-56 flex items-center justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : chartData.length < 2 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center gap-3 px-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <div>
              <p className="text-slate-700 font-semibold text-sm">Building value history</p>
              <p className="text-slate-400 text-xs mt-1 max-w-xs">
                {allSnapshots.length === 0
                  ? 'A snapshot is recorded daily when you open the app.'
                  : allSnapshots.length === 1
                  ? 'Come back tomorrow to see your first trend line.'
                  : 'Try a wider time range to see more history.'}
              </p>
            </div>
            {allSnapshots.length >= 1 && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs text-slate-600">
                Latest: <span className="font-semibold tabular-nums">{formatCurrency(allSnapshots[allSnapshots.length - 1].value)}</span>
                <span className="text-slate-400 ml-1.5">on {formatDateFull(allSnapshots[allSnapshots.length - 1].date)}</span>
              </div>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="value-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Inter, sans-serif' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[yMin, yMax]}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Inter, sans-serif' }}
                axisLine={false}
                tickLine={false}
                width={58}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2.5}
                fill="url(#value-fill)"
                dot={chartData.length <= 10 ? { r: 3.5, fill: lineColor, strokeWidth: 0 } : false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'white', fill: lineColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
