import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { fallbackProposals, fallbackCampaigns, fallbackUsers } from '../utils/storeUtils.js';
import {
  assertTransition,
  canAccessTransaction,
  deriveHealth,
  deriveNextAction,
  displayStatus,
  isOverdue,
  participantRole
} from '../lib/milestoneState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const S3_PARTNERSHIP_STORE_PATH = path.join(__dirname, '..', 's3_partnership_milestones.json');

export const fallbackPartnerships = [];

const loadS3Partnerships = () => {
  try {
    if (!fs.existsSync(S3_PARTNERSHIP_STORE_PATH)) return;
    const raw = fs.readFileSync(S3_PARTNERSHIP_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      fallbackPartnerships.length = 0;
      fallbackPartnerships.push(...parsed);
    }
  } catch (e) {
    console.warn('Partnership store load warning:', e.message);
  }
};

const persistS3Partnerships = () => {
  try {
    fs.writeFileSync(S3_PARTNERSHIP_STORE_PATH, JSON.stringify(fallbackPartnerships, null, 2), 'utf8');
  } catch (e) {
    console.warn('Partnership store save warning:', e.message);
  }
};

loadS3Partnerships();

// Seed canonical partnership if none exists
const seedDefaultPartnerships = () => {
  if (fallbackPartnerships.length > 0) return;

  const defaultPartnership = {
    id: 'part_alphav_01',
    proposal_id: 'prop_alphav_01',
    campaign_id: 'campusbites_1',
    campaign_title: 'Alpha-V Bio-Refinery',
    roadmap_subtitle: 'Series A Roadmap • $2.4M Aggregate',
    contract_url: '#',
    founder_id: 'usr_founder_1',
    founder_name: 'Ashraf Khan',
    founder_email: 'ashraf.khan1@univ.edu.bd',
    founder_university: 'BRAC University',
    investor_id: 'usr_investor_1',
    investor_name: 'Angel Backer Zaman',
    investor_institution: 'Vantage Ventures Dhaka',
    total_committed: 2400000,
    created_at: new Date('2026-08-15').toISOString(),
    milestones: [
      {
        id: 'phase_1',
        phase_number: 1,
        title: 'PHASE 1',
        name: 'Phase 1: Pilot Fabrication & Core Setup',
        amount: 600000,
        purpose: 'Pilot bio-refinery design and prototype infrastructure setup',
        expected_outcome: 'Completed pilot benchmark output & testing',
        timeline: '2 Months',
        status: 'completed',
        lifecycle: {
          requested: true,
          investor_review: 'approved',
          payment: 'funded',
          completion: 'completed'
        },
        request_details: {
          requested_amount: 600000,
          purpose: 'Pilot design and equipment procurement',
          explanation: 'Acquisition of preliminary distillation arrays and base materials.',
          fund_usage: 'Core hardware ($400k), installation ($200k)',
          expected_outcome: 'Operational pilot facility',
          timeline: '2 Months',
          supporting_documents: [
            {
              name: 'BioCorp_Pilot_INV_8011.pdf',
              url: '/uploads/invoice_phase1.pdf',
              total_payable: 600000,
              items: [{ item: 'Distillation Columns', amount: 400000 }, { item: 'Installation Services', amount: 200000 }]
            }
          ],
          requested_at: new Date('2026-08-20').toISOString()
        },
        mandatory_checks: {
          vendor_invoice_reconciliation: true,
          geotagged_photo_verification: true,
          third_party_inspector_attestation: true
        },
        release_details: {
          approved_amount: 600000,
          funded_date: '2026-08-25',
          reference_id: 'TRX-MFS-883109',
          payment_method: 'Secured MFS / Bank Escrow'
        },
        completion_report: {
          completed_objectives: 'Pilot run completed with 100% target purity benchmark achieved.',
          amount_spent: 600000,
          remaining_amount: 0,
          progress_description: 'Pilot refinery unit fully operational with 0 incidents.',
          media_urls: [],
          submitted_at: new Date('2026-09-01').toISOString(),
          verified_by_investor: true,
          verified_at: new Date('2026-09-02').toISOString()
        }
      },
      {
        id: 'phase_2',
        phase_number: 2,
        title: 'PHASE 2',
        name: 'Phase 2: R&D Installation & Testing',
        amount: 450000,
        purpose: 'Tranche release for Phase 2: R&D Installation',
        expected_outcome: 'Installation of high-capacity centrifuge and bio-reactor modules',
        timeline: '1 Month',
        status: 'pending_review',
        lifecycle: {
          requested: true,
          investor_review: 'pending',
          payment: 'locked',
          completion: 'locked'
        },
        request_details: {
          requested_amount: 450000,
          purpose: 'Tranche release for Phase 2: R&D Installation',
          explanation: 'Immediate release required to fulfill hardware supplier invoices for lab-scale centrifuges and primary bio-reactor unit.',
          fund_usage: 'Vendor equipment payments and certified technician onboarding.',
          expected_outcome: 'Fully installed bio-reactor module producing 500L/day batch yield.',
          timeline: '1 Month',
          supporting_documents: [
            {
              name: 'BioCorp_Equipment_INV_8902.pdf',
              url: '/uploads/BioCorp_Equipment_INV_8902.pdf',
              vendor_name: 'BioCorp Global',
              vendor_sub: 'Supply Chain & Lab Solutions',
              invoice_number: '#8902-X',
              total_payable: 335000,
              items: [
                { item: 'Lab Centrifuge Series-7', amount: 125000 },
                { item: 'Bio-Reactor Unit (Module B)', amount: 210000 }
              ]
            }
          ],
          requested_at: new Date('2026-09-04').toISOString()
        },
        mandatory_checks: {
          vendor_invoice_reconciliation: true,
          geotagged_photo_verification: true,
          third_party_inspector_attestation: false
        },
        release_details: null,
        completion_report: null
      },
      {
        id: 'phase_3',
        phase_number: 3,
        title: 'PHASE 3',
        name: 'Phase 3: Production Scaling & Automation',
        amount: 750000,
        purpose: 'Automated conveyor assembly and quality assurance line',
        expected_outcome: 'Industrial capacity scale-up to 2,000L/day',
        timeline: '3 Months',
        status: 'locked',
        lifecycle: {
          requested: false,
          investor_review: 'locked',
          payment: 'locked',
          completion: 'locked'
        },
        request_details: null,
        mandatory_checks: {
          vendor_invoice_reconciliation: false,
          geotagged_photo_verification: false,
          third_party_inspector_attestation: false
        },
        release_details: null,
        completion_report: null
      },
      {
        id: 'phase_4',
        phase_number: 4,
        title: 'EXIT',
        name: 'Exit & Commercial Distribution',
        amount: 600000,
        purpose: 'Distribution networks, enterprise partnerships, and revenue distribution',
        expected_outcome: 'Direct industrial off-take contracts and dividend distribution',
        timeline: '6 Months',
        status: 'locked',
        lifecycle: {
          requested: false,
          investor_review: 'locked',
          payment: 'locked',
          completion: 'locked'
        },
        request_details: null,
        mandatory_checks: {
          vendor_invoice_reconciliation: false,
          geotagged_photo_verification: false,
          third_party_inspector_attestation: false
        },
        release_details: null,
        completion_report: null
      }
    ]
  };

  fallbackPartnerships.push(defaultPartnership);
  persistS3Partnerships();
};

