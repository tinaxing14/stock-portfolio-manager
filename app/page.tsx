'use client';

import { usePortfolio } from '@/lib/PortfolioContext';
import { getTotalValue } from '@/lib/utils';
import SummaryCards from '@/components/SummaryCards';
import CashOverview from '@/components/CashOverview';
import DrilldownPieChart from '@/components/DrilldownPieChart';
import GoalPieChart from '@/components/GoalPieChart';
import GoalsBarChart from '@/components/GoalsBarChart';
import ActionPlanTable from '@/components/ActionPlanTable';
import AutoInvestmentTracker from '@/components/AutoInvestmentTracker';
import DashboardNotes from '@/components/DashboardNotes';
import PerformanceChart from '@/components/PerformanceChart';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardPage() {
  const { holdings, goals, isLoaded, currentAccountId, accounts } = usePortfolio();
  const investmentHoldings = holdings.filter((h) => h.category !== 'Cash');
  const portfolioTotal = getTotalValue(investmentHoldings);
  const accountName = accounts.find((a) => a.id === currentAccountId)?.name;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-400 font-medium">Loading portfolio…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {accountName ?? 'Portfolio'} Overview
          </h1>
        </div>
        <p className="text-xs text-slate-400 pb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <SummaryCards holdings={holdings} goals={goals} />

      <PerformanceChart />

      <CashOverview holdings={holdings} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DrilldownPieChart holdings={holdings} />
        <GoalPieChart goals={goals} holdings={investmentHoldings} portfolioTotal={portfolioTotal} />
      </div>

      <GoalsBarChart holdings={investmentHoldings} goals={goals} />

      <ActionPlanTable holdings={investmentHoldings} goals={goals} />

      <AutoInvestmentTracker />

      <DashboardNotes accountId={currentAccountId} />
    </div>
  );
}
