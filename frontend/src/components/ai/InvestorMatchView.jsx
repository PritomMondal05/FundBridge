import { useCallback, useEffect, useState } from 'react';

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

export default function InvestorMatchView({ investorId, apiBase, onOpenCampaign }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const requestBase = apiBase || DEFAULT_API_BASE;

  const loadMatches = useCallback(async () => {
    if (!investorId) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${requestBase}/api/ai/investor-matches/${encodeURIComponent(investorId)}`);
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const data = await response.json();
      setMatches(data.matches || []);
      setProfileIncomplete(Boolean(data.profileIncomplete));
    } catch (err) { setError(err.message || 'Unable to load recommendations.'); }
    finally { setLoading(false); }
  }, [investorId, requestBase]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  if (loading) return <div className="py-16 text-center text-xs text-slate-500">Analyzing verified startups against your investment preferences…</div>;
  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Couldn’t load matches: {error}</div>;
  if (!matches.length) return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No suitable verified campaigns are available yet. Check back after new campaigns pass verification.</div>;

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Recommended startups</h1><p className="mt-1 text-xs text-slate-500">Ranked by sector, ticket size, stage, and available campaign data.</p></div><button type="button" onClick={loadMatches} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Refresh matches</button></div>
    {profileIncomplete && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">Add your preferred sectors and ticket range in Account Settings for more precise recommendations.</div>}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{matches.map((match) => <article key={match.campaignId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-300"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">{match.title}</h2><span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{match.category || 'Startup'} · {match.stage || 'Early stage'}</span></div><span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${match.matchScore >= 80 ? 'bg-emerald-100 text-emerald-800' : match.matchScore >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{match.matchScore}% Match</span></div><p className="mt-3 text-sm leading-relaxed text-slate-600">{match.justification}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs"><span className="text-slate-500">{match.university || 'Verified campaign'} · ৳{Number(match.goal || 0).toLocaleString()}</span>{onOpenCampaign && <button type="button" onClick={() => onOpenCampaign(match)} className="font-semibold text-emerald-700 hover:text-emerald-800">View campaign</button>}</div></article>)}</div>
  </div>;
}
