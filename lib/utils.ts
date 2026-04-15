import { Holding, HoldingWithValue, AllocationRow, PortfolioGoal, CategoryConfig } from './types';

export type ActionVerb = 'BUY' | 'SELL' | 'SELL ALL' | 'ON TARGET';

export interface ActionItem {
  category: string;
  currentValue: number;
  currentPercent: number;
  goalPercent: number;
  targetValue: number;
  delta: number;       // positive = need to buy, negative = need to sell
  action: ActionVerb;
}
import { FALLBACK_COLOR } from './constants';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function enrichHoldings(holdings: Holding[]): HoldingWithValue[] {
  const total = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  return holdings.map((h) => {
    const totalValue = h.shares * h.currentPrice;
    return {
      ...h,
      totalValue,
      portfolioPercent: total > 0 ? (totalValue / total) * 100 : 0,
    };
  });
}

export function getTotalValue(holdings: HoldingWithValue[]): number {
  return holdings.reduce((sum, h) => sum + h.totalValue, 0);
}

export function getAllocationRows(holdings: HoldingWithValue[], goals: PortfolioGoal[]): AllocationRow[] {
  const total = getTotalValue(holdings);

  const byCategory = holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.category] = (acc[h.category] ?? 0) + h.totalValue;
    return acc;
  }, {});

  const goalMap = Object.fromEntries(goals.map((g) => [g.category, g.goalPercent]));

  const allCategories = new Set([
    ...Object.keys(byCategory),
    ...goals.map((g) => g.category),
  ]);

  return Array.from(allCategories)
    .map((cat) => {
      const value = byCategory[cat] ?? 0;
      const currentPercent = total > 0 ? (value / total) * 100 : 0;
      const goalPercent = goalMap[cat] ?? 0;
      return {
        category: cat,
        totalValue: value,
        currentPercent,
        goalPercent,
        diff: currentPercent - goalPercent,
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue);
}

export function buildColorMap(categories: CategoryConfig[]): Record<string, string> {
  return Object.fromEntries(categories.map((c) => [c.name, c.color]));
}

export function getActionPlan(holdings: HoldingWithValue[], goals: PortfolioGoal[]): ActionItem[] {
  const total = getTotalValue(holdings);

  const byCategory = holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.category] = (acc[h.category] ?? 0) + h.totalValue;
    return acc;
  }, {});

  const goalMap = Object.fromEntries(goals.map((g) => [g.category, g.goalPercent]));

  const allCategories = new Set([...Object.keys(byCategory), ...goals.map((g) => g.category)]);

  return Array.from(allCategories)
    .map((cat) => {
      const currentValue = byCategory[cat] ?? 0;
      const currentPercent = total > 0 ? (currentValue / total) * 100 : 0;
      const goalPercent = goalMap[cat] ?? 0;
      const targetValue = (goalPercent / 100) * total;
      const delta = targetValue - currentValue;
      const absDelta = Math.abs(delta);
      const ON_TARGET_THRESHOLD = total * 0.001; // within 0.1% of portfolio = on target

      let action: ActionVerb;
      if (goalPercent === 0 && currentValue > 0) {
        action = 'SELL ALL';
      } else if (absDelta <= ON_TARGET_THRESHOLD) {
        action = 'ON TARGET';
      } else if (delta > 0) {
        action = 'BUY';
      } else {
        action = 'SELL';
      }

      return { category: cat, currentValue, currentPercent, goalPercent, targetValue, delta, action };
    })
    .sort((a, b) => {
      const order: Record<ActionVerb, number> = { 'SELL ALL': 0, 'SELL': 1, 'BUY': 2, 'ON TARGET': 3 };
      return order[a.action] - order[b.action] || Math.abs(b.delta) - Math.abs(a.delta);
    });
}

export function getGoalPieData(goals: PortfolioGoal[], colorMap: Record<string, string>) {
  return goals
    .filter((g) => g.goalPercent > 0)
    .map((g) => ({ name: g.category, value: g.goalPercent, fill: colorMap[g.category] ?? FALLBACK_COLOR }))
    .sort((a, b) => b.value - a.value);
}

export function getPieData(holdings: HoldingWithValue[], colorMap: Record<string, string>) {
  const byCategory = holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.category] = (acc[h.category] ?? 0) + h.totalValue;
    return acc;
  }, {});

  return Object.entries(byCategory)
    .map(([name, value]) => ({ name, value, fill: colorMap[name] ?? FALLBACK_COLOR }))
    .sort((a, b) => b.value - a.value);
}
