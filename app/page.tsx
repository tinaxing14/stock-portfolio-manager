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

export default function DashboardPage() {
  const { holdings, goals, isLoaded, currentAccountId } = usePortfolio();
  const investmentHoldings = holdings.filter((h) => h.category !== 'Cash');
  const portfolioTotal = getTotalValue(investmentHoldings);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Your portfolio overview</p>
      </div>

      <SummaryCards holdings={holdings} goals={goals} />

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
