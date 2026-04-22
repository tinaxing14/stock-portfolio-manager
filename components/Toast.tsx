'use client';

import { useToast, Toast as ToastItem } from '@/lib/ToastContext';

const typeConfig = {
  error: {
    bar: '#f43f5e',
    bg: 'bg-white',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    title: 'text-rose-600',
  },
  success: {
    bar: '#10b981',
    bg: 'bg-white',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    title: 'text-emerald-600',
  },
  info: {
    bar: '#6366f1',
    bg: 'bg-white',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
    title: 'text-indigo-600',
  },
};

function ToastCard({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const cfg = typeConfig[toast.type];
  return (
    <div
      className={`${cfg.bg} rounded-2xl overflow-hidden flex items-stretch max-w-sm w-80`}
      style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}
    >
      {/* Colored left bar */}
      <div className="w-1 shrink-0" style={{ backgroundColor: cfg.bar }} />

      <div className="flex items-start gap-3 px-4 py-3.5 flex-1 min-w-0">
        <span className="mt-0.5 shrink-0">{cfg.icon}</span>
        <p className="flex-1 text-sm text-slate-700 leading-snug">{toast.message}</p>
        <button
          onClick={onRemove}
          aria-label="Dismiss notification"
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-0.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function Toasts() {
  const { toasts, removeToast } = useToast();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-99999 flex flex-col gap-2.5 pointer-events-none">
      {toasts.slice(-3).map((t) => (
        <div key={t.id} className="pointer-events-auto animate-in slide-in-from-bottom-2 fade-in duration-200">
          <ToastCard toast={t} onRemove={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
}
