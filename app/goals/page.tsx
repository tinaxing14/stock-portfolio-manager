'use client';

import { useState, useCallback } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { getAllocationRows, formatCurrency, getTotalValue } from '@/lib/utils';
import { FALLBACK_COLOR } from '@/lib/constants';
import { PortfolioGoal } from '@/lib/types';
import GoalPieChart from '@/components/GoalPieChart';

export default function GoalsPage() {
  const { holdings, goals, categories, colorMap, isLoaded, updateGoals } = usePortfolio();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PortfolioGoal[]>([]);
  const [addCategory, setAddCategory] = useState('');

  const startEdit = useCallback(() => {
    setDraft(goals.map((g) => ({ ...g })));
    setEditing(true);
    setAddCategory('');
  }, [goals]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDraft([]);
    setAddCategory('');
  }, []);

  const saveEdit = useCallback(() => {
    updateGoals(draft.filter((g) => g.goalPercent > 0));
    setEditing(false);
    setDraft([]);
    setAddCategory('');
  }, [draft, updateGoals]);

  const setGoalValue = useCallback((category: string, value: string) => {
    const num = parseFloat(value) || 0;
    setDraft((prev) =>
      prev.map((g) => g.category === category ? { ...g, goalPercent: num } : g)
    );
  }, []);

  const removeGoal = useCallback((category: string) => {
    setDraft((prev) => prev.filter((g) => g.category !== category));
  }, []);

  const addGoal = useCallback(() => {
    if (!addCategory) return;
    setDraft((prev) => [...prev, { category: addCategory, goalPercent: 0 }]);
    setAddCategory('');
  }, [addCategory]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const investmentHoldings = holdings.filter((h) => h.category !== 'Cash');
  const total = getTotalValue(investmentHoldings);
  const activeGoals = editing ? draft.filter((g) => g.goalPercent > 0) : goals;
  const rows = getAllocationRows(investmentHoldings, activeGoals).filter((r) =>
    activeGoals.some((g) => g.category === r.category)
  );

  const totalGoalPct = (editing ? draft : goals).reduce((s, g) => s + g.goalPercent, 0);
  const totalOk = Math.abs(totalGoalPct - 100) < 0.01;

  const draftCategories = new Set(draft.map((g) => g.category));
  // Categories not yet in draft — offered as autocomplete suggestions
  const availableToAdd = categories.filter((c) => !draftCategories.has(c.name));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portfolio Goals</h1>
          <p className="text-sm text-slate-500 mt-1">Set target allocations and track your progress</p>
        </div>
        {!editing ? (
          <button
            onClick={startEdit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Edit Goals
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={cancelEdit} className="border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={!totalOk}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Save Goals
            </button>
          </div>
        )}
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Set Target Allocations</h2>
            <span className={`text-sm font-semibold ${totalOk ? 'text-emerald-600' : 'text-rose-600'}`}>
              Total: {totalGoalPct.toFixed(1)}% {totalOk ? '✓' : '(must equal 100%)'}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {draft.map(({ category }) => (
              <div key={category} className="flex items-center gap-3 py-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colorMap[category] ?? FALLBACK_COLOR }}
                />
                <span className="text-sm text-slate-700 w-36 truncate">{category}</span>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={draft.find((g) => g.category === category)?.goalPercent || ''}
                    onChange={(e) => setGoalValue(category, e.target.value)}
                    placeholder="0"
                    className="w-16 px-2 py-1.5 text-sm text-right focus:outline-none"
                  />
                  <span className="px-2 text-xs text-slate-400 bg-slate-50 border-l border-slate-200 py-1.5">%</span>
                </div>
                <button
                  onClick={() => removeGoal(category)}
                  className="ml-auto text-rose-400 hover:text-rose-600 text-xs font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <input
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && addCategory.trim()) addGoal(); }}
              placeholder="Type a category name..."
              list="available-categories"
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 max-w-xs"
            />
            <datalist id="available-categories">
              {availableToAdd.map((c) => <option key={c.name} value={c.name} />)}
            </datalist>
            <button
              onClick={addGoal}
              disabled={!addCategory.trim() || draftCategories.has(addCategory.trim())}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Pie chart of goals */}
      <GoalPieChart goals={editing ? draft : goals} holdings={holdings} portfolioTotal={total} />

      {/* Progress rows */}
      <div className="grid gap-4">
        {rows.map((row) => {
          const safeDivisor = row.goalPercent > 0 ? row.goalPercent : 1;
          const pct = Math.min(row.currentPercent / safeDivisor, 1.5);
          const isOver = row.diff > 0;
          const isClose = Math.abs(row.diff) <= 2;
          return (
            <div key={row.category} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colorMap[row.category] ?? FALLBACK_COLOR }}
                  />
                  <span className="font-semibold text-slate-800">{row.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-800">{formatCurrency(row.totalValue)}</span>
                  <span className="text-xs text-slate-400 ml-2">({row.currentPercent.toFixed(2)}%)</span>
                </div>
              </div>
              <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                  style={{ left: `${Math.min((row.goalPercent / (row.goalPercent * 1.5)) * 100, 100)}%` }}
                />
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(pct * 100, 100)}%`,
                    backgroundColor: isClose ? '#10b981' : isOver ? '#f43f5e' : colorMap[row.category] ?? FALLBACK_COLOR,
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-slate-400">Goal: {row.goalPercent}%</span>
                <span className={`text-xs font-medium ${isClose ? 'text-emerald-600' : isOver ? 'text-rose-600' : 'text-amber-600'}`}>
                  {isClose
                    ? 'On target'
                    : isOver
                    ? `+${row.diff.toFixed(2)}% over`
                    : `${Math.abs(row.diff).toFixed(2)}% under`}
                  {!isClose && total > 0 && (
                    <span className="text-slate-400 font-normal ml-1">
                      ({formatCurrency(Math.abs(row.diff / 100) * total)} {isOver ? 'to reduce' : 'to add'})
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
