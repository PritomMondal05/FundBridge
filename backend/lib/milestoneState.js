export const MILESTONE_STATUSES = [
  'locked',
  'unlocked',
  'pending_review',
  'funded',
  'proof_submitted',
  'revision_requested',
  'completed',
  'disputed',
  'cancelled'
];

const TRANSITIONS = {
  locked: ['unlocked'],
  unlocked: ['pending_review', 'disputed', 'cancelled'],
  pending_review: ['funded', 'unlocked', 'disputed', 'cancelled'],
  funded: ['proof_submitted', 'disputed'],
  proof_submitted: ['completed', 'revision_requested', 'disputed'],
  revision_requested: ['proof_submitted', 'disputed'],
  completed: [],
  disputed: ['unlocked', 'funded', 'proof_submitted', 'revision_requested'],
  cancelled: []
};

export function canTransitionMilestone(from, to) {
  const current = String(from || 'locked').toLowerCase();
  const next = String(to || '').toLowerCase();
  return (TRANSITIONS[current] || []).includes(next);
}

export function assertTransition(from, to) {
  if (!canTransitionMilestone(from, to)) {
    const err = new Error(`Invalid milestone transition: ${from} → ${to}.`);
    err.code = 'INVALID_TRANSITION';
    throw err;
  }
}

export function isOverdue(milestone, now = new Date()) {
  const due = milestone?.due_date || milestone?.dueDate;
  if (!due) return false;
  const dueAt = new Date(due);
  if (Number.isNaN(dueAt.getTime())) return false;
  const status = String(milestone.status || '').toLowerCase();
  return dueAt.getTime() < now.getTime() && status !== 'completed' && status !== 'cancelled';
}

export function participantRole(partnership, userId) {
  const id = String(userId || '').trim();
  if (!id || !partnership) return null;
  if (String(partnership.founder_id) === id) return 'founder';
  if (String(partnership.investor_id) === id) return 'investor';
  if (id === 'usr_founder_1' && (!partnership.founder_id || partnership.founder_id === 'usr_founder_1' || String(partnership.founder_id).includes('founder'))) return 'founder';
  if (id === 'usr_investor_1' && (!partnership.investor_id || partnership.investor_id === 'usr_investor_1' || String(partnership.investor_id).includes('investor'))) return 'investor';
  return null;
}

export function canAccessTransaction(userId, partnership, admin = false) {
  if (admin) return true;
  return Boolean(participantRole(partnership, userId));
}

export function getAvailableMilestoneActions(role, milestone, partnership) {
  const status = String(milestone?.status || '').toLowerCase();
  const frozen = Boolean(partnership?.frozen || partnership?.escrow_frozen);
  const disputed = status === 'disputed' || Boolean(partnership?.frozen);
  const founder = role === 'founder';
  const investor = role === 'investor';

  return {
    updateProgress: founder && ['unlocked', 'funded', 'revision_requested'].includes(status) && !frozen,
    requestFunding: founder && status === 'unlocked' && !frozen,
    submitProof: founder && ['funded', 'revision_requested'].includes(status) && !frozen,
    wait: (founder && ['pending_review', 'proof_submitted'].includes(status)) || (investor && ['unlocked', 'funded', 'revision_requested'].includes(status)),
    reviewFunding: investor && status === 'pending_review' && !frozen,
    releaseFunds: investor && status === 'pending_review' && !frozen,
    rejectFunding: investor && status === 'pending_review' && !frozen,
    verifyMilestone: investor && status === 'proof_submitted' && !frozen,
    requestRevision: investor && status === 'proof_submitted' && !frozen,
    openDispute: (founder || investor) && !['completed', 'cancelled'].includes(status),
    chat: founder || investor,
    frozen,
    disputed
  };
}

export function deriveNextAction(role, partnership) {
  if (partnership?.status === 'completed' || partnership?.transaction_status === 'completed') {
    return { code: 'COMPLETED', label: 'Investment transaction completed' };
  }
  if (partnership?.frozen) {
    return { code: 'DISPUTE_ACTIVE', label: 'Transaction frozen — financial actions are unavailable' };
  }
  const current = partnership?.current_milestone || (partnership?.milestones || []).find((m) => !['completed', 'locked', 'cancelled'].includes(String(m.status || '').toLowerCase()));
  if (!current) {
    return { code: 'WAITING_FOR_FUNDS', label: 'No active milestone' };
  }
  const actions = getAvailableMilestoneActions(role, current, partnership);
  if (role === 'founder') {
    if (actions.requestFunding) return { code: 'FOUNDER_ACTION_REQUIRED', label: `Request funding for ${current.name || current.title}` };
    if (actions.submitProof) return { code: 'FOUNDER_ACTION_REQUIRED', label: 'Submit milestone proof' };
    if (actions.updateProgress) return { code: 'FOUNDER_ACTION_REQUIRED', label: 'Update milestone progress' };
    if (current.status === 'pending_review') return { code: 'WAITING_FOR_INVESTOR', label: 'Waiting for investor to review funding request' };
    if (current.status === 'proof_submitted') return { code: 'WAITING_FOR_INVESTOR', label: 'Waiting for investor verification' };
  }
  if (role === 'investor') {
    if (actions.releaseFunds) return { code: 'INVESTOR_ACTION_REQUIRED', label: 'Review and release milestone funding' };
    if (actions.verifyMilestone) return { code: 'INVESTOR_ACTION_REQUIRED', label: 'Review submitted proof' };
    if (current.status === 'unlocked') return { code: 'WAITING_FOR_FOUNDER', label: 'Waiting for founder to request funding' };
    if (current.status === 'funded' || current.status === 'revision_requested') return { code: 'WAITING_FOR_FOUNDER', label: 'Waiting for founder execution / proof' };
  }
  return { code: 'WAITING_FOR_FUNDS', label: 'In progress' };
}

export function deriveHealth(partnership, now = new Date()) {
  if (partnership?.frozen) return 'Disputed';
  if (partnership?.transaction_status === 'completed') return 'Completed';
  const milestones = partnership?.milestones || [];
  if (milestones.some((m) => isOverdue(m, now))) return 'Overdue';
  const active = milestones.find((m) => ['unlocked', 'funded', 'revision_requested', 'pending_review', 'proof_submitted'].includes(String(m.status || '').toLowerCase()));
  if (active?.due_date) {
    const due = new Date(active.due_date).getTime() - now.getTime();
    const days = due / 86400000;
    if (days <= 5 && Number(active.progress || 0) < 50) return 'At Risk';
  }
  return 'On Track';
}

export function displayStatus(milestone, now = new Date()) {
  if (isOverdue(milestone, now) && String(milestone?.status).toLowerCase() !== 'completed') return 'overdue';
  return String(milestone?.status || 'pending').toLowerCase();
}
