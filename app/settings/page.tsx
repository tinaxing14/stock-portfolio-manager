'use client';

import { useState } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { CategoryConfig, BrokerageConfig } from '@/lib/types';
import { FALLBACK_COLOR } from '@/lib/constants';

function ColorRow({ color, name, onDelete }: { color: string; name: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="w-4 h-4 rounded-full border border-slate-200 flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm text-slate-700">{name}</span>
      </div>
      <button onClick={onDelete} className="text-xs text-rose-400 hover:text-rose-600 font-medium transition-colors">Remove</button>
    </div>
  );
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string, color: string) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  return (
    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { onAdd(name.trim(), color); setName(''); } }}
        placeholder={placeholder}
        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5" title="Pick color" />
      <button
        onClick={() => { if (name.trim()) { onAdd(name.trim(), color); setName(''); } }}
        disabled={!name.trim()}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        Add
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const {
    categories, brokerages, colorMap, brokerageColorMap,
    addCategory, deleteCategory, addBrokerage, deleteBrokerage,
  } = usePortfolio();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage categories, brokerages, and accounts</p>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-800">Categories</h2>
          <p className="text-xs text-slate-400 mt-0.5">Used to classify holdings and track goal allocations</p>
        </div>
        <div>
          {categories.map((c: CategoryConfig) => (
            <ColorRow
              key={c.name}
              name={c.name}
              color={colorMap[c.name] ?? FALLBACK_COLOR}
              onDelete={() => deleteCategory(c.name)}
            />
          ))}
          {categories.length === 0 && <p className="text-sm text-slate-400 py-2">No categories yet.</p>}
        </div>
        <AddRow placeholder="New category name" onAdd={(name, color) => addCategory({ name, color })} />
      </div>

      {/* Brokerages */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-800">Brokerages</h2>
          <p className="text-xs text-slate-400 mt-0.5">Where your holdings are held</p>
        </div>
        <div>
          {brokerages.map((b: BrokerageConfig) => (
            <ColorRow
              key={b.name}
              name={b.name}
              color={brokerageColorMap[b.name] ?? FALLBACK_COLOR}
              onDelete={() => deleteBrokerage(b.name)}
            />
          ))}
          {brokerages.length === 0 && <p className="text-sm text-slate-400 py-2">No brokerages yet.</p>}
        </div>
        <AddRow placeholder="New brokerage name" onAdd={(name, color) => addBrokerage({ name, color })} />
      </div>
    </div>
  );
}
