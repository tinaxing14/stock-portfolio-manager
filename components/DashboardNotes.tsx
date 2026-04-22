'use client';

import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/lib/ToastContext';

export default function DashboardNotes({ accountId = 'dashboard' }: { accountId?: string }) {
  const { addToast } = useToast();
  const noteKey = `notes-${accountId}`;
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/notes?key=${noteKey}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setContent(d.content); setLoaded(true); })
      .catch(() => {
        addToast('Failed to load notes.', 'error');
        setLoaded(true);
      });
  }, [noteKey, addToast]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  function startEdit() {
    setDraft(content);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`/api/notes?key=${noteKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });
      if (!r.ok) throw new Error();
      setContent(draft);
      setEditing(false);
    } catch {
      addToast('Failed to save notes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditing(false);
    setDraft('');
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }

  if (!loaded) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Investment Notes & Analysis</h2>
          <p className="text-xs text-slate-400 mt-0.5">Your personal market analysis and plan</p>
        </div>
        {!editing ? (
          <button
            onClick={startEdit}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={cancel}
              className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors">
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-3 py-1 rounded-lg font-medium transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={autoResize}
            className="w-full font-mono text-sm text-slate-700 border border-slate-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[400px]"
          />
        ) : content ? (
          <div className="prose prose-slate prose-sm max-w-none
            prose-headings:font-semibold prose-headings:text-slate-800
            prose-h2:text-lg prose-h3:text-base
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-strong:text-slate-800
            prose-blockquote:border-indigo-300 prose-blockquote:text-slate-500 prose-blockquote:italic
            prose-table:text-sm prose-th:text-slate-700 prose-td:text-slate-600
            prose-li:text-slate-600
            prose-hr:border-slate-200
            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-8">
            No notes yet — click Edit to add your investment analysis and plan.
          </p>
        )}
      </div>
    </div>
  );
}
