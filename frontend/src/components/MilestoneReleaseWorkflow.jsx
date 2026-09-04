import React, { useState, useEffect } from 'react';
import {
  Check,
  Lock,
  Clock,
  FileText,
  Maximize2,
  Printer,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldCheck,
  DollarSign,
  ChevronRight,
  FileCheck,
  Info,
  BadgeAlert,
  Send
} from 'lucide-react';

export default function MilestoneReleaseWorkflow({
  userRole = 'investor', // 'investor' | 'founder'
  currentUserId,
  partnershipId: initialPartnershipId,
  onClose,
  isModal = false
}) {
  const [partnerships, setPartnerships] = useState([]);
  const [selectedPartnership, setSelectedPartnership] = useState(null);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(1); // Default to Phase 2 (R&D)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactive checks state for audit intelligence
  const [mandatoryChecks, setMandatoryChecks] = useState({
    vendor_invoice_reconciliation: true,
    geotagged_photo_verification: true,
    third_party_inspector_attestation: false
  });

  // Action Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(null);

  // Form states
  const [requestForm, setRequestForm] = useState({
    amount: '',
    purpose: '',
    explanation: '',
    fund_usage: '',
    expected_outcome: '',
    timeline: '1 Month',
    vendor_name: 'BioCorp Global',
    invoice_number: '#8902-X',
    invoice_item1: 'Lab Equipment & Supplies',
    invoice_amt1: '',
    invoice_item2: 'Testing Modules & Installation',
    invoice_amt2: ''
  });

  const [completionForm, setCompletionForm] = useState({
    completed_objectives: '',
    amount_spent: '',
    remaining_amount: '0',
    progress_description: '',
    media_url: ''
  });

  const [disputeReason, setDisputeReason] = useState('');

  // Fetch partnerships from backend
  const fetchPartnerships = async () => {
    try {
      setLoading(true);
      const endpoint =
        userRole === 'founder'
          ? `/api/partnerships/founder/${currentUserId || 'usr_founder_1'}`
          : `/api/partnerships/investor/${currentUserId || 'usr_investor_1'}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        // Fallback to all partnerships
        const fallbackRes = await fetch('/api/partnerships');
        const fallbackData = await fallbackRes.json();
        setPartnerships(Array.isArray(fallbackData) ? fallbackData : []);
        if (fallbackData.length > 0) {
          const matched = initialPartnershipId
            ? fallbackData.find((p) => p.id === initialPartnershipId) || fallbackData[0]
            : fallbackData[0];
          setSelectedPartnership(matched);
        }
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setPartnerships(list);
      if (list.length > 0) {
        const matched = initialPartnershipId
          ? list.find((p) => p.id === initialPartnershipId) || list[0]
          : list[0];
        setSelectedPartnership(matched);
      }
    } catch (err) {
      console.error('Error loading partnerships:', err);
      setError('Unable to load partnership data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerships();
  }, [userRole, currentUserId, initialPartnershipId]);

  // Synchronize mandatory checks when selected phase changes
  useEffect(() => {
    if (!selectedPartnership) return;
    const ms = selectedPartnership.milestones?.[selectedPhaseIndex];
    if (ms && ms.mandatory_checks) {
      setMandatoryChecks({
        vendor_invoice_reconciliation: Boolean(ms.mandatory_checks.vendor_invoice_reconciliation),
        geotagged_photo_verification: Boolean(ms.mandatory_checks.geotagged_photo_verification),
        third_party_inspector_attestation: Boolean(ms.mandatory_checks.third_party_inspector_attestation)
      });
    }
  }, [selectedPartnership, selectedPhaseIndex]);

  const activeMilestone = selectedPartnership?.milestones?.[selectedPhaseIndex] || null;

  // Handle release tranche (Investor Action)
  const handleApproveAndRelease = async () => {
    if (!selectedPartnership || !activeMilestone) return;

    try {
      const res = await fetch(
        `/api/partnerships/${selectedPartnership.id}/milestones/${activeMilestone.id}/release`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            approved_amount: activeMilestone.request_details?.requested_amount || activeMilestone.amount,
            mandatory_checks: mandatoryChecks,
            payment_method: 'Secured MFS / Bank Escrow'
          })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to release tranche');
        return;
      }

      setSelectedPartnership(data.partnership);
      setShowSuccessToast({
        title: 'Tranche Released Successfully! 🚀',
        message: `৳ ${Number(data.milestone.release_details?.approved_amount || activeMilestone.amount).toLocaleString()} released to ${selectedPartnership.founder_name}. Reference: ${data.milestone.release_details?.reference_id}`
      });
      setTimeout(() => setShowSuccessToast(null), 5000);
    } catch (err) {
      console.error('Release error:', err);
      alert('Error communicating with server.');
    }
  };

  // Handle request funding (Founder Action)
  const handleRequestFunding = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPartnership || !activeMilestone) return;

    const reqAmt = Number(requestForm.amount || activeMilestone.amount);
    const docItems = [];
    if (requestForm.invoice_item1) {
      docItems.push({
        item: requestForm.invoice_item1,
        amount: Number(requestForm.invoice_amt1 || Math.round(reqAmt * 0.4))
      });
    }
    if (requestForm.invoice_item2) {
      docItems.push({
        item: requestForm.invoice_item2,
        amount: Number(requestForm.invoice_amt2 || Math.round(reqAmt * 0.6))
      });
    }

    try {
      const res = await fetch(
        `/api/partnerships/${selectedPartnership.id}/milestones/${activeMilestone.id}/request`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requested_amount: reqAmt,
            purpose: requestForm.purpose || activeMilestone.purpose,
            explanation: requestForm.explanation || 'Procurement of critical hardware and engineering services.',
            fund_usage: requestForm.fund_usage || 'Direct vendor disbursements and verified installation tests.',
            expected_outcome: requestForm.expected_outcome || activeMilestone.expected_outcome,
            timeline: requestForm.timeline,
            supporting_documents: [
              {
                name: `${requestForm.vendor_name.replace(/\s+/g, '_')}_INV_${Date.now().toString().slice(-4)}.pdf`,
                url: '/uploads/sample_invoice.pdf',
                vendor_name: requestForm.vendor_name,
                invoice_number: requestForm.invoice_number,
                total_payable: reqAmt,
                items: docItems.length > 0 ? docItems : [{ item: 'Procured Equipment', amount: reqAmt }]
              }
            ]
          })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit milestone request');
        return;
      }

      setSelectedPartnership(data.partnership);
      setShowRequestModal(false);
      setShowSuccessToast({
        title: 'Tranche Funding Request Sent! 📑',
        message: `Request for ${activeMilestone.title} submitted to ${selectedPartnership.investor_name} for audit.`
      });
      setTimeout(() => setShowSuccessToast(null), 5000);
    } catch (err) {
      console.error('Request funding error:', err);
      alert('Error submitting request.');
    }
  };

  // Handle submit completion (Founder Action)
  const handleSubmitCompletion = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPartnership || !activeMilestone) return;

    try {
      const res = await fetch(
        `/api/partnerships/${selectedPartnership.id}/milestones/${activeMilestone.id}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            completed_objectives: completionForm.completed_objectives || 'All milestone milestones achieved successfully.',
            amount_spent: Number(completionForm.amount_spent || activeMilestone.amount),
            remaining_amount: Number(completionForm.remaining_amount || 0),
            progress_description: completionForm.progress_description || 'Execution completed on schedule with verifiable deliverables.',
            media_urls: completionForm.media_url ? [completionForm.media_url] : []
          })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit completion report');
        return;
      }

      setSelectedPartnership(data.partnership);
      setShowCompletionModal(false);
      setShowSuccessToast({
        title: 'Completion Report Submitted! 🎯',
        message: 'Your report has been sent to the investor for verification to unlock the next milestone.'
      });
      setTimeout(() => setShowSuccessToast(null), 5000);
    } catch (err) {
      console.error('Completion error:', err);
      alert('Error submitting completion report.');
    }
  };

  // Handle investor verifying completion
  const handleVerifyCompletion = async () => {
    if (!selectedPartnership || !activeMilestone) return;

    try {
      const res = await fetch(
        `/api/partnerships/${selectedPartnership.id}/milestones/${activeMilestone.id}/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ investor_notes: 'Verified against geotagged reports and receipts.' })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to verify completion');
        return;
      }

      setSelectedPartnership(data.partnership);
      setShowSuccessToast({
        title: 'Milestone Verified & Next Phase Unlocked! 🏆',
        message: data.next_milestone
          ? `${data.next_milestone.title} is now UNLOCKED for the founder to request tranche funding.`
          : 'All project milestones have been successfully completed!'
      });
      setTimeout(() => setShowSuccessToast(null), 5000);
    } catch (err) {
      console.error('Verify error:', err);
      alert('Error verifying completion.');
    }
  };

  // Handle dispute flag
  const handleFlagDispute = async () => {
    if (!selectedPartnership || !activeMilestone) return;

    try {
      const res = await fetch(
        `/api/partnerships/${selectedPartnership.id}/milestones/${activeMilestone.id}/dispute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: disputeReason || 'Vendor invoice discrepancies identified.',
            initiator_role: userRole,
            initiator_id: currentUserId
          })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to flag dispute');
        return;
      }

      setSelectedPartnership(data.partnership);
      setShowDisputeModal(false);
      setShowSuccessToast({
        title: 'Dispute Flagged ⚠️',
        message: 'This milestone tranche has been placed on hold pending arbitration.'
      });
      setTimeout(() => setShowSuccessToast(null), 5000);
    } catch (err) {
      console.error('Dispute error:', err);
      alert('Error flagging dispute.');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-semibold text-sm">Loading Investment Roadmap & Audit Control...</p>
      </div>
    );
  }

  if (!selectedPartnership) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <Info className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800 text-base">No Active Milestone Partnerships Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Partnerships are formed once an investor offer is accepted. Once accepted, funding is divided into tranches with audited release controls.
        </p>
      </div>
    );
  }

  const milestones = selectedPartnership.milestones || [];
  const reqDetails = activeMilestone?.request_details;
  const supportingDoc = reqDetails?.supporting_documents?.[0];
  const invoiceItems = supportingDoc?.items || [
    { item: 'Lab Centrifuge Series-7', amount: 125000 },
    { item: 'Bio-Reactor Unit (Module B)', amount: 210000 }
  ];
  const totalPayable = supportingDoc?.total_payable || 335000;

  return (
    <div className={`bg-white rounded-2xl ${isModal ? 'p-6 max-h-[92vh] overflow-y-auto' : 'p-6 md:p-8'} shadow-xl border border-slate-100 space-y-6`}>
      {/* SUCCESS TOAST */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-md border border-emerald-500/40 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-sm text-white">{showSuccessToast.title}</p>
            <p className="text-slate-300 mt-0.5 leading-relaxed">{showSuccessToast.message}</p>
          </div>
          <button onClick={() => setShowSuccessToast(null)} className="text-slate-400 hover:text-white ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER: Title, Subtitle & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {selectedPartnership.campaign_title || 'Alpha-V Bio-Refinery'}
            </h1>
            {partnerships.length > 1 && (
              <select
                value={selectedPartnership.id}
                onChange={(e) => {
                  const p = partnerships.find((item) => item.id === e.target.value);
                  if (p) setSelectedPartnership(p);
                }}
                className="text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg px-2.5 py-1 border border-slate-200 outline-none"
              >
                {partnerships.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.campaign_title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            {selectedPartnership.roadmap_subtitle || `Series A Roadmap • ৳ ${Number(selectedPartnership.total_committed || 2400000).toLocaleString()} Aggregate`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowContractModal(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs md:text-sm font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>View Contract</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAuditModal(true)}
            className="px-4 py-2 bg-[#0052cc] hover:bg-[#0747a6] text-white text-xs md:text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-blue-200" />
            <span>Schedule Audit</span>
          </button>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* HORIZONTAL STEPPER TIMELINE */}
      <div className="py-3 px-2">
        <div className="flex items-center justify-between relative">
          {milestones.map((m, idx) => {
            const isCompleted = m.status === 'completed';
            const isPendingReview = m.status === 'pending_review';
            const isFunded = m.status === 'funded';
            const isUnlocked = m.status === 'unlocked';
            const isLocked = m.status === 'locked';
            const isDisputed = m.status === 'disputed';
            const isCurrent = idx === selectedPhaseIndex;

            return (
              <React.Fragment key={m.id || idx}>
                {/* Connecting Line */}
                {idx > 0 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                      milestones[idx - 1]?.status === 'completed' ? 'bg-[#2d6a4f]' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Step Node */}
                <button
                  type="button"
                  onClick={() => setSelectedPhaseIndex(idx)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-[#2d6a4f] text-white shadow-md'
                        : isPendingReview
                        ? 'bg-[#0066cc] text-white ring-4 ring-blue-100 shadow-md animate-pulse'
                        : isFunded
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md'
                        : isDisputed
                        ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                        : isUnlocked
                        ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                        : 'bg-slate-200 text-slate-400'
                    } ${isCurrent ? 'scale-110 ring-4' : 'hover:scale-105'}`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : isPendingReview ? (
                      <Clock className="w-5 h-5" />
                    ) : isFunded ? (
                      <DollarSign className="w-5 h-5" />
                    ) : isDisputed ? (
                      <BadgeAlert className="w-5 h-5" />
                    ) : isUnlocked ? (
                      <FileCheck className="w-5 h-5" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  <span
                    className={`mt-2 text-[11px] font-extrabold uppercase tracking-wider ${
                      isPendingReview
                        ? 'text-[#0066cc]'
                        : isCompleted
                        ? 'text-[#2d6a4f]'
                        : isFunded
                        ? 'text-emerald-700'
                        : isCurrent
                        ? 'text-slate-900'
                        : 'text-slate-500'
                    }`}
                  >
                    {m.title || `PHASE ${idx + 1}`}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {isCompleted
                      ? 'Completed'
                      : isPendingReview
                      ? 'In Review'
                      : isFunded
                      ? 'Funded'
                      : isUnlocked
                      ? 'Ready'
                      : 'Locked'}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 4-STAGE LIFECYCLE TRACKER BADGES FOR SELECTED TRANCHE */}
      {activeMilestone && (
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {activeMilestone.title}: {activeMilestone.name || activeMilestone.purpose}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              (৳ {Number(activeMilestone.amount || 0).toLocaleString()})
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold">
            {/* Stage 1: Requested */}
            <span
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                activeMilestone.lifecycle?.requested
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>1. Requested</span>
            </span>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            {/* Stage 2: Investor Review */}
            <span
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                activeMilestone.lifecycle?.investor_review === 'approved'
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : activeMilestone.lifecycle?.investor_review === 'pending'
                  ? 'bg-blue-100 text-blue-800 font-bold animate-pulse'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>2. Investor Review</span>
            </span>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            {/* Stage 3: Payment (Funded) */}
            <span
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                activeMilestone.lifecycle?.payment === 'funded'
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>3. Payment (Funded)</span>
            </span>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            {/* Stage 4: Completion */}
            <span
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                activeMilestone.lifecycle?.completion === 'completed'
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : activeMilestone.lifecycle?.completion === 'in_progress'
                  ? 'bg-amber-100 text-amber-800 font-bold'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>4. Completion</span>
            </span>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN SPLIT (Faithfully matching user screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* LEFT COLUMN (60%): ACTIVE EVIDENCE PACK */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              ACTIVE EVIDENCE PACK
            </h3>
            <div className="flex items-center gap-3 text-slate-400">
              <button
                type="button"
                onClick={() => alert('Evidence pack fullscreen mode.')}
                className="hover:text-slate-700 transition-colors cursor-pointer"
                title="Expand Evidence Pack"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="hover:text-slate-700 transition-colors cursor-pointer"
                title="Print Evidence Pack"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DOCUMENT PREVIEW CONTAINER */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            {/* Header Document Tab */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#0066cc]" />
              <span className="text-xs font-semibold text-slate-800 tracking-tight">
                {supportingDoc?.name || 'BioCorp_Equipment_INV_8902.pdf'}
              </span>
            </div>

            {/* INVOICE CONTENT */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Vendor & Invoice Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                    {supportingDoc?.vendor_name || 'BioCorp Global'}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    Supply Chain & Lab Solutions
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    INVOICE
                  </span>
                  <span className="text-lg md:text-xl font-extrabold text-slate-900">
                    {supportingDoc?.invoice_number || '#8902-X'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Line Items */}
              <div className="space-y-4 text-xs md:text-sm">
                {invoiceItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-800">
                    <span className="font-medium">{item.item}</span>
                    <span className="font-bold font-mono">
                      ৳ {Number(item.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100" />

              {/* Total Payable Row */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-900">
                  TOTAL PAYABLE
                </span>
                <span className="text-xl md:text-2xl font-extrabold text-[#0066cc] font-mono">
                  ৳ {Number(totalPayable).toLocaleString()}
                </span>
              </div>

              {/* Milestone Details & Justification Callout */}
              {reqDetails && (
                <div className="mt-6 p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Founder Funding Justification</span>
                  </p>
                  <p className="text-slate-600 leading-relaxed font-sans">
                    <strong>Why funds are needed:</strong> {reqDetails.explanation}
                  </p>
                  <p className="text-slate-600 leading-relaxed font-sans">
                    <strong>Fund Allocation:</strong> {reqDetails.fund_usage}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-mono">
                    <span>Expected Timeline: {reqDetails.timeline}</span>
                    <span>Requested: {new Date(reqDetails.requested_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {/* If milestone is funded or completed, show release transaction details */}
              {activeMilestone?.release_details && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Release Verified (MFS Transfer)</span>
                    </span>
                    <span className="font-mono text-emerald-700 font-bold">
                      REF: {activeMilestone.release_details.reference_id}
                    </span>
                  </div>
                  <p className="text-emerald-800 text-[11px]">
                    Funded on {activeMilestone.release_details.funded_date} via {activeMilestone.release_details.payment_method}. Amount: ৳ {Number(activeMilestone.release_details.approved_amount).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Completion Report Display if available */}
              {activeMilestone?.completion_report && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <FileCheck className="w-4 h-4 text-indigo-600" />
                      <span>Milestone Completion Report</span>
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded font-bold text-[10px]">
                      {activeMilestone.completion_report.verified_by_investor ? 'VERIFIED' : 'PENDING AUDIT'}
                    </span>
                  </div>
                  <p className="text-indigo-800">
                    <strong>Objectives Achieved:</strong> {activeMilestone.completion_report.completed_objectives}
                  </p>
                  <p className="text-indigo-800">
                    <strong>Amount Spent:</strong> ৳ {Number(activeMilestone.completion_report.amount_spent).toLocaleString()} · <strong>Remaining:</strong> ৳ {Number(activeMilestone.completion_report.remaining_amount || 0).toLocaleString()}
                  </p>
                  <p className="text-indigo-700 text-[11px]">
                    {activeMilestone.completion_report.progress_description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (40%): AUDIT INTELLIGENCE & RELEASE CONTROL */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header */}
          <div>
            <span className="text-[11px] font-bold text-[#0066cc] uppercase tracking-widest block">
              AUDIT INTELLIGENCE
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Release Control
            </h2>
          </div>

          {/* REQUEST AMOUNT CARD */}
          <div className="bg-[#f0f7ff] border border-[#d0e5ff] rounded-2xl p-5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              REQUEST AMOUNT
            </span>
            <p className="text-3xl font-extrabold text-[#0066cc] font-mono">
              ৳ {Number(reqDetails?.requested_amount || activeMilestone?.amount || 450000).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 italic mt-1">
              {activeMilestone?.purpose || 'Tranche release for Phase 2: R&D Installation'}
            </p>
          </div>

          {/* MANDATORY CHECKS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              MANDATORY CHECKS
            </h4>

            {/* Check 1 */}
            <label className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all">
              <input
                type="checkbox"
                checked={mandatoryChecks.vendor_invoice_reconciliation}
                onChange={(e) =>
                  setMandatoryChecks((prev) => ({
                    ...prev,
                    vendor_invoice_reconciliation: e.target.checked
                  }))
                }
                className="w-4 h-4 text-[#0066cc] rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800 select-none">
                Vendor Invoice Reconciliation
              </span>
            </label>

            {/* Check 2 */}
            <label className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all">
              <input
                type="checkbox"
                checked={mandatoryChecks.geotagged_photo_verification}
                onChange={(e) =>
                  setMandatoryChecks((prev) => ({
                    ...prev,
                    geotagged_photo_verification: e.target.checked
                  }))
                }
                className="w-4 h-4 text-[#0066cc] rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800 select-none">
                Geotagged Photo Verification
              </span>
            </label>

            {/* Check 3 */}
            <label className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all">
              <input
                type="checkbox"
                checked={mandatoryChecks.third_party_inspector_attestation}
                onChange={(e) =>
                  setMandatoryChecks((prev) => ({
                    ...prev,
                    third_party_inspector_attestation: e.target.checked
                  }))
                }
                className="w-4 h-4 text-[#0066cc] rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800 select-none">
                3rd Party Inspector Attestation
              </span>
            </label>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3 pt-2">
            {/* If user is Investor */}
            {userRole === 'investor' && (
              <>
                {activeMilestone?.status === 'pending_review' && (
                  <button
                    type="button"
                    onClick={handleApproveAndRelease}
                    className="w-full py-3.5 px-6 bg-[#2d6a4f] hover:bg-[#24563f] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Approve & Release Tranche (MFS Transfer)</span>
                  </button>
                )}

                {activeMilestone?.status === 'funded' && activeMilestone?.completion_report && !activeMilestone.completion_report.verified_by_investor && (
                  <button
                    type="button"
                    onClick={handleVerifyCompletion}
                    className="w-full py-3.5 px-6 bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Completion & Unlock Next Phase</span>
                  </button>
                )}

                {activeMilestone?.status === 'funded' && !activeMilestone?.completion_report && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-center font-medium">
                    Tranche funds released. Awaiting founder's Milestone Completion Report.
                  </div>
                )}

                {activeMilestone?.status === 'completed' && (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 text-center font-bold flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Phase Completed & Verified</span>
                  </div>
                )}

                {activeMilestone?.status === 'locked' && (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 text-center font-medium flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>This tranche is locked until previous milestones are completed.</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowDisputeModal(true)}
                  className="w-full py-3 px-6 border-2 border-[#d32f2f] text-[#d32f2f] hover:bg-red-50 font-bold text-xs md:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-[#d32f2f]" />
                  <span>Flag for Dispute</span>
                </button>
              </>
            )}

            {/* If user is Founder */}
            {userRole === 'founder' && (
              <>
                {activeMilestone?.status === 'unlocked' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRequestForm({
                        amount: activeMilestone.amount || '',
                        purpose: activeMilestone.purpose || '',
                        explanation: '',
                        fund_usage: '',
                        expected_outcome: activeMilestone.expected_outcome || '',
                        timeline: activeMilestone.timeline || '1 Month',
                        vendor_name: 'Verified Hardware Solutions',
                        invoice_number: `#INV-${Date.now().toString().slice(-4)}`,
                        invoice_item1: activeMilestone.purpose || 'Equipment & Components',
                        invoice_amt1: String(Math.round(activeMilestone.amount * 0.5)),
                        invoice_item2: 'Installation & Quality Verification',
                        invoice_amt2: String(Math.round(activeMilestone.amount * 0.5))
                      });
                      setShowRequestModal(true);
                    }}
                    className="w-full py-3.5 px-6 bg-[#2d6a4f] hover:bg-[#24563f] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Create Funding Milestone Request</span>
                  </button>
                )}

                {activeMilestone?.status === 'pending_review' && (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 text-center font-medium">
                    Funding release requested. Pending audit and MFS transfer by investor.
                  </div>
                )}

                {activeMilestone?.status === 'funded' && !activeMilestone?.completion_report && (
                  <button
                    type="button"
                    onClick={() => {
                      setCompletionForm({
                        completed_objectives: '',
                        amount_spent: String(activeMilestone.amount || ''),
                        remaining_amount: '0',
                        progress_description: '',
                        media_url: ''
                      });
                      setShowCompletionModal(true);
                    }}
                    className="w-full py-3.5 px-6 bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Submit Milestone Completion Report</span>
                  </button>
                )}

                {activeMilestone?.status === 'funded' && activeMilestone?.completion_report && !activeMilestone.completion_report.verified_by_investor && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-center font-medium">
                    Completion report submitted. Awaiting investor verification to unlock next phase.
                  </div>
                )}

                {activeMilestone?.status === 'completed' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-center font-bold flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Phase Completed & Verified</span>
                  </div>
                )}

                {activeMilestone?.status === 'locked' && (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 text-center font-medium flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Locked until preceding milestone completion is verified.</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowDisputeModal(true)}
                  className="w-full py-3 px-6 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Report An Issue / Arbitration</span>
                </button>
              </>
            )}
          </div>

          {/* LEGAL DISCLAIMER FOOTER */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center mt-6">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Authorized release of funds is legally binding. All transfers are processed through secured institutional MFS channels.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL 1: FOUNDER TRANCHE REQUEST */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Create Funding Milestone Request
                </h3>
                <p className="text-xs text-slate-500">
                  Request tranche release for {activeMilestone?.title}
                </p>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestFunding} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Requested Amount (৳)</label>
                  <input
                    type="number"
                    required
                    value={requestForm.amount}
                    onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 450000"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expected Timeline</label>
                  <input
                    type="text"
                    required
                    value={requestForm.timeline}
                    onChange={(e) => setRequestForm({ ...requestForm, timeline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 1 Month"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Purpose of Requested Funds</label>
                <input
                  type="text"
                  required
                  value={requestForm.purpose}
                  onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Purchase raw materials and start production"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Why is this money needed? (Detailed explanation)</label>
                <textarea
                  rows={2}
                  required
                  value={requestForm.explanation}
                  onChange={(e) => setRequestForm({ ...requestForm, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Explain why the money is needed for this stage..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">How will the money be used?</label>
                <textarea
                  rows={2}
                  required
                  value={requestForm.fund_usage}
                  onChange={(e) => setRequestForm({ ...requestForm, fund_usage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Breakdown of itemized expenses..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Expected Outcome</label>
                <input
                  type="text"
                  required
                  value={requestForm.expected_outcome}
                  onChange={(e) => setRequestForm({ ...requestForm, expected_outcome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 100 functional units produced"
                />
              </div>

              {/* Vendor & Invoice info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Supporting Vendor Invoice / Documents
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={requestForm.vendor_name}
                    onChange={(e) => setRequestForm({ ...requestForm, vendor_name: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                    placeholder="Vendor Name"
                  />
                  <input
                    type="text"
                    value={requestForm.invoice_number}
                    onChange={(e) => setRequestForm({ ...requestForm, invoice_number: e.target.value })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                    placeholder="Invoice #"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2d6a4f] hover:bg-[#24563f] text-white font-bold rounded-lg cursor-pointer"
                >
                  Submit Tranche Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FOUNDER COMPLETION REPORT */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Submit Milestone Completion Report
                </h3>
                <p className="text-xs text-slate-500">
                  Verify objectives and report fund utilization for {activeMilestone?.title}
                </p>
              </div>
              <button onClick={() => setShowCompletionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompletion} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Completed Objectives & Results</label>
                <textarea
                  rows={2}
                  required
                  value={completionForm.completed_objectives}
                  onChange={(e) => setCompletionForm({ ...completionForm, completed_objectives: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Unit testing passed, 100 units assembled and certified..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount Spent (৳)</label>
                  <input
                    type="number"
                    required
                    value={completionForm.amount_spent}
                    onChange={(e) => setCompletionForm({ ...completionForm, amount_spent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Remaining Balance (৳)</label>
                  <input
                    type="number"
                    value={completionForm.remaining_amount}
                    onChange={(e) => setCompletionForm({ ...completionForm, remaining_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detailed Progress Summary</label>
                <textarea
                  rows={3}
                  required
                  value={completionForm.progress_description}
                  onChange={(e) => setCompletionForm({ ...completionForm, progress_description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Describe operational results, vendor execution, and milestones reached..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Supporting Media / Proof URL (Optional)</label>
                <input
                  type="text"
                  value={completionForm.media_url}
                  onChange={(e) => setCompletionForm({ ...completionForm, media_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://drive.google.com/or-proof-link"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0052cc] hover:bg-[#0747a6] text-white font-bold rounded-lg cursor-pointer"
                >
                  Send Report for Investor Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DISPUTE ARBITRATION */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-slate-900">
                Flag Milestone for Dispute
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Flagging this milestone pauses any funding release until both parties or platform arbitrators review invoice proofs and deliverables.
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">Reason for Dispute</label>
              <textarea
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                placeholder="Detail discrepancies, vendor mismatch, or unfulfilled milestones..."
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFlagDispute}
                className="px-5 py-2 bg-[#d32f2f] hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Confirm Dispute Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW CONTRACT */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Partnership Investment Agreement
                </h3>
                <p className="text-xs text-slate-500">
                  Tranche-Based Milestone Contract
                </p>
              </div>
              <button onClick={() => setShowContractModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-3 text-xs text-slate-700 leading-relaxed font-mono">
              <p>
                <strong>PARTIES:</strong> {selectedPartnership.investor_name} (Investor) & {selectedPartnership.founder_name} (Founder, {selectedPartnership.founder_university})
              </p>
              <p>
                <strong>TOTAL COMMITTED:</strong> ৳ {Number(selectedPartnership.total_committed).toLocaleString()}
              </p>
              <p>
                <strong>RELEASE SCHEDULE:</strong> Funds are divided into 4 sequential tranches governed by audited milestones. No subsequent tranche will be released until the preceding milestone report has been submitted by Founder and verified by Investor.
              </p>
              <p>
                <strong>AUDIT CONTROLS:</strong> All disbursements require vendor invoice reconciliation and geotagged photographic verification.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowContractModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
              >
                Close Agreement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SCHEDULE AUDIT */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Schedule Field / On-Site Audit
              </h3>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Appoint a 3rd party certified inspector or schedule a direct on-site physical visit to verify R&D modules for {activeMilestone?.title}.
              </p>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Preferred Inspection Date</label>
                <input
                  type="date"
                  defaultValue="2026-09-10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Inspector Agency / Contact</label>
                <input
                  type="text"
                  defaultValue="SGS Certified Engineering Inspections Ltd."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAuditModal(false);
                  setShowSuccessToast({
                    title: 'Audit Scheduled 📅',
                    message: 'On-site inspector appointment registered. Founder has been notified.'
                  });
                  setTimeout(() => setShowSuccessToast(null), 4000);
                }}
                className="px-4 py-2 bg-[#0052cc] text-white font-bold rounded-lg"
              >
                Confirm Audit Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
