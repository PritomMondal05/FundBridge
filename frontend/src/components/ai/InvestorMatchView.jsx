import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function InvestorMatchView({ investorId }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!investorId) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/ai/investor-matches/${investorId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
      })
      .then((data) => setMatches(data.matches || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [investorId]);

  if (loading) {
    return <div className="text-neutral-400 p-6">Analyzing startups for your profile...</div>;
  }

  if (error) {
    return <div className="text-red-400 p-6">Couldn't load matches: {error}</div>;
  }

  if (matches.length === 0) {
    return <div className="text-neutral-400 p-6">No matches found yet — check back once more campaigns are verified.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 bg-neutral-950">
      {matches.map((m) => (
        <div
          key={m.campaignId}
          className="rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-5
                     hover:border-emerald-500/40 transition-colors duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-neutral-500">
              Campaign #{m.campaignId}
            </span>
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full
                ${m.matchScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                  m.matchScore >= 50 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-neutral-700/40 text-neutral-400'}`}
            >
              {m.matchScore}% Match
            </span>
          </div>
          <p className="text-neutral-300 text-sm leading-relaxed">{m.justification}</p>
        </div>
      ))}
    </div>
  );
}