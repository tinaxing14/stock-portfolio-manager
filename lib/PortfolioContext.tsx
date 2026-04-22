'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { Holding, HoldingWithValue, PortfolioGoal, Account, CategoryConfig, BrokerageConfig, AutoInvestment } from './types';
import { generateId, enrichHoldings, buildColorMap } from './utils';
import { useToast } from './ToastContext';

interface State {
  accounts: Account[];
  currentAccountId: string;
  holdings: HoldingWithValue[];
  goals: PortfolioGoal[];
  autoInvestments: AutoInvestment[];
  categories: CategoryConfig[];
  brokerages: BrokerageConfig[];
  colorMap: Record<string, string>;
  brokerageColorMap: Record<string, string>;
  isLoaded: boolean;
}

type Action =
  | { type: 'INIT'; accounts: Account[]; categories: CategoryConfig[]; brokerages: BrokerageConfig[] }
  | { type: 'LOAD_ACCOUNT'; holdings: Holding[]; goals: PortfolioGoal[]; autoInvestments: AutoInvestment[] }
  | { type: 'SWITCH_ACCOUNT'; accountId: string }
  | { type: 'ADD_HOLDING'; holding: Holding }
  | { type: 'UPDATE_HOLDING'; holding: Holding }
  | { type: 'UPSERT_HOLDING'; holding: Holding }
  | { type: 'DELETE_HOLDING'; id: string }
  | { type: 'SET_GOALS'; goals: PortfolioGoal[] }
  | { type: 'ADD_AUTO_INVESTMENT'; inv: AutoInvestment }
  | { type: 'UPDATE_AUTO_INVESTMENT'; inv: AutoInvestment }
  | { type: 'DELETE_AUTO_INVESTMENT'; id: string }
  | { type: 'ADD_ACCOUNT'; account: Account }
  | { type: 'DELETE_ACCOUNT'; id: string }
  | { type: 'ADD_CATEGORY'; category: CategoryConfig }
  | { type: 'DELETE_CATEGORY'; name: string }
  | { type: 'ADD_BROKERAGE'; brokerage: BrokerageConfig }
  | { type: 'DELETE_BROKERAGE'; name: string };

function toRaw(h: HoldingWithValue): Holding {
  const { totalValue: _tv, portfolioPercent: _pp, ...raw } = h;
  return raw;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        accounts: action.accounts,
        categories: action.categories,
        brokerages: action.brokerages,
        colorMap: buildColorMap(action.categories),
        brokerageColorMap: buildColorMap(action.brokerages),
      };
    case 'LOAD_ACCOUNT':
      return { ...state, holdings: enrichHoldings(action.holdings), goals: action.goals, autoInvestments: action.autoInvestments, isLoaded: true };
    case 'SWITCH_ACCOUNT':
      return { ...state, currentAccountId: action.accountId, holdings: [], goals: [], autoInvestments: [], isLoaded: false };
    case 'ADD_HOLDING': {
      const raw = [...state.holdings.map(toRaw), action.holding];
      return { ...state, holdings: enrichHoldings(raw) };
    }
    case 'UPDATE_HOLDING': {
      const raw = state.holdings.map((h) => h.id === action.holding.id ? action.holding : toRaw(h));
      return { ...state, holdings: enrichHoldings(raw) };
    }
    case 'UPSERT_HOLDING': {
      const exists = state.holdings.some((h) => h.id === action.holding.id);
      const raw = exists
        ? state.holdings.map((h) => h.id === action.holding.id ? action.holding : toRaw(h))
        : [...state.holdings.map(toRaw), action.holding];
      return { ...state, holdings: enrichHoldings(raw) };
    }
    case 'DELETE_HOLDING': {
      const raw = state.holdings.filter((h) => h.id !== action.id).map(toRaw);
      return { ...state, holdings: enrichHoldings(raw) };
    }
    case 'SET_GOALS':
      return { ...state, goals: action.goals };
    case 'ADD_AUTO_INVESTMENT':
      return { ...state, autoInvestments: [action.inv, ...state.autoInvestments] };
    case 'UPDATE_AUTO_INVESTMENT':
      return { ...state, autoInvestments: state.autoInvestments.map((a) => a.id === action.inv.id ? action.inv : a) };
    case 'DELETE_AUTO_INVESTMENT':
      return { ...state, autoInvestments: state.autoInvestments.filter((a) => a.id !== action.id) };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.account] };
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter((a) => a.id !== action.id) };
    case 'ADD_CATEGORY': {
      const categories = [...state.categories.filter((c) => c.name !== action.category.name), action.category];
      return { ...state, categories, colorMap: buildColorMap(categories) };
    }
    case 'DELETE_CATEGORY': {
      const categories = state.categories.filter((c) => c.name !== action.name);
      return { ...state, categories, colorMap: buildColorMap(categories) };
    }
    case 'ADD_BROKERAGE': {
      const brokerages = [...state.brokerages.filter((b) => b.name !== action.brokerage.name), action.brokerage];
      return { ...state, brokerages, brokerageColorMap: buildColorMap(brokerages) };
    }
    case 'DELETE_BROKERAGE': {
      const brokerages = state.brokerages.filter((b) => b.name !== action.name);
      return { ...state, brokerages, brokerageColorMap: buildColorMap(brokerages) };
    }
    default:
      return state;
  }
}

