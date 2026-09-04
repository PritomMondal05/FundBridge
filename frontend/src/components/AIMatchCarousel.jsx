import { useEffect, useState } from 'react';
import { ArrowRight, BrainCircuit, ChevronLeft, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';

const emptyState = { matches: [], source: '', count: 0 };

function scoreTone(score) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-sky-500';
  return 'bg-amber-500';
}

export default function AIMatchCarousel({ role, userId, campaignId, API_BASE_URL, onOpenMatch }) {
  const [result, setResult] = useState(emptyState);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const endpoint = role === 'investor'
    ? `/api/ai/investor-matches/${encodeURIComponent(userId || '')}`
    : campaignId
      ? `/api/ai/founder-matches/${encodeURIComponent(campaignId)}`
      : `/api/ai/founder-user-matches/${encodeURIComponent(userId || '')}`;

  const loadMatches = () => {
    if (role === 'investor' && !userId) return;
    if (role === 'founder' && !campaignId && !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    fetch(`${API_BASE_URL}${endpoint}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Matching service unavailable.');
        return payload;
      })
      .then((payload) => {
        setResult({
          matches: Array.isArray(payload.matches) ? payload.matches : [],
          source: payload.source || 'heuristic',
          count: payload.count || 0
        });
        setActiveIndex(0);
      })
      .catch((err) => setError(err.message || 'Matching service unavailable.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMatches();
  }, [API_BASE_URL, role, userId, campaignId]);

  useEffect(() => {
    if (result.matches.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % result.matches.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [result.matches.length]);

  const match = result.matches[activeIndex];
  const matchId = match?.campaignId || match?.investorId;
  const isInvestor = role === 'investor';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#071a16] p-6 text-white shadow-xl">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-emerald-400/10" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full border-[20px] border-sky-400/10" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-emerald-300">
            <BrainCircuit className="h-4 w-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">FundBridge Intelligence</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Your next best connection</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-emerald-100/70">
            {isInvestor ? 'AI-ranked student ventures based on your investment profile.' : 'AI-ranked investors based on your venture and funding needs.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            {loading ? 'Analyzing' : result.source === 'gemini' ? 'Gemini AI' : result.source ? 'Smart fallback' : 'Ready'}
          </span>
          <button onClick={loadMatches} className="rounded-full border border-white/15 p-2 text-emerald-100 hover:bg-white/10" title="Refresh recommendations">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="relative mt-6 min-h-[145px]">
        {loading && <div className="flex h-[145px] items-center justify-center text-sm text-emerald-100/70">Finding your strongest matches...</div>}
        {!loading && error && <div className="flex h-[145px] items-center justify-between rounded-xl border border-rose-300/20 bg-rose-500/10 px-5 text-sm text-rose-100"><span>{error}</span><button onClick={loadMatches} className="font-semibold underline">Retry</button></div>}
        {!loading && !error && !match && <div className="flex h-[145px] items-center text-sm text-emerald-100/70">No matches are available yet.</div>}
        {!loading && !error && match && (
          <div className="flex h-[145px] flex-col justify-between rounded-xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm md:flex-row md:items-center md:gap-8">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-200/70">Match {activeIndex + 1} of {result.count || result.matches.length}</span>
              </div>
              <h3 className="truncate text-xl font-bold">{match.title || match.name || matchId}</h3>
              <p className="mt-2 line-clamp-2 max-w-2xl text-xs leading-relaxed text-white/70">{match.justification}</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-28">
                <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/50"><span>Fit score</span><span className="text-lg text-white">{match.matchScore}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${scoreTone(match.matchScore)} transition-all duration-500`} style={{ width: `${match.matchScore}%` }} /></div>
              </div>
              {onOpenMatch && <button onClick={() => onOpenMatch(match)} className="flex items-center gap-1 rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-[#052e25] hover:bg-emerald-300">View <ArrowRight className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
        )}
      </div>

      {result.matches.length > 1 && !loading && !error && (
        <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-[10px] text-white/40">Recommendations update from verified platform data</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveIndex((activeIndex - 1 + result.matches.length) % result.matches.length)} className="rounded-full border border-white/15 p-1.5 hover:bg-white/10" title="Previous recommendation"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <div className="flex gap-1">{result.matches.slice(0, 6).map((item, index) => <button key={item.campaignId || item.investorId || index} onClick={() => setActiveIndex(index)} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-emerald-300' : 'w-1.5 bg-white/30'}`} title={`Recommendation ${index + 1}`} />)}</div>
            <button onClick={() => setActiveIndex((activeIndex + 1) % result.matches.length)} className="rounded-full border border-white/15 p-1.5 hover:bg-white/10" title="Next recommendation"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}
    </section>
  );
}
