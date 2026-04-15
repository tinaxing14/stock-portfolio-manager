'use client';

import { usePortfolio } from '@/lib/PortfolioContext';
import HoldingsList from '@/components/HoldingsList';
import { formatCurrency, getTotalValue } from '@/lib/utils';

export default function HoldingsPage() {
  const { holdings, isLoaded } = usePortfolio();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm">Loading holdings...</p>
        </div>
      </div>
    );
  }

  const total = getTotalValue(holdings);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Holdings</h1>
          <p className="text-sm text-slate-500 mt-1">
            {holdings.length} position{holdings.length !== 1 ? 's' : ''} · {formatCurrency(total)} total
          </p>
        </div>
      </div>
      <HoldingsList />
    </div>
  );
}