interface ContextValue {
  accounts: Account[];
  currentAccountId: string;
  isCryptoAccount: boolean;
  totalNetWorth: number;
  accountTotals: { accountId: string; value: number; percent: number }[];
  holdings: HoldingWithValue[];
  goals: PortfolioGoal[];
  autoInvestments: AutoInvestment[];
  categories: CategoryConfig[];
  brokerages: BrokerageConfig[];
  colorMap: Record<string, string>;
  brokerageColorMap: Record<string, string>;
  isLoaded: boolean;
  snapshotTick: number;
  isAutoRefreshing: boolean;
  switchAccount: (id: string) => void;
  addHolding: (data: Omit<Holding, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>) => void;
  updateHolding: (holding: Holding) => void;
  deleteHolding: (id: string) => void;
  updateGoals: (goals: PortfolioGoal[]) => void;
  addAutoInvestment: (data: Omit<AutoInvestment, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>) => void;
  updateAutoInvestment: (inv: AutoInvestment) => void;
  deleteAutoInvestment: (id: string) => void;
  executeAutoInvestment: (id: string) => Promise<void>;
  addAccount: (name: string, type?: Account['type']) => Promise<Account>;
  deleteAccount: (id: string) => void;
  addCategory: (cat: CategoryConfig) => void;
  deleteCategory: (name: string) => void;
  addBrokerage: (b: BrokerageConfig) => void;
  deleteBrokerage: (name: string) => void;
  refreshPrices: () => Promise<{ updated: number; failed: string[] }>;
}

const PortfolioContext = createContext<ContextValue | null>(null);

