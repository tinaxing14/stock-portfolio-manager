'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Dashboard', icon: '▦' },
  { href: '/holdings', label: 'Holdings', icon: '◈' },
  { href: '/goals', label: 'Goals', icon: '◎' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { accounts, currentAccountId, totalNetWorth, accountTotals, switchAccount, addAccount, deleteAccount } = usePortfolio();
  const [addingAccount, setAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'stock' | 'crypto'>('stock');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleAddAccount() {
    const name = newAccountName.trim();
    if (!name) return;
    const account = await addAccount(name, newAccountType);
    switchAccount(account.id);
    cancelAddAccount();
  }

  function cancelAddAccount() {
    setNewAccountName('');
    setNewAccountType('stock');
    setAddingAccount(false);
  }

  return (
    <>
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col overflow-y-auto">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-indigo-400 text-xl">◈</span>
          <span className="font-bold text-lg tracking-tight">Portfolio Tracker</span>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Total Net Worth</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalNetWorth)}</p>

          {/* Per-account breakdown */}
          {accountTotals.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              {accounts.map((a) => {
                const entry = accountTotals.find((t) => t.accountId === a.id);
                if (!entry) return null;
                return (
                  <div key={a.id}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs text-slate-400 truncate">{a.name}</span>
                      <span className="text-xs text-slate-300 font-medium ml-2 whitespace-nowrap">
                        {entry.percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${entry.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Account switcher */}
      <div className="px-3 pt-4 pb-2">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Accounts</p>
        <div className="space-y-0.5">
          {accounts.map((a) => (
            <div key={a.id} className="group flex items-center">
              <button
                onClick={() => switchAccount(a.id)}
                className={`flex-1 text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentAccountId === a.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-xs leading-none">{a.type === 'crypto' ? '₿' : '◦'}</span>
                {a.name}
              </button>
              {accounts.length > 1 && (
                <button
                  onClick={() => setConfirmDeleteId(a.id)}
                  className="opacity-0 group-hover:opacity-100 pr-2 text-slate-500 hover:text-rose-400 text-xs transition-opacity"
                  title="Delete account"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {addingAccount ? (
          <div className="mt-1 px-3 space-y-1.5">
            <input
              autoFocus
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddAccount(); if (e.key === 'Escape') cancelAddAccount(); }}
              placeholder="Account name"
              className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNewAccountType('stock')}
                className={`flex-1 text-xs py-1 rounded transition-colors ${newAccountType === 'stock' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-600'}`}
              >
                Stock
              </button>
              <button
                onClick={() => setNewAccountType('crypto')}
                className={`flex-1 text-xs py-1 rounded transition-colors ${newAccountType === 'crypto' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-600'}`}
              >
                ₿ Crypto
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleAddAccount}
                disabled={!newAccountName.trim()}
                className="flex-1 text-xs py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                Add
              </button>
              <button
                onClick={cancelAddAccount}
                className="flex-1 text-xs py-1 rounded border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingAccount(true)}
            className="mt-1 w-full text-left px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            + Add account
          </button>
        )}
      </div>

      <div className="border-t border-slate-700/50 mx-3 my-2" />

      {/* Main nav */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {accounts.find((a) => a.id === currentAccountId)?.name ?? 'Portfolio'}
        </p>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-slate-700 pt-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/settings' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="text-base">⚙</span>
          Settings
        </Link>
        <p className="px-3 pt-3 text-xs text-slate-600">Data stored locally · SQLite</p>
      </div>

    </aside>

      {confirmDeleteId && createPortal((() => {
        const target = accounts.find((a) => a.id === confirmDeleteId);
        return (
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-base font-semibold text-slate-800 mb-1">Delete account?</h3>
              <p className="text-sm text-slate-500 mb-1">
                Are you sure you want to delete <span className="font-medium text-slate-700">"{target?.name}"</span>?
              </p>
              <p className="text-xs text-rose-500 mb-5">
                This will permanently remove all holdings, goals, and auto-investments in this account.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 border border-slate-200 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (currentAccountId === confirmDeleteId) switchAccount(accounts.find((x) => x.id !== confirmDeleteId)!.id);
                    deleteAccount(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })(), document.body)}
    </>
  );
}
