import { useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Check,
  Flag,
  Lock,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  X
} from 'lucide-react';

const STATUS_STYLES = {
  completed: 'bg-emerald-100 text-emerald-800',
  unlocked: 'bg-sky-100 text-sky-800',
  pending_review: 'bg-amber-100 text-amber-800',
  funded: 'bg-indigo-100 text-indigo-800',
  proof_submitted: 'bg-violet-100 text-violet-800',
  revision_requested: 'bg-orange-100 text-orange-800',
  disputed: 'bg-rose-100 text-rose-800',
  overdue: 'bg-rose-100 text-rose-800',
  locked: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-slate-100 text-slate-500',
  on_track: 'bg-emerald-100 text-emerald-800',
  at_risk: 'bg-amber-100 text-amber-800'
};

function money(value) {
  return `৳ ${Number(value || 0).toLocaleString()}`;
}

function Badge({ status }) {
  const key = String(status || 'pending').toLowerCase().replace(/\s+/g, '_');
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${STATUS_STYLES[key] || 'bg-slate-100 text-slate-600'}`}>
      {key.replace(/_/g, ' ')}
    </span>
  );
}

function dueLabel(due) {
  if (!due) return '';
  const dueAt = new Date(due);
  if (Number.isNaN(dueAt.getTime())) return String(due);
  const days = Math.ceil((dueAt.getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  return `${days} days remaining`;
}

export default function TransactionMilestoneTracker({
  role,
  userId,
  API_BASE_URL,
  onMessage,
  showToast
}) {
  const [list, setList] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filter, setFilter] = useState('all');

  const loadList = useCallback(async (preferId = null) => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const actor = encodeURIComponent(userId);
      const path = role === 'founder'
        ? `/api/partnerships/founder/${actor}?actorId=${actor}`
        : `/api/partnerships/investor/${actor}?actorId=${actor}`;
      const res = await fetch(`${API_BASE_URL}${path}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load transactions.');
      const rows = Array.isArray(data) ? data : [];
      setList(rows);
      setSelectedId((current) => {
        if (preferId && rows.some((r) => r.id === preferId)) return preferId;
        return current && rows.some((r) => r.id === current) ? current : (rows[0]?.id || '');
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, role, userId]);

  const loadOne = useCallback(async (id) => {
    if (!id || !userId) return;
    const res = await fetch(`${API_BASE_URL}/api/partnerships/${encodeURIComponent(id)}?actorId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Transaction not found.');
    setTx(data);
    return data;
  }, [API_BASE_URL, userId]);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (!selectedId) { setTx(null); return undefined; }
    loadOne(selectedId).catch((err) => setError(err.message));
    return undefined;
  }, [selectedId, loadOne]);

  useEffect(() => {
    const socket = io(API_BASE_URL);
    if (userId) socket.emit('join_room', userId);
    const refresh = (payload) => {
      if (payload?.partnershipId || payload?.id) {
        const targetId = payload.partnershipId || payload.id;
        loadList(targetId);
      } else {
        loadList();
      }
      setTx((prev) => {
        if (!payload?.partnershipId || payload.partnershipId !== selectedId || !payload.partnership) return prev;
        if (prev?.updated_at && payload.updatedAt && payload.updatedAt < prev.updated_at) return prev;
        return payload.partnership;
      });
    };
    [
      'milestone_requested',
      'milestone_funded',
      'milestone_completion_submitted',
      'milestone_verified',
      'milestone_disputed',
      'milestone_revision_requested',
      'milestone_funding_rejected',
      'milestone_progress',
      'milestone_updated',
      'proposal_accepted',
      'partnership_created',
      'proposal_updated'
    ].forEach((ev) => socket.on(ev, refresh));
    return () => socket.disconnect();
  }, [API_BASE_URL, userId, selectedId, loadList]);

  const current = tx?.current_milestone || null;
  const nextAction = role === 'founder' ? tx?.next_action_founder : tx?.next_action_investor;
  const activity = useMemo(() => {
    const rows = tx?.activity || [];
    if (filter === 'all') return rows;
    return rows.filter((item) => {
      if (filter === 'financial') return ['funds_released', 'funding_requested', 'funding_rejected', 'proposal_accepted'].includes(item.event);
      if (filter === 'milestones') return String(item.event || '').includes('milestone') || item.event === 'milestone_activated' || item.event === 'milestone_approved';
      if (filter === 'proof') return ['proof_submitted', 'revision_requested'].includes(item.event);
      if (filter === 'reviews') return ['funding_rejected', 'revision_requested', 'milestone_approved'].includes(item.event);
      if (filter === 'disputes') return String(item.event || '').includes('dispute');
      return true;
    });
  }, [tx, filter]);

  const post = async (path, body, confirm) => {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: userId, userId, ...body })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed.');
      setTx(data.partnership);
      setModal(null);
      setForm({});
      if (showToast) showToast(data.message || 'Updated.', data.alreadyProcessed ? 'info' : 'success');
      await loadList();
    } catch (err) {
      setError(err.message);
      if (showToast) showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !tx) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading transaction tracker...</div>;
  }
  if (!list.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
          <Flag className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-slate-800 text-base">No active investment transactions yet</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Investment deals appear here immediately after a proposal is accepted. Track tranches, request funding, and submit milestone proof in real time.
        </p>
        <button
          type="button"
          onClick={() => loadList()}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Transactions</span>
        </button>
      </div>
    );
  }

  const ms = current;
  const can = (action) => {
    const status = String(ms?.status || '');
    if (tx?.frozen && action !== 'dispute' && action !== 'chat') return false;
    if (role === 'founder') {
      if (action === 'request') return status === 'unlocked';
      if (action === 'progress') return ['unlocked', 'funded', 'revision_requested'].includes(status);
      if (action === 'proof') return ['funded', 'revision_requested'].includes(status);
    }
    if (role === 'investor') {
      if (action === 'release' || action === 'reject') return status === 'pending_review';
      if (action === 'verify' || action === 'revise') return status === 'proof_submitted';
    }
    if (action === 'dispute') return ms && !['completed', 'cancelled'].includes(status);
    return false;
  };

  return (
    <div className="space-y-6">
      {list.length > 1 && (
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full max-w-lg rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
          {list.map((item) => (
            <option key={item.id} value={item.id}>{item.campaign_title} · {role === 'founder' ? item.investor_name : item.founder_name} · {money(item.total_committed)}</option>
          ))}
        </select>
      )}

      {!tx ? <p className="text-sm text-slate-500">Select a transaction.</p> : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <div className="space-y-6 min-w-0">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Investment transaction</p>
                  <h2 className="text-xl font-bold text-slate-900">{tx.campaign_title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {role === 'founder' ? `Investor: ${tx.investor_name}` : `Founder: ${tx.founder_name}`}
                    {tx.terms ? ` · ${tx.terms}` : tx.investment_type ? ` · ${tx.investment_type}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={tx.health} />
                  <button type="button" onClick={() => loadOne(tx.id)} className="rounded-lg border border-slate-200 p-2" title="Refresh"><RefreshCw className="h-4 w-4" /></button>
                </div>
              </div>
              {tx.frozen && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span><strong>TRANSACTION FROZEN.</strong> Financial actions are temporarily unavailable.</span>
                </div>
              )}
              <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-950">
                <strong>What do I do next:</strong> {nextAction?.label || 'Review the current milestone.'}
              </div>
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><span className="text-[10px] uppercase text-slate-400">Committed</span><strong className="block text-base">{money(tx.total_committed)}</strong></div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><span className="text-[10px] uppercase text-slate-400">Escrowed</span><strong className="block text-base">{money(tx.escrow_amount)}</strong></div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><span className="text-[10px] uppercase text-slate-400">Released</span><strong className="block text-base">{money(tx.amount_released)}</strong></div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><span className="text-[10px] uppercase text-slate-400">Remaining</span><strong className="block text-base">{money(tx.remaining_investment)}</strong></div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1"><span>Milestones {tx.completed_milestones}/{tx.total_milestones}</span><span>{tx.overall_progress}%</span></div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-600" style={{ width: `${tx.overall_progress || 0}%` }} /></div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Transaction timeline</h3>
              <ol className="space-y-0">
                {(tx.milestones || []).map((item, idx) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-[10px] ${item.status === 'completed' ? 'bg-emerald-600' : item.status === 'locked' ? 'bg-slate-300' : 'bg-sky-600'}`}>
                        {item.status === 'completed' ? <Check className="h-3 w-3" /> : item.status === 'locked' ? <Lock className="h-3 w-3" /> : idx + 1}
                      </span>
                      {idx < tx.milestones.length - 1 && <span className="w-px flex-1 bg-slate-200 min-h-[28px]" />}
                    </div>
                    <div className="pb-5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{item.name || item.title}</p>
                        <Badge status={item.display_status || item.status} />
                      </div>
                      <p className="text-[11px] text-slate-500">{money(item.amount)} · {item.purpose}</p>
                      {item.due_date && <p className="text-[11px] text-slate-400">{dueLabel(item.due_date)}</p>}
                    </div>
                  </li>
                ))}
                {tx.transaction_status === 'completed' && (
                  <li className="text-sm font-semibold text-emerald-800">Investment transaction completed. All required milestones have been completed.</li>
                )}
              </ol>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Current milestone</h3>
              {!ms ? <p className="text-sm text-slate-500">No milestones have been created yet.</p> : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{ms.name || ms.title}</p>
                      <p className="text-xs text-slate-500">{ms.expected_outcome || ms.purpose}</p>
                    </div>
                    <Badge status={ms.display_status || ms.status} />
                  </div>
                  <p className="text-xs text-slate-600">Funding {money(ms.release_details?.approved_amount || ms.request_details?.requested_amount || ms.amount)} · Progress {Number(ms.progress || 0)}%</p>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-sky-500" style={{ width: `${Number(ms.progress || 0)}%` }} /></div>
                  {ms.revision_reason && <p className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg p-2">Revision requested: {ms.revision_reason}</p>}
                  {ms.completion_report ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                      <p className="font-semibold">Latest proof (v{ms.completion_report.version || 1})</p>
                      <p>{ms.completion_report.completed_objectives || ms.completion_report.progress_description || 'Submitted.'}</p>
                    </div>
                  ) : <p className="text-xs text-slate-400">No proof has been submitted for this milestone yet.</p>}
                  {ms.status === 'unlocked' && <p className="text-xs text-slate-400">No funding request is currently pending.</p>}
                  {(ms.proof_history || []).length > 1 && (
                    <div className="text-[11px] text-slate-500 space-y-1">
                      {(ms.proof_history || []).map((p) => <p key={p.version}>Version {p.version} · {new Date(p.submitted_at).toLocaleString()}</p>)}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {can('request') && <button type="button" disabled={busy} onClick={() => { setForm({ amount: ms.amount, reason: '' }); setModal('request'); }} className="px-3 py-2 rounded-xl bg-[#047857] text-white text-xs font-semibold">Request funds</button>}
                    {can('progress') && <button type="button" disabled={busy} onClick={() => { setForm({ progress: ms.progress || 0, note: '' }); setModal('progress'); }} className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold">Update progress</button>}
                    {can('proof') && <button type="button" disabled={busy} onClick={() => { setForm({ note: '' }); setModal('proof'); }} className="px-3 py-2 rounded-xl bg-[#047857] text-white text-xs font-semibold">Submit proof</button>}
                    {can('release') && <button type="button" disabled={busy} onClick={() => setModal('release')} className="px-3 py-2 rounded-xl bg-[#047857] text-white text-xs font-semibold">Approve & release</button>}
                    {can('reject') && <button type="button" disabled={busy} onClick={() => { setForm({ reason: '' }); setModal('reject'); }} className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold">Reject request</button>}
                    {can('verify') && <button type="button" disabled={busy} onClick={() => setModal('verify')} className="px-3 py-2 rounded-xl bg-[#047857] text-white text-xs font-semibold">Approve milestone</button>}
                    {can('revise') && <button type="button" disabled={busy} onClick={() => { setForm({ reason: '' }); setModal('revise'); }} className="px-3 py-2 rounded-xl border border-amber-300 text-amber-800 text-xs font-semibold">Request revision</button>}
                    {can('dispute') && <button type="button" disabled={busy} onClick={() => { setForm({ reason: '' }); setModal('dispute'); }} className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold inline-flex items-center gap-1"><Flag className="h-3 w-3" /> Open dispute</button>}
                    {onMessage && <button type="button" onClick={() => onMessage(role === 'founder' ? { id: tx.investor_id, name: tx.investor_name } : { id: tx.founder_id, name: tx.founder_name })} className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Chat</button>}
                  </div>
                </>
              )}
              {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2" role="alert">{error}</p>}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-slate-900">Activity</h3>
                <div className="flex flex-wrap gap-1">
                  {['all', 'financial', 'milestones', 'proof', 'reviews', 'disputes'].map((key) => (
                    <button key={key} type="button" onClick={() => setFilter(key)} className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${filter === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{key}</button>
                  ))}
                </div>
              </div>
              {activity.length === 0 ? <p className="text-xs text-slate-400">No activity in this filter.</p> : (
                <ul className="divide-y divide-slate-100">
                  {activity.map((item) => (
                    <li key={item.id} className="py-2 text-xs">
                      <p className="font-medium text-slate-800">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.actor_role} · {item.created_at ? new Date(item.created_at).toLocaleString() : ''}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-xs space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Deal terms</h3>
              <p>Structure: {tx.terms || tx.investment_type || 'As accepted on proposal'}</p>
              <p>Campaign: {tx.campaign_title}</p>
              <p>University: {tx.founder_university || '—'}</p>
            </div>
            {(() => {
              const idx = (tx.milestones || []).findIndex((m) => m.id === current?.id);
              const nxt = idx >= 0 ? tx.milestones[idx + 1] : null;
              if (!nxt) return null;
              return (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-xs">
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Next milestone</h3>
                  <p>{nxt.name} · {money(nxt.amount)} · {nxt.timeline || dueLabel(nxt.due_date) || 'Scheduled after current phase'}</p>
                </div>
              );
            })()}
          </aside>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">
                {modal === 'request' && 'Request milestone funding'}
                {modal === 'progress' && 'Update progress'}
                {modal === 'proof' && 'Submit proof'}
                {modal === 'release' && 'Release funds'}
                {modal === 'reject' && 'Reject funding request'}
                {modal === 'verify' && 'Approve milestone'}
                {modal === 'revise' && 'Request revision'}
                {modal === 'dispute' && 'Open dispute'}
              </h4>
              <button type="button" onClick={() => setModal(null)}><X className="h-4 w-4" /></button>
            </div>
            {modal === 'request' && (
              <>
                <p className="text-xs text-slate-500">Available allocation {money(ms?.amount)} · Remaining {money(tx.remaining_investment)}</p>
                <input type="number" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-xs" placeholder="Amount" />
                <textarea value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-xs" rows={3} placeholder="Reason" />
                <button disabled={busy} onClick={() => post(`/api/partnerships/${tx.id}/milestones/${ms.id}/request`, { requested_amount: Number(form.amount), reason: form.reason, explanation: form.reason })} className="w-full py-2 rounded-xl bg-[#047857] text-white text-xs font-semibold">Submit request</button>
              </>
            )}
            {modal === 'progress' && (
              <>
                <p className="text-[11px] text-slate-500">100% does not complete the milestone. Investor verification is still required.</p>
                <input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-xs" />
                <textarea value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-xs" rows={2} placeholder="Note" />
                <button disabled={busy} onClick={() => post(`/api/partnerships/${tx.id}/milestones/${ms.id}/progress`, { progress: Number(form.progress), note: form.note })} className="w-full py-2 rounded-xl bg-[#047857] text-white text-xs font-semibold">Save progress</button>
              </>
            )}
            {modal === 'proof' && (
              <>
                <textarea value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-xs" rows={4} placeholder="Deliverables, links, and proof notes" />
                <button disabled={busy || !form.note} onClick={() => post(`/api/partnerships/${tx.id}/milestones/${ms.id}/complete`, { completed_objectives: form.note, progress_description: form.note })} className="w-full py-2 rounded-xl bg-[#047857] text-white text-xs font-semibold">Submit proof</button>
              </>
            )}
            {modal === 'release' && (
              <>
                <p className="text-sm text-slate-700">Release {money(ms?.request_details?.requested_amount || ms?.amount)} from escrow for this milestone?</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 rounded-xl border text-xs">Cancel</button>
                  <button disabled={busy} onClick={() => post(`/api/partnerships/${tx.id}/milestones/${ms.id}/release`, { approved_amount: Number(ms.request_details?.requested_amount || ms.amount) })} className="flex-1 py-2 rounded-xl bg-[#047857] text-white text-xs font-semibold">Confirm release</button>
                </div>
              </>
            )}
            {modal === 'verify' && (
              <>
                <p className="text-sm text-slate-700">Approve this milestone? You confirm the submitted requirements are satisfied.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 rounded-xl border text-xs">Cancel</button>
                  <button disabled={busy} onClick={() => post(`/api/partnerships/${tx.id}/milestones/${ms.id}/verify`, {})} className="flex-1 py-2 rounded-xl bg-[#047857] text-white text-xs font-semibold">Approve milestone</button>
                </div>
              </>
            )}
            {(modal === 'revise' || modal === 'reject' || modal === 'dispute') && (
              <>
                <textarea value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-xs" rows={4} placeholder="Reason (required)" />
                <button
                  disabled={busy || !String(form.reason || '').trim()}
                  onClick={() => post(
                    `/api/partnerships/${tx.id}/milestones/${ms.id}/${modal === 'revise' ? 'revise' : modal === 'reject' ? 'reject' : 'dispute'}`,
                    { reason: form.reason }
                  )}
                  className="w-full py-2 rounded-xl bg-[#047857] text-white text-xs font-semibold"
                >
                  Confirm
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