const INITIAL_ACCOUNT = 'brokerage';

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();
  const [state, dispatch] = useReducer(reducer, {
    accounts: [], currentAccountId: INITIAL_ACCOUNT,
    holdings: [], goals: [], autoInvestments: [],
    categories: [], brokerages: [],
    colorMap: {}, brokerageColorMap: {},
    isLoaded: false,
  });

  const [totalNetWorth, setTotalNetWorth] = useState(0);
  const [accountTotals, setAccountTotals] = useState<{ accountId: string; value: number; percent: number }[]>([]);
  const [snapshotTick, setSnapshotTick] = useState(0);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const refreshTotalNetWorth = useCallback(() => {
    fetch('/api/portfolio-total')
      .then((r) => r.json())
      .then(({ total, accounts }: { total: number; accounts: { accountId: string; value: number; percent: number }[] }) => {
        setTotalNetWorth(total);
        setAccountTotals(accounts);
      });
  }, []);

  const recordSnapshot = useCallback((accountId: string) => {
    fetch(`/api/performance?accountId=${accountId}`, { method: 'POST' })
      .then((r) => r.json())
      .then(({ recorded }: { recorded: boolean }) => {
        if (recorded) setSnapshotTick((t) => t + 1);
      })
      .catch(() => { /* silent — non-critical */ });
  }, []);

  // Load static data once
  useEffect(() => {
    Promise.all([
      fetch('/api/accounts').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/brokerages').then((r) => r.json()),
    ]).then(([accounts, categories, brokerages]) => {
      dispatch({ type: 'INIT', accounts, categories, brokerages });
    });
    refreshTotalNetWorth();
  }, [refreshTotalNetWorth]);

  // Load account data + execute overdue investments + record snapshot
  useEffect(() => {
    const id = state.currentAccountId;
    Promise.all([
      fetch(`/api/holdings?accountId=${id}`).then((r) => r.json()),
      fetch(`/api/goals?accountId=${id}`).then((r) => r.json()),
      fetch(`/api/auto-investments?accountId=${id}`).then((r) => r.json()),
    ])
      .then(([holdings, goals, autoInvestments]) => {
        dispatch({ type: 'LOAD_ACCOUNT', holdings, goals, autoInvestments });
        recordSnapshot(id);
        return fetch(`/api/auto-investments/execute?accountId=${id}&checkDue=true`, { method: 'POST' })
          .then((r) => r.json())
          .then(({ updatedHoldings, updatedInvestments }: { updatedHoldings: Holding[]; updatedInvestments: AutoInvestment[] }) => {
            for (const h of updatedHoldings) dispatch({ type: 'UPSERT_HOLDING', holding: h });
            for (const inv of updatedInvestments) dispatch({ type: 'UPDATE_AUTO_INVESTMENT', inv });
          })
          .catch(() => { /* silent — investments catch up next visit */ });
      })
      .catch(() => {
        dispatch({ type: 'LOAD_ACCOUNT', holdings: [], goals: [], autoInvestments: [] });
        addToast('Failed to load account data. Please refresh the page.', 'error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentAccountId]);

  // Auto-refresh prices once per day per account so daily snapshots record automatically.
  // Uses localStorage to ensure it only runs once per calendar day, not on every render.
  useEffect(() => {
    if (!state.isLoaded || state.holdings.length === 0) return;
    const accountId = state.currentAccountId;
    const key = `portfolio_auto_refresh_${accountId}`;
    const today = new Date().toISOString().slice(0, 10);
    if (typeof window !== 'undefined' && localStorage.getItem(key) === today) return;

    setIsAutoRefreshing(true);
    // Call price API directly here rather than via refreshPrices() to avoid stale-closure deps
    const isCrypto = state.accounts.find((a) => a.id === accountId)?.type === 'crypto';
    const tickers = [...new Set(state.holdings.map((h) => h.ticker))];
    if (tickers.length === 0) { setIsAutoRefreshing(false); return; }

    const endpoint = isCrypto ? '/api/crypto-quote' : '/api/quote';
    fetch(`${endpoint}?symbols=${tickers.join(',')}`)
      .then((r) => r.json())
      .then(async (quotes: Record<string, { price: number | null }>) => {
        const now = new Date().toISOString();
        await Promise.all(state.holdings.map(async (h) => {
          const price = quotes[h.ticker]?.price;
          if (price == null || price === h.currentPrice) return;
          const updated = { ...h, currentPrice: price, updatedAt: now };
          dispatch({ type: 'UPDATE_HOLDING', holding: updated });
          await fetch(`/api/holdings/${h.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});
        }));
        refreshTotalNetWorth();
        // Record today's snapshot with fresh prices
        fetch(`/api/performance?accountId=${accountId}`, { method: 'POST' })
          .then((r) => r.json())
          .then(({ recorded }: { recorded: boolean }) => { if (recorded) setSnapshotTick((t) => t + 1); })
          .catch(() => {});
        if (typeof window !== 'undefined') localStorage.setItem(key, today);
      })
      .catch(() => {})
      .finally(() => setIsAutoRefreshing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isLoaded, state.currentAccountId]);

  const switchAccount = useCallback((id: string) => {
    dispatch({ type: 'SWITCH_ACCOUNT', accountId: id });
  }, []);

  const addHolding = useCallback((data: Omit<Holding, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const holding: Holding = { ...data, id: generateId(), accountId: state.currentAccountId, createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_HOLDING', holding });
    fetch('/api/holdings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(holding) })
      .then((r) => { if (!r.ok) throw new Error(); refreshTotalNetWorth(); })
      .catch(() => addToast('Failed to save holding. Your changes may not have been saved.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentAccountId, refreshTotalNetWorth, addToast]);

  const updateHolding = useCallback((holding: Holding) => {
    const updated = { ...holding, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_HOLDING', holding: updated });
    fetch(`/api/holdings/${holding.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
      .then((r) => { if (!r.ok) throw new Error(); refreshTotalNetWorth(); })
      .catch(() => addToast('Failed to update holding. Your changes may not have been saved.'));
  }, [refreshTotalNetWorth, addToast]);

  const deleteHolding = useCallback((id: string) => {
    dispatch({ type: 'DELETE_HOLDING', id });
    fetch(`/api/holdings/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw new Error(); refreshTotalNetWorth(); })
      .catch(() => addToast('Failed to delete holding.'));
  }, [refreshTotalNetWorth, addToast]);

  const updateGoals = useCallback((goals: PortfolioGoal[]) => {
    dispatch({ type: 'SET_GOALS', goals });
    fetch(`/api/goals?accountId=${state.currentAccountId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(goals) })
      .then((r) => { if (!r.ok) throw new Error(); })
      .catch(() => addToast('Failed to save goals.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentAccountId, addToast]);

  const addAutoInvestment = useCallback((data: Omit<AutoInvestment, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const inv: AutoInvestment = { ...data, id: generateId(), accountId: state.currentAccountId, createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_AUTO_INVESTMENT', inv });
    fetch('/api/auto-investments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inv) })
      .then((r) => { if (!r.ok) throw new Error(); })
      .catch(() => addToast('Failed to save auto-investment.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentAccountId, addToast]);

  const updateAutoInvestment = useCallback((inv: AutoInvestment) => {
    const updated = { ...inv, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_AUTO_INVESTMENT', inv: updated });
    fetch(`/api/auto-investments/${inv.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
      .then((r) => { if (!r.ok) throw new Error(); })
      .catch(() => addToast('Failed to update auto-investment.'));
  }, [addToast]);

  const deleteAutoInvestment = useCallback((id: string) => {
    dispatch({ type: 'DELETE_AUTO_INVESTMENT', id });
    fetch(`/api/auto-investments/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw new Error(); })
      .catch(() => addToast('Failed to delete auto-investment.'));
  }, [addToast]);

  const executeAutoInvestment = useCallback(async (id: string) => {
    const accountId = state.currentAccountId;
    const res = await fetch(`/api/auto-investments/execute?id=${id}&accountId=${accountId}`, { method: 'POST' });
    if (!res.ok) { addToast('Failed to execute investment.'); return; }
    const { updatedHoldings, updatedInvestments } = await res.json() as { updatedHoldings: Holding[]; updatedInvestments: AutoInvestment[] };
    for (const h of updatedHoldings) dispatch({ type: 'UPDATE_HOLDING', holding: h });
    for (const inv of updatedInvestments) dispatch({ type: 'UPDATE_AUTO_INVESTMENT', inv });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentAccountId, addToast]);

  const addAccount = useCallback(async (name: string, type: Account['type'] = 'stock'): Promise<Account> => {
    const res = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type }) });
    if (!res.ok) { addToast('Failed to create account.'); throw new Error(); }
    const account: Account = await res.json();
    dispatch({ type: 'ADD_ACCOUNT', account });
    return account;
  }, [addToast]);

  const deleteAccount = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ACCOUNT', id });
    fetch(`/api/accounts/${id}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw new Error(); })
      .catch(() => addToast('Failed to delete account.'));
  }, [addToast]);

  const addCategory = useCallback((category: CategoryConfig) => {
    dispatch({ type: 'ADD_CATEGORY', category });
    fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(category) })
      .then((r) => { if (!r.ok) throw new Error(); })
      .catch(() => addToast('Failed to save category.'));
  }, [addToast]);

  const deleteCategory = useCallback((name: string) => {
    dispatch({ type: 'DELETE_CATEGORY', name });
    fetch(`/api/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw new Error(); })
      .catch(() => addToast('Failed to delete category.'));
  }, [addToast]);

  const addBrokerage = useCallback((brokerage: BrokerageConfig) => {
    dispatch({ type: 'ADD_BROKERAGE', brokerage });
    fetch('/api/brokerages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brokerage) })
      .then((r) => { if (!r.ok) throw new Error(); })
      .catch(() => addToast('Failed to save brokerage.'));
  }, [addToast]);

  const deleteBrokerage = useCallback((name: string) => {
    dispatch({ type: 'DELETE_BROKERAGE', name });
    fetch(`/api/brokerages/${encodeURIComponent(name)}`, { method: 'DELETE' })
      .then((r) => { if (!r.ok) throw new Error(); })
      .catch(() => addToast('Failed to delete brokerage.'));
  }, [addToast]);

  const refreshPrices = useCallback(async (): Promise<{ updated: number; failed: string[] }> => {
    const holdings = state.holdings;
    const isCrypto = state.accounts.find((a) => a.id === state.currentAccountId)?.type === 'crypto';
    const tickers = [...new Set(holdings.map((h) => h.ticker))];
    const endpoint = isCrypto ? '/api/crypto-quote' : '/api/quote';

    let quotes: Record<string, { price: number | null; name: string | null }>;
    try {
      const res = await fetch(`${endpoint}?symbols=${tickers.join(',')}`);
      if (!res.ok) throw new Error();
      quotes = await res.json();
    } catch {
      addToast('Failed to fetch latest prices. Try again in a moment.');
      return { updated: 0, failed: tickers };
    }

    const failed: string[] = [];
    let updated = 0;
    await Promise.all(
      holdings.map(async (h) => {
        const price = quotes[h.ticker]?.price;
        if (price == null) { failed.push(h.ticker); return; }
        if (price === h.currentPrice) return;
        const updatedHolding = { ...h, currentPrice: price, updatedAt: new Date().toISOString() };
        dispatch({ type: 'UPDATE_HOLDING', holding: updatedHolding });
        try {
          const r = await fetch(`/api/holdings/${h.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedHolding),
          });
          if (!r.ok) throw new Error();
          updated++;
        } catch {
          failed.push(h.ticker);
        }
      })
    );

    if (updated > 0) {
      refreshTotalNetWorth();
      recordSnapshot(state.currentAccountId);
    }
    return { updated, failed: [...new Set(failed)] };
  }, [state.holdings, state.accounts, state.currentAccountId, refreshTotalNetWorth, recordSnapshot, addToast]);

  const isCryptoAccount = state.accounts.find((a) => a.id === state.currentAccountId)?.type === 'crypto';

  return (
    <PortfolioContext.Provider value={{
      ...state,
      isCryptoAccount,
      totalNetWorth,
      accountTotals,
      snapshotTick,
      isAutoRefreshing,
      switchAccount, addHolding, updateHolding, deleteHolding, updateGoals,
      addAutoInvestment, updateAutoInvestment, deleteAutoInvestment, executeAutoInvestment,
      addAccount, deleteAccount, addCategory, deleteCategory, addBrokerage, deleteBrokerage, refreshPrices,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
