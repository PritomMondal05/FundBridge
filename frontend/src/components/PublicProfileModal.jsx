import { useEffect, useState } from 'react';
import {
  Activity,
  Briefcase,
  Building2,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  User,
  X
} from 'lucide-react';

const emptyProfile = {
  profile: {},
  trackRecord: {},
  businesses: [],
  portfolio: [],
  activity: []
};

function money(value) {
  return `BDT ${Number(value || 0).toLocaleString()}`;
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</span>
      <strong className="mt-1 block text-lg font-bold text-slate-900">{value}</strong>
    </div>
  );
}

export default function PublicProfileModal({ profileType, profileId, API_BASE_URL, onClose }) {
  const [data, setData] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profileId) return;
    const controller = new AbortController();
    const path = profileType === 'founder'
      ? `/api/founders/${encodeURIComponent(profileId)}/profile`
      : `/api/investors/${encodeURIComponent(profileId)}/profile`;

    setLoading(true);
    setError('');
    fetch(`${API_BASE_URL}${path}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Profile could not be loaded.');
        return payload;
      })
      .then((payload) => setData({ ...emptyProfile, ...payload }))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [API_BASE_URL, profileId, profileType]);

  const profile = data.profile || {};
  const trackRecord = data.trackRecord || {};
  const isFounder = profileType === 'founder';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isFounder ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
              {isFounder ? <GraduationCap className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">{isFounder ? 'Founder profile' : 'Investor profile'}</span>
                {profile.vettingStatus === 'verified' && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{loading ? 'Loading profile...' : profile.name || 'FundBridge member'}</h2>
              <p className="text-xs text-slate-500">{isFounder ? [profile.university, profile.department].filter(Boolean).join(' - ') : [profile.institution, profile.affiliationStatus].filter(Boolean).join(' - ')}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Close profile">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && <div className="p-10 text-center text-sm text-slate-500">Loading verified profile details...</div>}
        {error && <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

        {!loading && !error && (
          <div className="space-y-6 p-6">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-sky-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Professional overview</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{profile.bio || 'No public biography has been added yet.'}</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                {isFounder ? <><span>Department: <strong className="text-slate-800">{profile.department || 'Not provided'}</strong></span><span>Student ID: <strong className="text-slate-800">{profile.studentId || 'Not provided'}</strong></span></> : <><span>Focus: <strong className="text-slate-800">{(profile.sectorInterests || []).join(', ') || 'Broad early-stage ventures'}</strong></span><span>Ticket range: <strong className="text-slate-800">{money(profile.investmentBudgetMin)} - {money(profile.investmentBudgetMax)}</strong></span></>}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-700" /><h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Track record</h3></div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {isFounder ? <><Stat label="Businesses started" value={trackRecord.businessesStarted || 0} /><Stat label="Verified businesses" value={trackRecord.verifiedBusinesses || 0} /><Stat label="Total raised" value={money(trackRecord.totalRaised)} /><Stat label="Milestones done" value={trackRecord.completedMilestones || 0} /></> : <><Stat label="Investments made" value={trackRecord.investmentsMade || 0} /><Stat label="Verified partner" value={trackRecord.verifiedPartner ? 'Yes' : 'Pending'} /><Stat label="Total deployed" value={money(trackRecord.totalDeployed)} /><Stat label="Proposals sent" value={trackRecord.proposalsSubmitted || 0} /></>}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-sky-700" /><h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">{isFounder ? 'Business history' : 'Investment portfolio'}</h3></div>
              {(isFounder ? data.businesses : data.portfolio).length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No public history is recorded yet.</p> : <div className="space-y-3">{(isFounder ? data.businesses : data.portfolio).map((item, index) => <div key={item.id || item.campaignId || index} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-bold text-slate-900">{item.title || 'FundBridge investment'}</h4><p className="mt-1 text-xs text-slate-500">{item.category || item.returnStructure || 'Startup venture'}{item.university ? ` - ${item.university}` : ''}</p></div><span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${item.verified || item.status === 'verified' || item.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status || (item.verified ? 'Verified' : 'Recorded')}</span></div>{isFounder ? <p className="mt-3 text-xs leading-relaxed text-slate-600">{item.description || item.tagline || 'No business description provided.'}</p> : <p className="mt-3 text-xs text-slate-600">Committed {money(item.amount)} - {item.returnStructure}</p>}</div>)}</div>}
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-sky-700" /><h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Verified platform activity</h3></div>
              {data.activity.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No public activity has been recorded yet.</p> : <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">{data.activity.map((item, index) => <div key={`${item.created_at}-${index}`} className="flex items-center justify-between gap-4 p-3"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><span className="text-xs text-slate-700">{item.title}</span></div><span className="whitespace-nowrap text-[10px] font-mono uppercase text-slate-400">{item.status || item.category}</span></div>)}</div>}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
