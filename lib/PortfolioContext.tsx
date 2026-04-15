'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback, useState } from 'react';
import { Holding, HoldingWithValue, PortfolioGoal, Account, CategoryConfig, BrokerageConfig, AutoInvestment } from './types';
import { generateId, enrichHoldings, buildColorMap } from './utils';

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
      // Used by auto-execute: adds the holding if new, updates it if it already exists
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
  const [state, dispatch] = useReducer(reducer, {
    accounts: [], currentAccountId: INITIAL_ACCOUNT,
    holdings: [], goals: [], autoInvestments: [],
    categories: [], brokerages: [],
    colorMap: {}, brokerageColorMap: {},
    isLoaded: false,
  });

  const [totalNetWorth, setTotalNetWorth] = useState(0);
  const [accountTotals, setAccountTotals] = useState<{ accountId: string; value: number; percent: number }[]>([]);

  const refreshTotalNetWorth = useCallback(() => {
    fetch('/api/portfolio-total')
      .then((r) => r.json())
      .then(({ total, accounts }: { total: number; accounts: { accountId: string; value: number; percent: number }[] }) => {
        setTotalNetWorth(total);
        setAccountTotals(accounts);
      });
  }, []);

  // Load static data (accounts, categories, brokerages) + initial net worth once
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

  // Load holdings + goals + auto-investments whenever account changes,
  // then catch up any overdue scheduled investments
  useEffect(() => {
    const id = state.currentAccountId;
    Promise.all([
      fetch(`/api/holdings?accountId=${id}`).then((r) => r.json()),
      fetch(`/api/goals?accountId=${id}`).then((r) => r.json()),
      fetch(`/api/auto-investments?accountId=${id}`).then((r) => r.json()),
    ])
      .then(([holdings, goals, autoInvestments]) => {
        dispatch({ type: 'LOAD_ACCOUNT', holdings, goals, autoInvestments });
        // Execute any overdue scheduled investments silently in the background
        return fetch(`/api/auto-investments/execute?accountId=${id}&checkDue=true`, { method: 'POST' })
          .then((r) => r.json())
          .then(({ updatedHoldings, updatedInvestments }: { updatedHoldings: Holding[]; updatedInvestments: AutoInvestment[] }) => {
            for (const h of updatedHoldings) dispatch({ type: 'UPSERT_HOLDING', holding: h });
            for (const inv of updatedInvestments) dispatch({ type: 'UPDATE_AUTO_INVESTMENT', inv });
          })
          .catch(() => { /* silent fail — investments will catch up next visit */ });
      })
      .catch(() => dispatch({ type: 'LOAD_ACCOUNT', holdings: [], goals: [], autoInvestments: [] }));
  }, [state.currentAccountId]);

  const switchAccount = useCallback((id: string) => {
    dispatch({ type: 'SWITCH_ACCOUNT', accountId: id });
  }, []);

  const addHolding = useCallback((data: Omit<Holding, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const holding: Holding = { ...data, id: generateId(), accountId: state.currentAccountId, createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_HOLDING', holding });
    fetch('/api/holdings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(holding) })
      .then(() => refreshTotalNetWorth());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentAccountId, refreshTotalNetWorth]);

  const updateHolding = useCallback((holding: Holding) => {
    const updated = { ...holding, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_HOLDING', holding: updated });
    fetch(`/api/holdings/${holding.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
      .then(() => refreshTotalNetWorth());
  }, [refreshTotalNetWorth]);

  const deleteHolding = useCallback((id: string) => {
    dispatch({ type: 'DELETE_HOLDING', id });
    fetch(`/api/holdings/${id}`, { method: 'DELETE' })
      .then(() => refreshTotalNetWorth());
  }, [refreshTotalNetWorth]);

  const updateGoals = useCallback((goals: PortfolioGoal[]) => {
    dispatch({ type: 'SET_GOALS', goals });
    fetch(`/api/goals?accountId=${state.currentAccountId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(goals) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentAccountId]);

  const addAutoInvestment = useCallback((data: Omit<AutoInvestment, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const inv: AutoInvestment = { ...data, id: generateId(), accountId: state.currentAccountId, createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_AUTO_INVESTMENT', inv });
    fetch('/api/auto-investments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inv) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentAccountId]);

  const updateAutoInvestment = useCallback((inv: AutoInvestment) => {
    const updated = { ...inv, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_AUTO_INVESTMENT', inv: updated });
    fetch(`/api/auto-investments/${inv.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
  }, []);

  const deleteAutoInvestment = useCallback((id: string) => {
    dispatch({ type: 'DELETE_AUTO_INVESTMENT', id });
    fetch(`/api/auto-investments/${id}`, { method: 'DELETE' });
  }, []);

  const executeAutoInvestment = useCallback(async (id: string) => {
    const accountId = state.currentAccountId;
    const res = await fetch(`/api/auto-investments/execute?id=${id}&accountId=${accountId}`, { method: 'POST' });
    const { updatedHoldings, updatedInvestments } = await res.json() as { updatedHoldings: Holding[]; updatedInvestments: AutoInvestment[] };
    for (const h of updatedHoldings) {
      // If holding already exists in state, update it; otherwise add it
      dispatch({ type: 'UPDATE_HOLDING', holding: h });
    }
    for (const inv of updatedInvestments) dispatch({ type: 'UPDATE_AUTO_INVESTMENT', inv });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentAccountId]);

  const addAccount = useCallback(async (name: string, type: Account['type'] = 'stock'): Promise<Account> => {
    const res = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type }) });
    const account: Account = await res.json();
    dispatch({ type: 'ADD_ACCOUNT', account });
    return account;
  }, []);

  const deleteAccount = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ACCOUNT', id });
    fetch(`/api/accounts/${id}`, { method: 'DELETE' });
  }, []);

  const addCategory = useCallback((category: CategoryConfig) => {
    dispatch({ type: 'ADD_CATEGORY', category });
    fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(category) });
  }, []);

  const deleteCategory = useCallback((name: string) => {
    dispatch({ type: 'DELETE_CATEGORY', name });
    fetch(`/api/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
  }, []);

  const addBrokerage = useCallback((brokerage: BrokerageConfig) => {
    dispatch({ type: 'ADD_BROKERAGE', brokerage });
    fetch('/api/brokerages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brokerage) });
  }, []);

  const deleteBrokerage = useCallback((name: string) => {
    dispatch({ type: 'DELETE_BROKERAGE', name });
    fetch(`/api/brokerages/${encodeURIComponent(name)}`, { method: 'DELETE' });
  }, []);

  const refreshPrices = useCallback(async (): Promise<{ updated: number; failed: string[] }> => {
    const holdings = state.holdings;
    const isCrypto = state.accounts.find((a) => a.id === state.currentAccountId)?.type === 'crypto';
    const tickers = [...new Set(holdings.map((h) => h.ticker))];
    const endpoint = isCrypto ? '/api/crypto-quote' : '/api/quote';
    const quotes: Record<string, { price: number | null; name: string | null }> = await fetch(
      `${endpoint}?symbols=${tickers.join(',')}`
    ).then((r) => r.json());

    const failed: string[] = [];
    let updated = 0;
    await Promise.all(
      holdings.map(async (h) => {
        const price = quotes[h.ticker]?.price;
        if (price == null) { failed.push(h.ticker); return; }
        if (price === h.currentPrice) return;
        const updatedHolding = { ...h, currentPrice: price, updatedAt: new Date().toISOString() };
        dispatch({ type: 'UPDATE_HOLDING', holding: updatedHolding });
        await fetch(`/api/holdings/${h.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedHolding),
        });
        updated++;
      })
    );
    if (updated > 0) refreshTotalNetWorth();
    return { updated, failed: [...new Set(failed)] };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentAccountId, refreshTotalNetWorth]);

  const isCryptoAccount = state.accounts.find((a) => a.id === state.currentAccountId)?.type === 'crypto';

  return (
    <PortfolioContext.Provider value={{
      ...state,
      isCryptoAccount,
      totalNetWorth,
      accountTotals,
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
