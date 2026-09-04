import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { fallbackProposals, fallbackCampaigns, fallbackUsers } from '../utils/storeUtils.js';

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

const calculateSummary = (p) => {
  const milestones = Array.isArray(p.milestones) ? p.milestones : [];
  const totalCommitted = Number(p.total_committed || 0);
  const amountReleased = milestones
    .filter((m) => m.status === 'completed' || m.status === 'funded')
    .reduce((sum, m) => sum + (Number(m.release_details?.approved_amount || m.amount) || 0), 0);
  const remainingInvestment = Math.max(0, totalCommitted - amountReleased);

  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const currentMilestone = milestones.find((m) => m.status === 'pending_review' || m.status === 'funded' || m.status === 'unlocked') || milestones[0];

  return {
    ...p,
    amount_released: amountReleased,
    remaining_investment: remainingInvestment,
    completed_milestones: completedMilestones,
    total_milestones: milestones.length,
    current_milestone: currentMilestone
  };
};

export const partnershipModel = {
  getAll() {
    return fallbackPartnerships.map(calculateSummary);
  },

  getByFounder(founderId) {
    const fid = String(founderId || '');
    return fallbackPartnerships
      .filter((p) => String(p.founder_id) === fid || fid === 'usr_founder_1')
      .map(calculateSummary);
  },

  getByInvestor(investorId) {
    const iid = String(investorId || '');
    return fallbackPartnerships
      .filter((p) => String(p.investor_id) === iid || iid === 'usr_investor_1')
      .map(calculateSummary);
  },

  getById(id) {
    const sid = String(id || '');
    const found = fallbackPartnerships.find((p) => p.id === sid);
    return found ? calculateSummary(found) : null;
  },

  createFromAcceptedProposal(proposal, campaign) {
    const existing = fallbackPartnerships.find((p) => p.proposal_id === proposal.id);
    if (existing) return calculateSummary(existing);

    const totalAmount = Number(proposal.amount || 10000);
    const trancheCount = 4;
    const trancheAmount = Math.round(totalAmount / trancheCount);

    const newPartnership = {
      id: 'part_' + Date.now(),
      proposal_id: proposal.id,
      campaign_id: campaign?.id || proposal.campaign_id,
      campaign_title: campaign?.title || proposal.campaign_title || 'Startup Partnership',
      roadmap_subtitle: `${campaign?.stage || 'Series A'} Roadmap • ৳ ${totalAmount.toLocaleString()} Aggregate`,
      contract_url: '#',
      founder_id: proposal.founder_id || campaign?.founder_id || 'usr_founder_1',
      founder_name: proposal.founder_name || campaign?.founder?.name || 'Student Founder',
      founder_email: campaign?.founder?.email || '',
      founder_university: campaign?.university || 'University',
      investor_id: proposal.investor_id || 'usr_investor_1',
      investor_name: proposal.investor_name || 'Angel Backer',
      investor_institution: 'Angel Syndicate',
      total_committed: totalAmount,
      created_at: new Date().toISOString(),
      milestones: [
        {
          id: 'phase_1',
          phase_number: 1,
          title: 'PHASE 1',
          name: 'Phase 1: Prototype & Initial Production',
          amount: trancheAmount,
          purpose: 'Purchase raw materials and start initial production',
          expected_outcome: 'Produce the first 100 functional units',
          timeline: '1 Month',
          status: 'unlocked',
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
          id: 'phase_2',
          phase_number: 2,
          title: 'PHASE 2',
          name: 'Phase 2: R&D Installation & Testing',
          amount: trancheAmount,
          purpose: 'Equipment installation and lab testing',
          expected_outcome: 'Operational certified batch facility',
          timeline: '2 Months',
          status: 'locked',
          lifecycle: { requested: false, investor_review: 'locked', payment: 'locked', completion: 'locked' },
          request_details: null,
          mandatory_checks: { vendor_invoice_reconciliation: false, geotagged_photo_verification: false, third_party_inspector_attestation: false },
          release_details: null,
          completion_report: null
        },
        {
          id: 'phase_3',
          phase_number: 3,
          title: 'PHASE 3',
          name: 'Phase 3: Production Scaling & Operations',
          amount: trancheAmount,
          purpose: 'Scale up manufacturing and inventory buffers',
          expected_outcome: '500 units monthly run-rate',
          timeline: '3 Months',
          status: 'locked',
          lifecycle: { requested: false, investor_review: 'locked', payment: 'locked', completion: 'locked' },
          request_details: null,
          mandatory_checks: { vendor_invoice_reconciliation: false, geotagged_photo_verification: false, third_party_inspector_attestation: false },
          release_details: null,
          completion_report: null
        },
        {
          id: 'phase_4',
          phase_number: 4,
          title: 'EXIT',
          name: 'Exit & Retail Distribution',
          amount: totalAmount - (trancheAmount * 3),
          purpose: 'Commercial rollout and subscriber traction',
          expected_outcome: 'Break-even revenue milestone',
          timeline: '6 Months',
          status: 'locked',
          lifecycle: { requested: false, investor_review: 'locked', payment: 'locked', completion: 'locked' },
          request_details: null,
          mandatory_checks: { vendor_invoice_reconciliation: false, geotagged_photo_verification: false, third_party_inspector_attestation: false },
          release_details: null,
          completion_report: null
        }
      ]
    };

    fallbackPartnerships.unshift(newPartnership);
    persistS3Partnerships();
    return calculateSummary(newPartnership);
  },

  requestMilestoneFunding(partnershipId, milestoneId, requestData) {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };

    const ms = part.milestones.find((m) => m.id === milestoneId);
    if (!ms) return { ok: false, error: 'Milestone not found in partnership roadmap.' };

    if (ms.status !== 'unlocked' && ms.status !== 'pending_review') {
      return { ok: false, error: `Milestone is currently ${ms.status} and cannot be requested.` };
    }

    ms.status = 'pending_review';
    ms.lifecycle.requested = true;
    ms.lifecycle.investor_review = 'pending';

    const reqAmt = Number(requestData.requested_amount || requestData.amount || ms.amount);
    ms.amount = reqAmt;
    ms.purpose = requestData.purpose || ms.purpose;
    ms.expected_outcome = requestData.expected_outcome || ms.expected_outcome;
    ms.timeline = requestData.timeline || ms.timeline;

    ms.request_details = {
      requested_amount: reqAmt,
      purpose: requestData.purpose || ms.purpose,
      explanation: requestData.explanation || 'Funds allocated for designated milestone deliverables.',
      fund_usage: requestData.fund_usage || 'Hardware procurement, labor, and materials.',
      expected_outcome: requestData.expected_outcome || ms.expected_outcome,
      timeline: requestData.timeline || ms.timeline,
      supporting_documents: Array.isArray(requestData.supporting_documents) ? requestData.supporting_documents : [
        {
          name: requestData.doc_name || `Invoice_${ms.title}.pdf`,
          url: requestData.doc_url || '/uploads/sample_invoice.pdf',
          vendor_name: requestData.vendor_name || 'Verified Vendor Supplies Ltd.',
          invoice_number: `#INV-${Date.now().toString().slice(-4)}`,
          total_payable: reqAmt,
          items: [
            { item: `${ms.purpose || 'Milestone Supplies'}`, amount: reqAmt }
          ]
        }
      ],
      requested_at: new Date().toISOString()
    };

    if (requestData.mandatory_checks) {
      ms.mandatory_checks = { ...ms.mandatory_checks, ...requestData.mandatory_checks };
    }

    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms };
  },

  releaseMilestoneFunding(partnershipId, milestoneId, releaseData) {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };

    const ms = part.milestones.find((m) => m.id === milestoneId);
    if (!ms) return { ok: false, error: 'Milestone not found in partnership roadmap.' };

    if (ms.status !== 'pending_review' && ms.status !== 'unlocked') {
      return { ok: false, error: 'Milestone is not in pending review state.' };
    }

    ms.status = 'funded';
    ms.lifecycle.investor_review = 'approved';
    ms.lifecycle.payment = 'funded';
    ms.lifecycle.completion = 'in_progress';

    const refId = releaseData.reference_id || `TRX-MFS-${Math.floor(100000 + Math.random() * 900000)}`;
    const approvedAmount = Number(releaseData.approved_amount || ms.request_details?.requested_amount || ms.amount);

    ms.release_details = {
      approved_amount: approvedAmount,
      funded_date: new Date().toISOString().split('T')[0],
      reference_id: refId,
      payment_method: releaseData.payment_method || 'Secured MFS / Bank Escrow Transfer'
    };

    if (releaseData.mandatory_checks) {
      ms.mandatory_checks = { ...ms.mandatory_checks, ...releaseData.mandatory_checks };
    }

    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms };
  },

  submitMilestoneCompletion(partnershipId, milestoneId, reportData) {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };

    const ms = part.milestones.find((m) => m.id === milestoneId);
    if (!ms) return { ok: false, error: 'Milestone not found.' };

    if (ms.status !== 'funded') {
      return { ok: false, error: 'Only funded milestones in progress can submit completion reports.' };
    }

    ms.completion_report = {
      completed_objectives: reportData.completed_objectives || 'All phase requirements completed.',
      amount_spent: Number(reportData.amount_spent || ms.release_details?.approved_amount || ms.amount),
      remaining_amount: Number(reportData.remaining_amount || 0),
      progress_description: reportData.progress_description || 'Deliverables verified and operational.',
      business_results: reportData.business_results || 'Met planned performance metric milestones.',
      media_urls: Array.isArray(reportData.media_urls) ? reportData.media_urls : [],
      submitted_at: new Date().toISOString(),
      verified_by_investor: false
    };

    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms };
  },

  verifyMilestoneCompletion(partnershipId, milestoneId) {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };

    const msIdx = part.milestones.findIndex((m) => m.id === milestoneId);
    if (msIdx === -1) return { ok: false, error: 'Milestone not found.' };

    const ms = part.milestones[msIdx];
    ms.status = 'completed';
    ms.lifecycle.completion = 'completed';
    if (!ms.completion_report) {
      ms.completion_report = { completed_objectives: 'Verified by investor', submitted_at: new Date().toISOString() };
    }
    ms.completion_report.verified_by_investor = true;
    ms.completion_report.verified_at = new Date().toISOString();

    // UNLOCK NEXT MILESTONE!
    if (msIdx + 1 < part.milestones.length) {
      const nextMs = part.milestones[msIdx + 1];
      if (nextMs.status === 'locked') {
        nextMs.status = 'unlocked';
        nextMs.lifecycle.requested = false;
        nextMs.lifecycle.investor_review = 'pending';
      }
    }

    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms };
  },

  flagMilestoneDispute(partnershipId, milestoneId, reason) {
    const part = fallbackPartnerships.find((p) => p.id === partnershipId);
    if (!part) return { ok: false, error: 'Partnership not found.' };

    const ms = part.milestones.find((m) => m.id === milestoneId);
    if (!ms) return { ok: false, error: 'Milestone not found.' };

    ms.status = 'disputed';
    ms.dispute_reason = reason || 'Audit discrepancies reported by investor.';
    ms.disputed_at = new Date().toISOString();

    persistS3Partnerships();
    return { ok: true, partnership: calculateSummary(part), milestone: ms };
  }
};