seedDefaultPartnerships();

function appendActivity(part, event) {
  if (!Array.isArray(part.activity)) part.activity = [];
  part.activity.unshift({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
    ...event
  });
  part.updated_at = new Date().toISOString();
}

function enrichMilestone(m, now = new Date()) {
  const status = String(m.status || 'locked').toLowerCase();
  return {
    ...m,
    status,
    progress: Math.min(100, Math.max(0, Number(m.progress || 0))),
    overdue: isOverdue(m, now),
    display_status: displayStatus(m, now),
    proof_history: Array.isArray(m.proof_history) ? m.proof_history : (m.completion_report ? [m.completion_report] : [])
  };
}

const calculateSummary = (p, viewerRole = null) => {
  const milestones = (Array.isArray(p.milestones) ? p.milestones : []).map((m) => enrichMilestone(m));
  const totalCommitted = Number(p.total_committed || 0);
  const amountReleased = milestones
    .filter((m) => ['completed', 'funded', 'proof_submitted', 'revision_requested'].includes(m.status))
    .reduce((sum, m) => sum + (Number(m.release_details?.approved_amount || 0) || 0), 0);
  const remainingInvestment = Math.max(0, totalCommitted - amountReleased);
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const currentMilestone = milestones.find((m) => !['completed', 'locked', 'cancelled'].includes(m.status)) || null;
  const allDone = milestones.length > 0 && completedMilestones === milestones.length && !p.frozen;
  const base = {
    ...p,
    milestones,
    amount_released: amountReleased,
    remaining_investment: remainingInvestment,
    escrow_amount: totalCommitted,
    completed_milestones: completedMilestones,
    total_milestones: milestones.length,
    overall_progress: milestones.length ? Math.round((completedMilestones / milestones.length) * 100) : 0,
    current_milestone: currentMilestone,
    transaction_status: allDone ? 'completed' : (p.frozen ? 'frozen' : (currentMilestone ? 'active' : 'pending')),
    health: 'On Track',
    activity: Array.isArray(p.activity) ? p.activity : []
  };
  base.health = deriveHealth(base);
  if (viewerRole) base.next_action = deriveNextAction(viewerRole, base);
  else {
    base.next_action_founder = deriveNextAction('founder', base);
    base.next_action_investor = deriveNextAction('investor', base);
  }
  return base;
};

