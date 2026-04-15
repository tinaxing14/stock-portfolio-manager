export type AssetCategory = string;
export type Brokerage = string;

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  currentPrice: number;
  brokerage: Brokerage;
  category: AssetCategory;
  subCategory: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HoldingWithValue extends Holding {
  totalValue: number;
  portfolioPercent: number;
}

export interface PortfolioGoal {
  category: AssetCategory;
  goalPercent: number;
}

export interface AllocationRow {
  category: string;
  totalValue: number;
  currentPercent: number;
  goalPercent: number;
  diff: number;
}

export type AccountType = 'stock' | 'crypto';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt: string;
}

export interface CategoryConfig {
  name: string;
  color: string;
}

export interface BrokerageConfig {
  name: string;
  color: string;
}

export type InvestFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface AutoInvestment {
  id: string;
  accountId: string;
  ticker: string;
  name: string;
  category: string;
  subCategory: string;
  brokerage: string;
  frequency: InvestFrequency;
  amount: number;
  nextRunAt: string;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}
