import { useEffect, useState } from 'react';
import {
  Activity,
  Briefcase,
  Building2,
  CheckCircle2,
  Flag,
  GraduationCap,
  Heart,
  ShieldCheck,
  TrendingUp,
  User,
  X
} from 'lucide-react';

const emptyProfile = {
  profile: {},
  trackRecord: {},
  businesses: [],
  reliefCampaigns: [],
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

export default function PublicProfileModal({
  profileType,
  profileId,
  API_BASE_URL,
  onClose,
  reporter = null,
  onReported
}) {
  const [data, setData] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportIssue, setReportIssue] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    if (!profileId) return;
    const controller = new AbortController();
    const path = profileType === 'founder'
      ? `/api/founders/${encodeURIComponent(profileId)}/profile`
      : `/api/investors/${encodeURIComponent(profileId)}/profile`;

    setLoading(true);
    setError('');
    setShowReportForm(false);
    setReportIssue('');
    setReportDetails('');
    setReportError('');
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
  const isFounder = profileType === 'founder' || profile.role === 'founder' || data.profile?.role === 'founder';
  const reporterId = String(reporter?.id || reporter?._id || '').trim();
  const viewingOwnProfile = Boolean(reporterId && String(profileId) === reporterId);
  const canReport = Boolean(reporterId && !viewingOwnProfile && profile.name);

  const submitReport = async (event) => {
    event.preventDefault();
    if (!canReport || reportBusy) return;
    setReportBusy(true);
    setReportError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complainantName: reporter.name || 'FundBridge member',
          complainantId: reporterId,
          complainantRole: reporter.role || (isFounder ? 'investor' : 'founder'),
          reportedUser: profile.name,
          reportedUserId: profile.id || profile._id || profileId,
          reportedRole: isFounder ? 'founder' : 'investor',
          campaignTitle: `${isFounder ? 'Founder' : 'Investor'} profile: ${profile.name}`,
          issueType: reportIssue,
          category: reportIssue,
          reason: reportDetails,
          description: reportDetails,
          severity: 'High'
        })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Unable to submit report.');
      setShowReportForm(false);
      setReportIssue('');
      setReportDetails('');
      if (typeof onReported === 'function') onReported(payload);
    } catch (err) {
      setReportError(err.message || 'Unable to submit report.');
    } finally {
      setReportBusy(false);
    }
  };

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
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-sky-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Professional overview</h3>
                </div>
                {canReport && (
                  <button
                    type="button"
                    onClick={() => { setShowReportForm((open) => !open); setReportError(''); }}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50"
                    title={`Report this ${isFounder ? 'founder' : 'investor'}`}
                  >
                    <Flag className="h-3 w-3" />
                    {showReportForm ? 'Cancel' : 'Report / Flag'}
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{profile.bio || 'No public biography has been added yet.'}</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                {isFounder ? <><span>Department: <strong className="text-slate-800">{profile.department || 'Not provided'}</strong></span><span>Student ID: <strong className="text-slate-800">{profile.studentId || 'Not provided'}</strong></span></> : <><span>Focus: <strong className="text-slate-800">{(profile.sectorInterests || []).join(', ') || 'Broad early-stage ventures'}</strong></span><span>Ticket range: <strong className="text-slate-800">{money(profile.investmentBudgetMin)} - {money(profile.investmentBudgetMax)}</strong></span></>}
              </div>
              {showReportForm && canReport && (
                <form onSubmit={submitReport} className="mt-4 space-y-3 rounded-xl border border-rose-200 bg-white p-4">
                  <p className="text-[11px] text-slate-600">
                    Flag <strong>{profile.name}</strong> to platform administrators. This does not freeze the deal automatically.
                  </p>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Reason</label>
                    <select
                      required
                      value={reportIssue}
                      onChange={(e) => setReportIssue(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    >
                      <option value="">Select reason…</option>
                      <option value="Harassment or abusive conduct">Harassment or abusive conduct</option>
                      <option value="Misleading claims or identity">Misleading claims or identity</option>
                      <option value="Fraud or escrow concern">Fraud or escrow concern</option>
                      <option value="Spam or solicitation">Spam or solicitation</option>
                      <option value="Other policy violation">Other policy violation</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Details</label>
                    <textarea
                      required
                      rows={3}
                      minLength={12}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Describe what happened and any evidence admins should review."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                  {reportError && <p className="text-[11px] text-rose-600">{reportError}</p>}
                  <button
                    type="submit"
                    disabled={reportBusy}
                    className="w-full rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {reportBusy ? 'Submitting…' : 'Submit report'}
                  </button>
                </form>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-700" /><h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Track record</h3></div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {isFounder ? <><Stat label="Businesses started" value={trackRecord.businessesStarted || 0} /><Stat label="Verified businesses" value={trackRecord.verifiedBusinesses || 0} /><Stat label="Total raised" value={money(trackRecord.totalRaised)} /><Stat label="Milestones done" value={trackRecord.completedMilestones || 0} /><Stat label="Relief causes" value={trackRecord.reliefCampaignsCount ?? (data.reliefCampaigns || []).length} /></> : <><Stat label="Investments made" value={trackRecord.investmentsMade || 0} /><Stat label="Verified partner" value={trackRecord.verifiedPartner ? 'Yes' : 'Pending'} /><Stat label="Total deployed" value={money(trackRecord.totalDeployed)} /><Stat label="Proposals sent" value={trackRecord.proposalsSubmitted || 0} /></>}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-sky-700" /><h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">{isFounder ? 'Business history' : 'Investment portfolio'}</h3></div>
              {(isFounder ? data.businesses : data.portfolio).length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No public history is recorded yet.</p> : <div className="space-y-3">{(isFounder ? data.businesses : data.portfolio).map((item, index) => <div key={item.id || item.campaignId || index} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-bold text-slate-900">{item.title || 'FundBridge investment'}</h4><p className="mt-1 text-xs text-slate-500">{item.category || item.returnStructure || 'Startup venture'}{item.university ? ` - ${item.university}` : ''}</p></div><span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${item.verified || item.status === 'verified' || item.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status || (item.verified ? 'Verified' : 'Recorded')}</span></div>{isFounder ? <p className="mt-3 text-xs leading-relaxed text-slate-600">{item.description || item.tagline || 'No business description provided.'}</p> : <p className="mt-3 text-xs text-slate-600">Committed {money(item.amount)} - {item.returnStructure}</p>}</div>)}</div>}
            </section>

            {isFounder && (
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Relief & Charity Campaigns</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                    {(data.reliefCampaigns || []).length} Causes
                  </span>
                </div>
                {(data.reliefCampaigns || []).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                    No relief or charity campaigns launched yet by this founder.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(data.reliefCampaigns || []).map((drive, index) => (
                      <div
                        key={drive.id || index}
                        className="rounded-xl border border-rose-100 bg-gradient-to-r from-rose-50/40 via-white to-transparent p-4 space-y-2.5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700">
                                {drive.cause || 'Relief Cause'}
                              </span>
                              {drive.university && (
                                <span className="text-[11px] text-slate-500 font-medium">{drive.university}</span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 text-base mt-1">{drive.title}</h4>
                            <p className="text-xs text-slate-500">
                              Beneficiary: <strong className="text-slate-700">{drive.beneficiary || 'Community members'}</strong>
                            </p>
                          </div>
                          <span
                            className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                              drive.status === 'open' || drive.status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : drive.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {drive.status === 'open' ? 'Active / Open' : drive.status || 'Verified'}
                          </span>
                        </div>

                        {drive.description && (
                          <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">{drive.description}</p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-rose-100/60 text-xs">
                          <span className="text-slate-500">
                            Raised: <strong className="text-emerald-700 font-mono">৳ {Number(drive.raised || 0).toLocaleString()}</strong>
                            <span className="text-slate-400"> / ৳ {Number(drive.goal || 0).toLocaleString()} Goal</span>
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {Math.round(((drive.raised || 0) / (drive.goal || 1)) * 100)}% Funded
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.round(((drive.raised || 0) / (drive.goal || 1)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

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