const inFlightFinancial = new Set();

function withFinancialLock(key, fn) {
  if (inFlightFinancial.has(key)) {
    return { ok: false, error: 'This financial action is already being processed.' };
  }
  inFlightFinancial.add(key);
  try {
    return fn();
  } finally {
    inFlightFinancial.delete(key);
  }
}

export const partnershipModel = {
  getAll() {
    return fallbackPartnerships.map(calculateSummary);
  },

  getByFounder(founderId) {
    const fid = String(founderId || '');
    return fallbackPartnerships
      .filter((p) => String(p.founder_id) === fid)
      .map(calculateSummary);
  },

  getByInvestor(investorId) {
    const iid = String(investorId || '');
    return fallbackPartnerships
      .filter((p) => String(p.investor_id) === iid)
      .map(calculateSummary);
  },

  getById(id) {
    const sid = String(id || '');
    const found = fallbackPartnerships.find((p) => p.id === sid);
    return found ? calculateSummary(found) : null;
  },

  createFromAcceptedProposal(proposal, campaign) {
    const existing = fallbackPartnerships.find((p) => p.proposal_id === (proposal.id || proposal._id));
    if (existing) return calculateSummary(existing);

    const totalAmount = Number(proposal.amount || proposal.counter_amount || 0);
    const terms = proposal.return_structure || proposal.terms || proposal.counter_terms || '';
    const campaignMs = Array.isArray(campaign?.milestones) && campaign.milestones.length
      ? campaign.milestones
      : [
        { title: 'Milestone 1 — Execution start', target: 'Month 1', status: 'pending' },
        { title: 'Milestone 2 — Traction', target: 'Month 3', status: 'pending' },
        { title: 'Milestone 3 — Scale', target: 'Month 6', status: 'pending' }
      ];
    const trancheBase = Math.floor(totalAmount / campaignMs.length);
    const founder = fallbackUsers.find((u) => String(u.id) === String(proposal.founder_id || campaign?.founder_id));
    const investor = fallbackUsers.find((u) => String(u.id) === String(proposal.investor_id || proposal.investorId));

    const newPartnership = {
      id: 'part_' + Date.now(),
      proposal_id: proposal.id || proposal._id,
      campaign_id: campaign?.id || proposal.campaign_id,
      campaign_title: campaign?.title || proposal.campaign_title || 'Startup Partnership',
      roadmap_subtitle: `${campaign?.stage || 'Live campaign'} • ৳ ${totalAmount.toLocaleString()} committed`,
      investment_type: terms,
      terms,
      contract_url: '#',
      founder_id: proposal.founder_id || campaign?.founder_id || campaign?.founderId || '',
      founder_name: founder?.name || proposal.founder_name || campaign?.founder?.name || 'Student Founder',
      founder_email: founder?.email || campaign?.founder?.email || '',
      founder_university: campaign?.university || founder?.university || '',
      investor_id: proposal.investor_id || proposal.investorId || '',
      investor_name: investor?.name || proposal.investor_name || 'Investor',
      investor_institution: investor?.institution || '',
      total_committed: totalAmount,
      frozen: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      activity: [{
        id: `evt_accept_${Date.now()}`,
        actor_role: 'founder',
        actor_id: proposal.founder_id || campaign?.founder_id,
        event: 'proposal_accepted',
        label: 'Investment proposal accepted — escrow funded',
        amount: totalAmount,
        created_at: new Date().toISOString()
      }],
      milestones: campaignMs.map((m, idx) => {
        const amount = idx === campaignMs.length - 1 ? totalAmount - trancheBase * (campaignMs.length - 1) : trancheBase;
        return {
          id: `phase_${idx + 1}`,
          phase_number: idx + 1,
          title: `PHASE ${idx + 1}`,
          name: m.title || m.name || `Milestone ${idx + 1}`,
          amount,
          purpose: m.description || m.title || 'Milestone execution',
          expected_outcome: m.target || m.objective || '',
          timeline: m.target || '',
          due_date: m.due_date || m.dueDate || null,
          progress: 0,
          status: idx === 0 ? 'unlocked' : 'locked',
          lifecycle: {
            requested: false,
            investor_review: idx === 0 ? 'pending' : 'locked',
            payment: 'locked',
            completion: 'locked'
          },
          request_details: null,
          mandatory_checks: {
            vendor_invoice_reconciliation: false,
            geotagged_photo_verification: false,
            third_party_inspector_attestation: false
          },
          release_details: null,
          completion_report: null,
          proof_history: []
        };
      })
    };

    fallbackPartnerships.unshift(newPartnership);
    persistS3Partnerships();
    return calculateSummary(newPartnership);
  },

  requestMilestoneFunding(partnershipId, milestoneId, requestData) {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };
    if (part.frozen) return { ok: false, error: 'TRANSACTION FROZEN. Financial actions are temporarily unavailable.', status: 423 };

    const ms = part.milestones.find((m) => m.id === milestoneId);
    if (!ms) return { ok: false, error: 'Milestone not found in partnership roadmap.' };
    if (ms.status === 'pending_review') return { ok: false, error: 'A funding request is already pending for this milestone.' };

    try { assertTransition(ms.status, 'pending_review'); } catch (e) {
      return { ok: false, error: e.message };
    }

    const released = calculateSummary(part).amount_released;
    const reqAmt = Number(requestData.requested_amount || requestData.amount || ms.amount);
    if (!reqAmt || reqAmt <= 0) return { ok: false, error: 'Requested amount must be greater than zero.' };
    if (reqAmt > Number(ms.amount || 0) * 1.0001) return { ok: false, error: 'Request cannot exceed the milestone allocation.' };
    if (reqAmt > Math.max(0, Number(part.total_committed || 0) - released)) {
      return { ok: false, error: 'Request cannot exceed remaining transaction funds.' };
    }

    ms.status = 'pending_review';
    ms.lifecycle = { ...(ms.lifecycle || {}), requested: true, investor_review: 'pending' };
    ms.purpose = requestData.purpose || ms.purpose;
    ms.expected_outcome = requestData.expected_outcome || ms.expected_outcome;
    ms.timeline = requestData.timeline || ms.timeline;
    ms.request_details = {
      requested_amount: reqAmt,
      purpose: requestData.purpose || ms.purpose,
      explanation: requestData.explanation || requestData.reason || '',
      fund_usage: requestData.fund_usage || '',
      expected_outcome: requestData.expected_outcome || ms.expected_outcome,
      timeline: requestData.timeline || ms.timeline,
      supporting_documents: Array.isArray(requestData.supporting_documents) ? requestData.supporting_documents : [],
      requested_at: new Date().toISOString()
    };
    appendActivity(part, {
      actor_role: 'founder',
      actor_id: requestData.actorId,
      event: 'funding_requested',
      label: `Founder requested ৳ ${reqAmt.toLocaleString()} for ${ms.name || ms.title}`,
      amount: reqAmt,
      milestone_id: ms.id
    });
    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms };
  },

  rejectMilestoneFunding(partnershipId, milestoneId, { reason, actorId } = {}) {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };
    if (part.frozen) return { ok: false, error: 'TRANSACTION FROZEN. Financial actions are temporarily unavailable.', status: 423 };
    const ms = part.milestones.find((m) => m.id === milestoneId);
    if (!ms) return { ok: false, error: 'Milestone not found.' };
    try { assertTransition(ms.status, 'unlocked'); } catch (e) { return { ok: false, error: e.message }; }
    ms.status = 'unlocked';
    ms.lifecycle = { ...(ms.lifecycle || {}), investor_review: 'rejected', requested: false };
    ms.request_details = { ...(ms.request_details || {}), rejected_at: new Date().toISOString(), rejection_reason: reason || 'Rejected by investor' };
    appendActivity(part, { actor_role: 'investor', actor_id: actorId, event: 'funding_rejected', label: `Investor rejected funding request: ${reason || 'No reason'}`, milestone_id: ms.id });
    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms };
  },

  releaseMilestoneFunding(partnershipId, milestoneId, releaseData) {
    return withFinancialLock(`release:${partnershipId}:${milestoneId}`, () => {
      const part = fallbackPartnerships.find((p) => p.id === partnershipId);
      if (!part) return { ok: false, error: 'Partnership not found.' };
      if (part.frozen) return { ok: false, error: 'TRANSACTION FROZEN. Financial actions are temporarily unavailable.', status: 423 };

      const ms = part.milestones.find((m) => m.id === milestoneId);
      if (!ms) return { ok: false, error: 'Milestone not found in partnership roadmap.' };

      if (ms.release_details?.reference_id && ['funded', 'proof_submitted', 'completed'].includes(ms.status)) {
        return { ok: true, alreadyProcessed: true, partnership: calculateSummary(part), milestone: ms };
      }

      try { assertTransition(ms.status, 'funded'); } catch (e) {
        return { ok: false, error: e.message };
      }

      const approvedAmount = Number(releaseData.approved_amount || ms.request_details?.requested_amount || ms.amount);
      const summary = calculateSummary(part);
      if (approvedAmount > summary.remaining_investment + 0.01) {
        return { ok: false, error: 'Insufficient remaining escrow allocation for this release.' };
      }

      ms.status = 'funded';
      ms.lifecycle = { ...(ms.lifecycle || {}), investor_review: 'approved', payment: 'funded', completion: 'in_progress' };
      const refId = releaseData.reference_id || `TRX-MFS-${Date.now().toString().slice(-8)}`;
      ms.release_details = {
        approved_amount: approvedAmount,
        funded_date: new Date().toISOString(),
        reference_id: refId,
        payment_method: releaseData.payment_method || 'Secured MFS / Bank Escrow Transfer'
      };
      appendActivity(part, {
        actor_role: 'investor',
        actor_id: releaseData.actorId,
        event: 'funds_released',
        label: `Investor released ৳ ${approvedAmount.toLocaleString()} for ${ms.name || ms.title}`,
        amount: approvedAmount,
        milestone_id: ms.id,
        reference_id: refId
      });
      persistS3Partnerships();
      return { ok: true, partnership: calculateSummary(part), milestone: ms };
    });
  },

  updateMilestoneProgress(partnershipId, milestoneId, { progress, note, actorId } = {}) {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };
    if (part.frozen) return { ok: false, error: 'TRANSACTION FROZEN.', status: 423 };
    const ms = part.milestones.find((m) => m.id === milestoneId);
    if (!ms) return { ok: false, error: 'Milestone not found.' };
    if (!['unlocked', 'funded', 'revision_requested'].includes(ms.status)) {
      return { ok: false, error: 'Progress can only be updated on an active milestone.' };
    }
    const next = Math.min(100, Math.max(0, Number(progress)));
    if (Number.isNaN(next)) return { ok: false, error: 'Progress must be 0–100.' };
    ms.progress = next;
    ms.progress_note = String(note || '').slice(0, 2000);
    ms.progress_updated_at = new Date().toISOString();
    if (next === 100) {
      ms.progress_note = (ms.progress_note || '') + ' (100% execution is not completion until investor verification.)';
    }
    appendActivity(part, { actor_role: 'founder', actor_id: actorId, event: 'progress_updated', label: `Founder updated progress to ${next}%`, milestone_id: ms.id });
    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms };
  },

  submitMilestoneCompletion(partnershipId, milestoneId, reportData) {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };
    if (part.frozen) return { ok: false, error: 'TRANSACTION FROZEN.', status: 423 };

    const ms = part.milestones.find((m) => m.id === milestoneId);
    if (!ms) return { ok: false, error: 'Milestone not found.' };

    const from = ms.status === 'revision_requested' ? 'revision_requested' : ms.status;
    try { assertTransition(from, 'proof_submitted'); } catch (e) { return { ok: false, error: e.message }; }

    const version = (Array.isArray(ms.proof_history) ? ms.proof_history.length : 0) + 1;
    const report = {
      version,
      completed_objectives: reportData.completed_objectives || reportData.note || '',
      amount_spent: Number(reportData.amount_spent || ms.release_details?.approved_amount || 0),
      remaining_amount: Number(reportData.remaining_amount || 0),
      progress_description: reportData.progress_description || '',
      media_urls: Array.isArray(reportData.media_urls) ? reportData.media_urls : [],
      submitted_at: new Date().toISOString(),
      verified_by_investor: false
    };
    ms.completion_report = report;
    ms.proof_history = [...(ms.proof_history || []), report];
    ms.status = 'proof_submitted';
    ms.lifecycle = { ...(ms.lifecycle || {}), completion: 'pending_verification' };
    appendActivity(part, {
      actor_role: 'founder',
      actor_id: reportData.actorId,
      event: 'proof_submitted',
      label: `Founder submitted proof v${version} for ${ms.name || ms.title}`,
      milestone_id: ms.id
    });
    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms };
  },

  requestMilestoneRevision(partnershipId, milestoneId, { reason, actorId } = {}) {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };
    if (part.frozen) return { ok: false, error: 'TRANSACTION FROZEN.', status: 423 };
    const ms = part.milestones.find((m) => m.id === milestoneId);
    if (!ms) return { ok: false, error: 'Milestone not found.' };
    const why = String(reason || '').trim();
    if (!why) return { ok: false, error: 'A revision reason is required.' };
    try { assertTransition(ms.status, 'revision_requested'); } catch (e) { return { ok: false, error: e.message }; }
    ms.status = 'revision_requested';
    ms.revision_reason = why;
    ms.revision_requested_at = new Date().toISOString();
    appendActivity(part, { actor_role: 'investor', actor_id: actorId, event: 'revision_requested', label: `Investor requested revision: ${why}`, milestone_id: ms.id });
    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms };
  },

  verifyMilestoneCompletion(partnershipId, milestoneId, { actorId, investor_notes } = {}) {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };
    if (part.frozen) return { ok: false, error: 'TRANSACTION FROZEN.', status: 423 };

    const msIdx = part.milestones.findIndex((m) => m.id === milestoneId);
    if (msIdx === -1) return { ok: false, error: 'Milestone not found.' };

    const ms = part.milestones[msIdx];
    if (ms.status === 'completed') {
      return { ok: true, alreadyProcessed: true, partnership: calculateSummary(part), milestone: ms, next_milestone: part.milestones[msIdx + 1] || null };
    }
    try { assertTransition(ms.status, 'completed'); } catch (e) { return { ok: false, error: e.message }; }
    if (!ms.completion_report) return { ok: false, error: 'Proof must be submitted before approval.' };

    ms.status = 'completed';
    ms.progress = 100;
    ms.lifecycle = { ...(ms.lifecycle || {}), completion: 'completed' };
    ms.completion_report.verified_by_investor = true;
    ms.completion_report.verified_at = new Date().toISOString();
    ms.completion_report.investor_notes = investor_notes || '';
    ms.completed_at = new Date().toISOString();

    let nextMs = null;
    if (msIdx + 1 < part.milestones.length) {
      nextMs = part.milestones[msIdx + 1];
      if (nextMs.status === 'locked') {
        try { assertTransition(nextMs.status, 'unlocked'); } catch (e) {}
        nextMs.status = 'unlocked';
        nextMs.lifecycle = { ...(nextMs.lifecycle || {}), requested: false, investor_review: 'pending' };
        appendActivity(part, { actor_role: 'system', event: 'milestone_activated', label: `${nextMs.name || nextMs.title} activated`, milestone_id: nextMs.id });
      }
    }

    appendActivity(part, { actor_role: 'investor', actor_id: actorId, event: 'milestone_approved', label: `Investor approved ${ms.name || ms.title}`, milestone_id: ms.id });
    const summary = calculateSummary(part);
    if (summary.transaction_status === 'completed') {
      part.completed_at = new Date().toISOString();
      appendActivity(part, { actor_role: 'system', event: 'transaction_completed', label: 'All required milestones completed' });
    }
    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms, next_milestone: nextMs };
  },

  flagMilestoneDispute(partnershipId, milestoneId, payload = {}) {
    const reason = typeof payload === 'string' ? payload : (payload.reason || '');
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };
    const ms = part.milestones.find((m) => m.id === milestoneId);
    if (!ms) return { ok: false, error: 'Milestone not found.' };
    if (['completed', 'cancelled'].includes(ms.status)) return { ok: false, error: 'This milestone cannot be disputed.' };

    ms.status = 'disputed';
    ms.dispute_reason = reason || 'Audit discrepancies reported.';
    ms.disputed_at = new Date().toISOString();
    part.frozen = true;
    part.dispute_id = payload.dispute_id || part.dispute_id;
    appendActivity(part, {
      actor_role: payload.initiator_role || 'investor',
      actor_id: payload.initiator_id || payload.actorId,
      event: 'dispute_opened',
      label: `Dispute opened: ${ms.dispute_reason}`,
      milestone_id: ms.id
    });
    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms };
  },

  clearFreeze(partnershipId, note = '') {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };
    part.frozen = false;
    part.milestones = (part.milestones || []).map((m) => {
      if (m.status === 'disputed') {
        const restored = m.release_details ? 'funded' : (m.request_details ? 'pending_review' : 'unlocked');
        return { ...m, status: restored };
      }
      return m;
    });
    appendActivity(part, { actor_role: 'admin', event: 'dispute_resolved', label: note || 'Admin resolved dispute — workflow resumed' });
    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part) };
  },

  assertParticipant(partnership, userId, role) {
    if (!canAccessTransaction(userId, partnership)) return false;
    if (role && participantRole(partnership, userId) !== role) return false;
    return true;
  }
};
