'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatCurrency } from '@/lib/utils';

/* ─── SVG icons ─────────────────────────────────────────── */
const Icons = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  holdings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  goals: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  stock: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  crypto: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727"/>
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  trash: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
};

const NAV = [
  { href: '/overview', label: 'Overview',  icon: Icons.overview },
  { href: '/',         label: 'Dashboard', icon: Icons.dashboard },
  { href: '/holdings', label: 'Holdings',  icon: Icons.holdings },
  { href: '/goals',    label: 'Goals',     icon: Icons.goals },
];

/* ─── Account avatar ────────────────────────────────────── */
function AccountAvatar({ name, type, active }: { name: string; type: string; active: boolean }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span
      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
        type === 'crypto'
          ? active ? 'bg-amber-500 text-white' : 'bg-amber-500/20 text-amber-400'
          : active ? 'bg-indigo-500 text-white' : 'bg-indigo-500/20 text-indigo-400'
      }`}
    >
      {initials || (type === 'crypto' ? '₿' : '$')}
    </span>
  );
}

/* ─── Sidebar ───────────────────────────────────────────── */
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
      <aside className="sidebar-scroll fixed left-0 top-0 h-full w-72 flex flex-col overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #0c1220 0%, #0d1424 100%)', borderRight: '1px solid #1a2535' }}>

        {/* Logo */}
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid #1a2535' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg"
              style={{ boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
              {Icons.holdings}
            </div>
            <span className="font-bold text-white text-base tracking-tight">Portfolio Tracker</span>
          </div>

          {/* Net Worth */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#4a6080' }}>Total Net Worth</p>
            <p className="text-3xl font-bold text-white tabular-nums tracking-tight">{formatCurrency(totalNetWorth)}</p>

            {/* Account breakdown bars */}
            {accountTotals.length > 0 && (
              <div className="mt-3 space-y-2">
                {accounts.map((a) => {
                  const entry = accountTotals.find((t) => t.accountId === a.id);
                  if (!entry) return null;
                  return (
                    <div key={a.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs truncate" style={{ color: '#7090a8' }}>{a.name}</span>
                        <span className="text-xs font-semibold tabular-nums ml-2 whitespace-nowrap" style={{ color: '#8ba8c0' }}>
                          {entry.percent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1a2535' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${entry.percent}%`,
                            background: a.type === 'crypto'
                              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                              : 'linear-gradient(90deg, #6366f1, #818cf8)',
                          }}
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
        <div className="px-4 pt-4 pb-2">
          <p className="px-2 text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#3a5070' }}>Accounts</p>
          <div className="space-y-0.5">
            {accounts.map((a) => {
              const isActive = currentAccountId === a.id;
              return (
                <div key={a.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => switchAccount(a.id)}
                    className={`flex-1 text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'text-white'
                        : 'hover:text-white'
                    }`}
                    style={isActive
                      ? { background: 'linear-gradient(135deg, #1e2e50 0%, #1a2845 100%)', color: 'white' }
                      : { color: '#7090a8' }
                    }
                  >
                    <AccountAvatar name={a.name} type={a.type} active={isActive} />
                    <span className="truncate">{a.name}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: a.type === 'crypto' ? '#f59e0b' : '#6366f1' }} />
                    )}
                  </button>
                  {accounts.length > 1 && (
                    <button
                      aria-label={`Delete ${a.name}`}
                      onClick={() => setConfirmDeleteId(a.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                      style={{ color: '#3a5070' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#3a5070')}
                    >
                      {Icons.trash}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {addingAccount ? (
            <div className="mt-2 space-y-2 px-1">
              <input
                autoFocus
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddAccount(); if (e.key === 'Escape') cancelAddAccount(); }}
                placeholder="Account name"
                className="w-full text-white text-xs rounded-lg px-3 py-2 border focus:outline-none focus:border-indigo-500"
                style={{ background: '#0d1a2e', borderColor: '#1e2d3d', color: 'white' }}
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => setNewAccountType('stock')}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors border ${
                    newAccountType === 'stock'
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                  style={newAccountType !== 'stock' ? { background: '#0d1a2e' } : {}}
                >
                  Stock
                </button>
                <button
                  onClick={() => setNewAccountType('crypto')}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors border ${
                    newAccountType === 'crypto'
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                  style={newAccountType !== 'crypto' ? { background: '#0d1a2e' } : {}}
                >
                  Crypto
                </button>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handleAddAccount}
                  disabled={!newAccountName.trim()}
                  className="flex-1 text-xs py-1.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={cancelAddAccount}
                  className="flex-1 text-xs py-1.5 rounded-lg font-medium border text-slate-400 hover:text-white transition-colors"
                  style={{ borderColor: '#1e2d3d', background: 'transparent' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingAccount(true)}
              className="mt-1.5 w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ color: '#3a5070' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#7090a8'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3a5070'; }}
            >
              {Icons.plus}
              Add account
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 my-2" style={{ borderTop: '1px solid #1a2535' }} />

        {/* Main nav */}
        <nav className="flex-1 px-4 pb-4 space-y-0.5">
          <p className="px-2 text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#3a5070' }}>
            {accounts.find((a) => a.id === currentAccountId)?.name ?? 'Portfolio'}
          </p>
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active ? 'text-white' : 'hover:text-white'
                }`}
                style={active
                  ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.15) 100%)', color: 'white', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.2)' }
                  : { color: '#5a7898' }
                }
              >
                <span className={active ? 'text-indigo-400' : 'text-current'}>{icon}</span>
                {label}
                {active && <span className="ml-auto w-1 h-4 rounded-full bg-indigo-500 opacity-80" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-5 pt-3" style={{ borderTop: '1px solid #1a2535' }}>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              pathname === '/settings' ? 'text-white' : 'hover:text-white'
            }`}
            style={pathname === '/settings'
              ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.15) 100%)', color: 'white', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.2)' }
              : { color: '#5a7898' }
            }
          >
            <span className={pathname === '/settings' ? 'text-indigo-400' : 'text-current'}>{Icons.settings}</span>
            Settings
          </Link>
          <p className="px-3 pt-3 text-xs" style={{ color: '#2a3a50' }}>SQLite · stored locally</p>
        </div>
      </aside>

      {/* Delete account confirmation modal */}
      {confirmDeleteId && createPortal((() => {
        const target = accounts.find((a) => a.id === confirmDeleteId);
        return (
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
              style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
              <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
                {Icons.trash}
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Delete account?</h3>
              <p className="text-sm text-slate-500 mb-1">
                This will permanently delete <span className="font-medium text-slate-700">"{target?.name}"</span> and all of its holdings, goals, and auto-investments.
              </p>
              <p className="text-xs text-rose-500 mb-5 font-medium">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (currentAccountId === confirmDeleteId) switchAccount(accounts.find((x) => x.id !== confirmDeleteId)!.id);
                    deleteAccount(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );
      })(), document.body)}
    </>
  );
}
