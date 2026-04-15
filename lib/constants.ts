import { PortfolioGoal, CategoryConfig, BrokerageConfig, Account } from './types';

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { name: 'S&P500',            color: '#6366f1' },
  { name: 'Nasdaq100',         color: '#3b82f6' },
  { name: 'VTV',               color: '#0ea5e9' },
  { name: 'Dividends',         color: '#10b981' },
  { name: 'ARKW',              color: '#f59e0b' },
  { name: 'VT',                color: '#8b5cf6' },
  { name: 'VXUS',              color: '#ec4899' },
  { name: 'Individual Stocks', color: '#f97316' },
  { name: 'Gold',              color: '#eab308' },
  { name: 'Energy',            color: '#ef4444' },
  { name: 'Cash',              color: '#22c55e' },
  { name: 'Other',             color: '#6b7280' },
];

export const DEFAULT_BROKERAGES: BrokerageConfig[] = [
  { name: 'Robinhood', color: '#00c805' },
  { name: 'Vanguard',  color: '#922020' },
  { name: 'Fidelity',  color: '#2c7a3a' },
  { name: 'Schwab',    color: '#0059b3' },
  { name: 'Other',     color: '#6b7280' },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'brokerage', name: 'Brokerage',       type: 'stock', createdAt: new Date().toISOString() },
  { id: 'roth-ira',  name: 'Roth IRA',         type: 'stock', createdAt: new Date().toISOString() },
  { id: 'ira',       name: 'Traditional IRA',  type: 'stock', createdAt: new Date().toISOString() },
];

export const DEFAULT_GOALS: PortfolioGoal[] = [
  { category: 'S&P500',            goalPercent: 40 },
  { category: 'Nasdaq100',         goalPercent: 10 },
  { category: 'VXUS',              goalPercent: 25 },
  { category: 'Individual Stocks', goalPercent: 10 },
  { category: 'Gold',              goalPercent: 10 },
  { category: 'Energy',            goalPercent:  5 },
];

// Fallback color map for anything not in the DB
export const FALLBACK_COLOR = '#6b7280';
