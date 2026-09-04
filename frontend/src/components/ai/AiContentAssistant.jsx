import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function AiContentAssistant({
  kind = 'bio',
  userId,
  campaignId,
  value,
  context = {},
  API_BASE_URL,
  onApply,
  showToast
}) {
  const [notes, setNotes] = useState({
    experience: '',
    skills: '',
    achievements: '',
    mission: '',
    problem: '',
    solution: '',
    product: '',
    targetAudience: ''
  });
  const [suggestion, setSuggestion] = useState('');
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [originalSnapshot, setOriginalSnapshot] = useState('');

  const isBio = kind === 'bio';
  const generatePath = isBio ? '/api/ai/founder/bio/generate' : '/api/ai/founder/campaign/generate';
  const improvePath = isBio ? '/api/ai/founder/bio/improve' : '/api/ai/founder/campaign/improve';

  const run = async (mode) => {
    if (!userId) {
      setError('You need to be signed in as a founder to use the AI assistant.');
      return;
    }
    setLoading(true);
    setError('');
    setOriginalSnapshot(value || '');
    try {
      const payload = isBio
        ? {
            founderId: userId,
            name: context.name,
            university: context.university,
            department: context.department,
            startup: context.startup,
            industry: context.industry,
            role: 'Founder',
            existingBio: value,
            bio: value,
            ...notes
          }
        : {
            founderId: userId,
            campaignId,
            existingDescription: value,
            description: value,
            draft: {
              ...context,
              description: value,
              problem: notes.problem,
              solution: notes.solution,
              product: notes.product,
              targetAudience: notes.targetAudience
            }
          };
      const response = await fetch(`${API_BASE_URL}${mode === 'improve' ? improvePath : generatePath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI Optimization Engine is unavailable.');
      setSuggestion(data.content || '');
      setTips(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch (err) {
      setError(err.message || 'AI Optimization Engine is unavailable.');
      if (showToast) showToast(err.message || 'AI generation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          {isBio ? 'AI Bio Assistant' : 'AI Campaign Assistant'}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700/70">FundBridge Intelligence</span>
      </div>
      <p className="text-[11px] text-emerald-900/70">
        Suggestions stay in preview until you apply them. The assistant will not invent traction, funding, or awards.
      </p>

      {isBio ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={notes.experience} onChange={(e) => setNotes({ ...notes, experience: e.target.value })} placeholder="Experience (optional, verified facts only)" className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs" />
          <input value={notes.skills} onChange={(e) => setNotes({ ...notes, skills: e.target.value })} placeholder="Skills (optional)" className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs" />
          <input value={notes.achievements} onChange={(e) => setNotes({ ...notes, achievements: e.target.value })} placeholder="Achievements already true (optional)" className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs" />
          <input value={notes.mission} onChange={(e) => setNotes({ ...notes, mission: e.target.value })} placeholder="Mission (optional)" className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={notes.problem} onChange={(e) => setNotes({ ...notes, problem: e.target.value })} placeholder="Problem being solved (optional)" className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs" />
          <input value={notes.solution} onChange={(e) => setNotes({ ...notes, solution: e.target.value })} placeholder="Solution / product (optional)" className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs" />
          <input value={notes.product} onChange={(e) => setNotes({ ...notes, product: e.target.value })} placeholder="Product details (optional)" className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs" />
          <input value={notes.targetAudience} onChange={(e) => setNotes({ ...notes, targetAudience: e.target.value })} placeholder="Target audience (optional)" className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => run('generate')} disabled={loading} className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] disabled:opacity-60 text-white text-xs font-semibold rounded-xl cursor-pointer">
          {loading ? 'Generating...' : 'Generate with AI'}
        </button>
        <button type="button" onClick={() => run('improve')} disabled={loading || !String(value || '').trim()} className="px-4 py-2 border border-emerald-700 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 text-xs font-semibold rounded-xl cursor-pointer">
          {loading ? 'Improving...' : 'Improve with AI'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">
          {error}
        </div>
      )}

      {suggestion && (
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-emerald-900">AI suggestion (editable)</label>
          <textarea
            rows={6}
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-slate-800"
          />
          {tips.length > 0 && (
            <ul className="text-[11px] text-emerald-900/70 list-disc pl-4 space-y-0.5">
              {tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onApply(suggestion);
                if (showToast) showToast('AI suggestion applied. Review before publishing.', 'success');
              }}
              className="px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-semibold rounded-lg cursor-pointer"
            >
              Use suggestion
            </button>
            <button
              type="button"
              onClick={() => {
                setSuggestion('');
                setTips([]);
                if (showToast) showToast('Kept your original text.', 'info');
              }}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg cursor-pointer"
            >
              Keep original
            </button>
            {originalSnapshot && (
              <button
                type="button"
                onClick={() => setSuggestion(originalSnapshot)}
                className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 underline cursor-pointer"
              >
                Restore previous draft in editor
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
