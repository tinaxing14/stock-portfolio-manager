'use client';

import TotalAllocationCard from '@/components/TotalAllocationCard';

export default function OverviewPage() {
  return (
    <div className="space-y-6 max-w-screen-2xl">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Overview</p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portfolio Overview</h1>
      </div>

      <TotalAllocationCard />
    </div>
  );
}
