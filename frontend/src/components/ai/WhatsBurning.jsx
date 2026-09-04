import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, RefreshCw, X } from 'lucide-react';

function formatWhen(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function WhatsBurning({ userId, API_BASE_URL }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({ trends: [], status: 'idle', message: '' });
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  const trends = payload.trends || [];
  const trend = trends[index];

  const loadTrends = (refresh = false) => {
    if (!userId) return;
    setLoading(true);
    setError('');
    const query = new URLSearchParams({ investorId: userId });
    if (refresh) query.set('refresh', '1');
    fetch(`${API_BASE_URL}/api/ai/whats-burning?${query.toString()}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Trend intelligence is unavailable.');
        return data;
      })
      .then((data) => {
        setPayload(data);
        setIndex(0);
      })
      .catch((err) => setError(err.message || 'Trend intelligence is unavailable.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError('');
    const query = new URLSearchParams({ investorId: userId });
    fetch(`${API_BASE_URL}/api/ai/whats-burning?${query.toString()}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Trend intelligence is unavailable.');
        return data;
      })
      .then((data) => {
        setPayload(data);
        setIndex(0);
      })
      .catch((err) => setError(err.message || 'Trend intelligence is unavailable.'))
      .finally(() => setLoading(false));
  }, [API_BASE_URL, userId]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'ArrowRight' && trends.length) setIndex((current) => (current + 1) % trends.length);
      if (event.key === 'ArrowLeft' && trends.length) setIndex((current) => (current - 1 + trends.length) % trends.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, trends.length]);

  const preview = (payload.trends || []).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-[#111827] via-[#0f2a22] to-[#052e25] p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-amber-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-amber-300">
              <Flame className="h-4 w-4" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">What&apos;s Burning</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Global investment signals</h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-emerald-100/70">
              Live market coverage, summarized for discovery. Personalized when your sector preferences are set, without hiding major global moves.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadTrends(false)}
              className="rounded-full border border-white/15 p-2 text-emerald-100 hover:bg-white/10"
              title="Refresh cached trends"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-[#3b2204] hover:bg-amber-300"
            >
              Open briefing
            </button>
          </div>
        </div>

        <div className="relative mt-5 min-h-[88px]">
          {loading && !trends.length && (
            <p className="text-sm text-emerald-100/70">Loading current market coverage...</p>
          )}
          {!loading && error && (
            <div className="flex items-center justify-between rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              <span>{error}</span>
              <button type="button" onClick={() => loadTrends(true)} className="font-semibold underline">Retry</button>
            </div>
          )}
          {!loading && !error && !trends.length && (
            <p className="text-sm text-emerald-100/70">{payload.message || 'No current trends are available right now.'}</p>
          )}
          {preview.length > 0 && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {preview.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIndex(Math.max(0, trends.findIndex((row) => row.id === item.id)));
                    setOpen(true);
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.06] p-4 text-left hover:bg-white/[0.1]"
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-200/80">{item.category}</span>
                  <h3 className="mt-1 line-clamp-2 text-sm font-bold">{item.title}</h3>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="whats-burning-title">
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-[fadeIn_200ms_ease]"
            onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX; }}
            onTouchEnd={(event) => {
              const start = touchStartX.current;
              const end = event.changedTouches[0]?.clientX;
              if (start == null || end == null || !trends.length) return;
              if (start - end > 40) setIndex((current) => (current + 1) % trends.length);
              if (end - start > 40) setIndex((current) => (current - 1 + trends.length) % trends.length);
            }}
          >
            <div className="flex items-start justify-between border-b border-slate-100 bg-[#052e25] px-6 py-4 text-white">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300">What&apos;s Burning</p>
                <h3 id="whats-burning-title" className="mt-1 text-lg font-bold">Investor briefing</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-white/70 hover:bg-white/10" aria-label="Close briefing">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {loading && <p className="text-sm text-slate-500">Refreshing intelligence...</p>}
              {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
              {!loading && !error && !trend && (
                <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">{payload.message || 'No trends to display.'}</p>
              )}
              {trend && (
                <article className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{trend.category}</span>
                    {trend.personalized && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">Matches your sectors</span>}
                    {formatWhen(trend.publishedAt) && <span className="text-slate-400">{formatWhen(trend.publishedAt)}</span>}
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">{trend.title}</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Reported</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">{trend.factualBasis || trend.summary}</p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-amber-700">Why it may matter</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">{trend.significance}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Investor interpretation</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{trend.interpretation || trend.investorInsight}</p>
                    <p className="mt-2 text-[11px] text-slate-400">Interpretation is AI-assisted context, not a confirmed forecast or FundBridge recommendation.</p>
                  </div>
                  {(trend.relevantSectors || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {trend.relevantSectors.map((sector) => (
                        <span key={sector} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{sector}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Source: {trend.source || 'External coverage'}
                    {trend.sourceUrl ? (
                      <>
                        {' '}
                        <a href={trend.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline">
                          Open original
                        </a>
                      </>
                    ) : null}
                  </p>
                </article>
              )}
            </div>

            {trends.length > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
                <span className="text-[11px] text-slate-400">{index + 1} of {trends.length}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setIndex((index - 1 + trends.length) % trends.length)} className="rounded-full border border-slate-200 p-2 hover:bg-slate-50" aria-label="Previous trend">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1">
                    {trends.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIndex(idx)}
                        className={`h-1.5 rounded-full ${idx === index ? 'w-6 bg-emerald-600' : 'w-1.5 bg-slate-300'}`}
                        aria-label={`Trend ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <button type="button" onClick={() => setIndex((index + 1) % trends.length)} className="rounded-full border border-slate-200 p-2 hover:bg-slate-50" aria-label="Next trend">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
