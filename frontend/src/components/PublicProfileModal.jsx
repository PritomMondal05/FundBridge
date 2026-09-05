import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Flag,
  GraduationCap,
  Heart,
  Plus,
  Rocket,
  Send,
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

  // Proposal submission modal state (for investors)
  const [proposalModalCampaign, setProposalModalCampaign] = useState(null);
  const [proposalAmount, setProposalAmount] = useState('500000');
  const [proposalTerms, setProposalTerms] = useState('8% Revenue Share');
  const [customTerms, setCustomTerms] = useState('');
  const [proposalNotes, setProposalNotes] = useState('');
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [proposalError, setProposalError] = useState('');
  const [actionNotice, setActionNotice] = useState(null); // { type: 'success' | 'error', text: '' }

  // Status updating state for founders
  const [updatingProposalId, setUpdatingProposalId] = useState(null);

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
  const isInvestorViewer = Boolean(reporter?.role === 'investor' && !viewingOwnProfile);
  const isFounderViewer = Boolean(isFounder && (viewingOwnProfile || reporter?.role === 'founder'));

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

  const handleOpenProposalModal = (campaign) => {
    setProposalModalCampaign(campaign);
    const defaultAmount = campaign.goal ? String(Math.max(50000, Math.round(Number(campaign.goal) * 0.2))) : '500000';
    setProposalAmount(defaultAmount);
    setProposalTerms(campaign.equityOffer || '8% Revenue Share');
    setCustomTerms('');
    setProposalNotes('');
    setProposalError('');
  };

  const handleSendProposal = async (e) => {
    e.preventDefault();
    if (!proposalModalCampaign || proposalSubmitting) return;

    const amt = Number(proposalAmount);
    if (!amt || amt <= 0) {
      setProposalError('Please enter a valid investment amount.');
      return;
    }

    const finalTerms = proposalTerms === 'Custom' ? (customTerms.trim() || 'Custom Terms') : proposalTerms;

    setProposalSubmitting(true);
    setProposalError('');

    try {
      const campId = proposalModalCampaign.id || proposalModalCampaign.campaignId;
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${encodeURIComponent(campId)}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investorId: reporterId || 'inv_guest',
          investorName: reporter?.name || 'Verified Investor',
          amount: amt,
          terms: finalTerms,
          customNotes: proposalNotes.trim()
        })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to submit investment proposal.');

      const newProposal = json.proposal || {
        id: `prop_${Date.now()}`,
        campaign_id: campId,
        investor_id: reporterId,
        investor_name: reporter?.name || 'Verified Investor',
        amount: amt,
        terms: finalTerms,
        return_structure: finalTerms,
        custom_notes: proposalNotes.trim(),
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Add newly created proposal to local businesses state immediately
      setData((prev) => {
        const nextBusinesses = (prev.businesses || []).map((b) => {
          if (String(b.id || b.campaignId) === String(campId)) {
            const currentProps = Array.isArray(b.proposals) ? b.proposals : [];
            return {
              ...b,
              proposals: [newProposal, ...currentProps]
            };
          }
          return b;
        });
        const currentCount = Number(prev.trackRecord?.proposalsReceived || 0);
        return {
          ...prev,
          businesses: nextBusinesses,
          trackRecord: {
            ...prev.trackRecord,
            proposalsReceived: currentCount + 1
          }
        };
      });

      setActionNotice({
        type: 'success',
        text: `Investment proposal of ৳ ${amt.toLocaleString()} submitted successfully for "${proposalModalCampaign.title}"!`
      });
      setProposalModalCampaign(null);
      setTimeout(() => setActionNotice(null), 6000);
    } catch (err) {
      setProposalError(err.message || 'Error submitting investment proposal.');
    } finally {
      setProposalSubmitting(false);
    }
  };

  const handleFounderProposalStatus = async (campaignId, proposalId, newStatus) => {
    if (updatingProposalId) return;
    setUpdatingProposalId(proposalId);
    try {
      let res = await fetch(`${API_BASE_URL}/api/founder/proposals/${encodeURIComponent(proposalId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          founderId: profileId,
          campaignId: campaignId
        })
      });
      if (!res.ok && campaignId) {
        res = await fetch(`${API_BASE_URL}/api/campaigns/${encodeURIComponent(campaignId)}/proposals/${encodeURIComponent(proposalId)}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, founderId: profileId })
        });
      }
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || `Failed to set proposal to ${newStatus}.`);

      // Update proposal status in state
      setData((prev) => {
        const nextBusinesses = (prev.businesses || []).map((b) => {
          if (String(b.id || b.campaignId) === String(campaignId)) {
            const currentProps = (b.proposals || []).map((p) => {
              if (String(p.id || p._id) === String(proposalId)) {
                return { ...p, status: newStatus };
              }
              return p;
            });
            return { ...b, proposals: currentProps };
          }
          return b;
        });
        return { ...prev, businesses: nextBusinesses };
      });

      setActionNotice({
        type: 'success',
        text: newStatus === 'accepted'
          ? 'Proposal ACCEPTED! Transaction milestone tracker is now active.'
          : `Proposal ${newStatus.toUpperCase()} successfully!`
      });
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: err.message || 'Failed to update proposal status.'
      });
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setUpdatingProposalId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* MODAL HEADER */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-6 shadow-xs">
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
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer" title="Close profile">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FEEDBACK NOTICE BANNER */}
        {actionNotice && (
          <div className={`mx-6 mt-4 flex items-center justify-between rounded-xl p-3.5 text-xs font-semibold ${
            actionNotice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
              <span>{actionNotice.text}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {loading && <div className="p-10 text-center text-sm text-slate-500">Loading verified profile details...</div>}
        {error && <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

        {!loading && !error && (
          <div className="space-y-6 p-6">
            {/* PROFESSIONAL OVERVIEW */}
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
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
                    title={`Report this ${isFounder ? 'founder' : 'investor'}`}
                  >
                    <Flag className="h-3 w-3" />
                    {showReportForm ? 'Cancel' : 'Report / Flag'}
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{profile.bio || 'No public biography has been added yet.'}</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                {isFounder ? (
                  <>
                    <span>Department: <strong className="text-slate-800">{profile.department || 'Not provided'}</strong></span>
                    <span>Student ID: <strong className="text-slate-800">{profile.studentId || 'Not provided'}</strong></span>
                  </>
                ) : (
                  <>
                    <span>Focus: <strong className="text-slate-800">{(profile.sectorInterests || []).join(', ') || 'Broad early-stage ventures'}</strong></span>
                    <span>Ticket range: <strong className="text-slate-800">{money(profile.investmentBudgetMin)} - {money(profile.investmentBudgetMax)}</strong></span>
                  </>
                )}
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
                    className="w-full rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                  >
                    {reportBusy ? 'Submitting…' : 'Submit report'}
                  </button>
                </form>
              )}
            </section>

            {/* TRACK RECORD */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Track record</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                {isFounder ? (
                  <>
                    <Stat label="Businesses started" value={trackRecord.businessesStarted || 0} />
                    <Stat label="Verified businesses" value={trackRecord.verifiedBusinesses || 0} />
                    <Stat label="Total raised" value={money(trackRecord.totalRaised)} />
                    <Stat label="Proposals received" value={trackRecord.proposalsReceived || 0} />
                    <Stat label="Milestones done" value={trackRecord.completedMilestones || 0} />
                    <Stat label="Relief causes" value={trackRecord.reliefCampaignsCount ?? (data.reliefCampaigns || []).length} />
                  </>
                ) : (
                  <>
                    <Stat label="Investments made" value={trackRecord.investmentsMade || 0} />
                    <Stat label="Verified partner" value={trackRecord.verifiedPartner ? 'Yes' : 'Pending'} />
                    <Stat label="Total deployed" value={money(trackRecord.totalDeployed)} />
                    <Stat label="Proposals sent" value={trackRecord.proposalsSubmitted || 0} />
                  </>
                )}
              </div>
            </section>

            {/* CAMPAIGN SECTION / BUSINESS HISTORY */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-emerald-700" />
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      {isFounder ? 'Startup Campaigns & Investment Proposals' : 'Investment Portfolio'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isFounder
                        ? 'Venture campaigns, funding metrics, and investor proposal offers'
                        : 'Active and recorded investment backing positions'}
                    </p>
                  </div>
                </div>
                {isFounder && (
                  <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200">
                    {(data.businesses || []).length} {data.businesses?.length === 1 ? 'Campaign' : 'Campaigns'}
                  </span>
                )}
              </div>

              {isFounder ? (
                (data.businesses || []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 space-y-1">
                    <p className="text-sm font-medium">No startup campaigns registered yet under this founder.</p>
                    <p className="text-xs text-slate-400">When campaigns are launched, backing proposals and deal terms will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {data.businesses.map((camp, index) => {
                      const campId = camp.id || camp.campaignId || index;
                      const campProposals = Array.isArray(camp.proposals) ? camp.proposals : [];
                      const fundedPct = camp.goal > 0 ? Math.min(100, Math.round(((camp.raised || 0) / camp.goal) * 100)) : 0;
                      const myExistingProposal = isInvestorViewer
                        ? campProposals.find((p) => String(p.investor_id || p.investorId) === reporterId)
                        : null;

                      return (
                        <div
                          key={campId}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-emerald-300 transition-all"
                        >
                          {/* Top Row: Title, Badges, Action Button */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 font-mono">
                                  {camp.category || 'Startup Venture'}
                                </span>
                                {camp.stage && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 font-mono">
                                    {camp.stage}
                                  </span>
                                )}
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                                    camp.verified || camp.status === 'verified'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {camp.verified || camp.status === 'verified' ? 'Verified & Live ✓' : camp.status || 'Pending Verification'}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-base">{camp.title || 'Untitled Startup'}</h4>
                              {camp.university && (
                                <span className="text-xs text-slate-500">{camp.university}</span>
                              )}
                            </div>

                            {/* INVESTOR PROPOSAL ACTION BUTTON */}
                            {isInvestorViewer && (
                              <button
                                type="button"
                                onClick={() => handleOpenProposalModal(camp)}
                                className="px-4 py-2 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                              >
                                <Coins className="w-4 h-4" />
                                <span>{myExistingProposal ? 'Send Another Offer' : 'Send Investment Proposal'}</span>
                              </button>
                            )}
                          </div>

                          {/* Description */}
                          {(camp.description || camp.tagline) && (
                            <p className="text-xs leading-relaxed text-slate-600 line-clamp-3">
                              {camp.description || camp.tagline}
                            </p>
                          )}

                          {/* Financials Row */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                            <div>
                              <span className="text-[10px] font-mono uppercase text-slate-400 block">TARGET GOAL</span>
                              <strong className="text-slate-900 font-mono">৳ {Number(camp.goal || 0).toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono uppercase text-slate-400 block">CAPITAL RAISED</span>
                              <strong className="text-emerald-700 font-mono">৳ {Number(camp.raised || 0).toLocaleString()}</strong>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <span className="text-[10px] font-mono uppercase text-slate-400 block">OFFERED TERMS</span>
                              <strong className="text-sky-800 font-semibold">{camp.equityOffer || camp.equity_offer || 'Rev Share'}</strong>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono text-slate-500">
                              <span>Funding Progress</span>
                              <span className="font-bold text-emerald-700">{fundedPct}% funded</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${fundedPct}%` }}
                              />
                            </div>
                          </div>

                          {/* INVESTMENT PROPOSALS SECTION UNDER THIS CAMPAIGN */}
                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-sky-700" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                  Investment Proposals ({campProposals.length})
                                </span>
                              </div>
                              {myExistingProposal && (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  You have an active proposal
                                </span>
                              )}
                            </div>

                            {campProposals.length === 0 ? (
                              <div className="p-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-center space-y-1.5">
                                <p className="text-xs text-slate-500 font-medium">No investment proposals submitted yet for this campaign.</p>
                                {isInvestorViewer ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProposalModal(camp)}
                                    className="text-xs text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Be the first backer to submit an offer →</span>
                                  </button>
                                ) : (
                                  <p className="text-[11px] text-slate-400">When alumni and institutional backers submit proposals, they will appear here.</p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {campProposals.map((prop, pIdx) => {
                                  const propId = prop.id || prop._id || pIdx;
                                  const isMyProp = isInvestorViewer && String(prop.investor_id || prop.investorId) === reporterId;
                                  const status = String(prop.status || 'pending').toLowerCase();

                                  return (
                                    <div
                                      key={propId}
                                      className={`p-3.5 rounded-xl border text-xs transition-all space-y-2 ${
                                        isMyProp
                                          ? 'bg-sky-50/40 border-sky-300 ring-1 ring-sky-400/20'
                                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">
                                              {prop.investor_name || prop.investorName || 'Angel Backer'}
                                            </span>
                                            {isMyProp && (
                                              <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 text-[9px] font-bold rounded uppercase">
                                                Your Proposal
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                                            <span>Offer: <strong className="text-emerald-700 font-mono">৳ {Number(prop.amount || 0).toLocaleString()}</strong></span>
                                            <span>•</span>
                                            <span>Terms: <strong className="text-slate-800">{prop.terms || prop.return_structure || 'Standard'}</strong></span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md font-mono ${
                                              status === 'accepted'
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : status === 'declined' || status === 'rejected'
                                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}
                                          >
                                            {status === 'accepted' ? 'Accepted ✓' : status === 'declined' || status === 'rejected' ? 'Declined ✕' : 'Pending Review ⏳'}
                                          </span>

                                          {status === 'accepted' && (
                                            <span className="px-2 py-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                                              Milestone Active 🚀
                                            </span>
                                          )}

                                          {/* FOUNDER ACTION BUTTONS */}
                                          {isFounderViewer && status === 'pending' && (
                                            <div className="flex items-center gap-1.5 ml-1">
                                              <button
                                                type="button"
                                                disabled={updatingProposalId === propId}
                                                onClick={() => handleFounderProposalStatus(campId, propId, 'accepted')}
                                                className="px-2.5 py-1 bg-[#047857] hover:bg-[#065f46] text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                              >
                                                Accept
                                              </button>
                                              <button
                                                type="button"
                                                disabled={updatingProposalId === propId}
                                                onClick={() => handleFounderProposalStatus(campId, propId, 'declined')}
                                                className="px-2.5 py-1 border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                              >
                                                Decline
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {prop.custom_notes && (
                                        <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60 italic">
                                          "{prop.custom_notes}"
                                        </p>
                                      )}

                                      {prop.created_at && (
                                        <span className="text-[10px] font-mono text-slate-400 block text-right">
                                          Submitted on {new Date(prop.created_at).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* INVESTOR PORTFOLIO VIEW */
                (data.portfolio || []).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                    No public investment portfolio is recorded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.portfolio.map((item, index) => (
                      <div key={item.id || item.campaignId || index} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-slate-900">{item.title || 'FundBridge investment'}</h4>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.category || item.returnStructure || 'Startup venture'}
                              {item.university ? ` - ${item.university}` : ''}
                            </p>
                          </div>
                          <span
                            className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${
                              item.verified || item.status === 'verified' || item.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status || (item.verified ? 'Verified' : 'Recorded')}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-600">
                          Committed {money(item.amount)} - {item.returnStructure}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </section>

            {/* RELIEF & CHARITY CAMPAIGNS */}
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

            {/* VERIFIED PLATFORM ACTIVITY */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Verified platform activity</h3>
              </div>
              {data.activity.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                  No public activity has been recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {data.activity.map((item, index) => (
                    <div key={`${item.created_at}-${index}`} className="flex items-center justify-between gap-4 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs text-slate-700">{item.title}</span>
                      </div>
                      <span className="whitespace-nowrap text-[10px] font-mono uppercase text-slate-400">
                        {item.status || item.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* MODAL: SUBMIT INVESTMENT PROPOSAL (FOR INVESTORS) */}
      {proposalModalCampaign && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 block">SUBMIT INVESTMENT PROPOSAL</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{proposalModalCampaign.title}</h3>
                <span className="text-xs text-slate-500">Founder: {profile.name} • {proposalModalCampaign.university || profile.university}</span>
              </div>
              <button
                type="button"
                onClick={() => setProposalModalCampaign(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {proposalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{proposalError}</span>
              </div>
            )}

            <form onSubmit={handleSendProposal} className="space-y-4 text-xs">
              {/* Proposal Amount */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Investment Offer Amount (BDT ৳) *</label>
                  <span className="text-[10px] text-slate-400 font-mono">Goal: ৳ {Number(proposalModalCampaign.goal || 0).toLocaleString()}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500">৳</span>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    required
                    value={proposalAmount}
                    onChange={(e) => setProposalAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                {/* Preset Chips */}
                <div className="flex gap-2 mt-2">
                  {['100000', '250000', '500000', '1000000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setProposalAmount(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                        proposalAmount === preset
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      ৳ {Number(preset).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Proposed Return Terms */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Return Structure / Term Sheet *</label>
                <select
                  value={proposalTerms}
                  onChange={(e) => setProposalTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="8% Revenue Share">8% Revenue Share (Standard)</option>
                  <option value="10% Revenue Share">10% Revenue Share</option>
                  <option value="12% Revenue Share">12% Revenue Share</option>
                  <option value="5% Equity Stake">5% Equity Stake</option>
                  <option value="7.5% Equity Stake">7.5% Equity Stake</option>
                  <option value="10% Equity Stake">10% Equity Stake</option>
                  <option value="Convertible Note (SAFE)">Convertible Note (SAFE)</option>
                  <option value="Custom">Custom Terms</option>
                </select>

                {proposalTerms === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={customTerms}
                    onChange={(e) => setCustomTerms(e.target.value)}
                    placeholder="Specify custom equity / debt / rev-share structure..."
                    className="mt-2 w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                )}
              </div>

              {/* Custom Notes / Message */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Message & Strategic Value-Add</label>
                <textarea
                  rows={3}
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  placeholder="Introduce yourself or share specific strategic guidance, mentoring, or partnership intentions..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProposalModalCampaign(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={proposalSubmitting}
                  className="px-5 py-2.5 bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{proposalSubmitting ? 'Submitting…' : 'Submit Investment Proposal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
