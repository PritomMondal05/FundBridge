import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertTransition, canAccessTransaction, canTransitionMilestone, participantRole } from './lib/milestoneState.js';
import { partnershipModel } from './models/partnershipModel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.join(__dirname, 's3_partnership_milestones.json');
const snapshot = fs.existsSync(storePath) ? fs.readFileSync(storePath, 'utf8') : null;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  assert(canTransitionMilestone('unlocked', 'pending_review'), 'request transition');
  assert(!canTransitionMilestone('unlocked', 'completed'), 'founder cannot self-complete');
  assert(canTransitionMilestone('proof_submitted', 'completed'), 'verify transition');
  assert(canTransitionMilestone('proof_submitted', 'revision_requested'), 'revise transition');
  try {
    assertTransition('completed', 'unlocked');
    throw new Error('completed reopen should fail');
  } catch (e) {
    assert(e.code === 'INVALID_TRANSITION', 'completed cannot reopen');
  }

  const demo = partnershipModel.getById('part_alphav_01');
  assert(demo, 'seed partnership exists');
  assert(participantRole(demo, 'usr_founder_1') === 'founder', 'founder participant');
  assert(participantRole(demo, 'usr_investor_1') === 'investor', 'investor participant');
  assert(!canAccessTransaction('usr_founder_2', demo), 'other founder denied');
  assert(!canAccessTransaction('usr_investor_2', demo), 'other investor denied');
  assert(partnershipModel.getByFounder('usr_founder_2').length === 0, 'founder list must not leak');

  const phase = (demo.milestones || []).find((m) => m.status === 'pending_review') || demo.milestones.find((m) => m.id === 'phase_2');
  assert(phase, 'test milestone exists');
  const release1 = partnershipModel.releaseMilestoneFunding(demo.id, phase.id, { actorId: 'usr_investor_1' });
  assert(release1.ok, release1.error || 'first release');
  const release2 = partnershipModel.releaseMilestoneFunding(demo.id, phase.id, { actorId: 'usr_investor_1' });
  assert(release2.alreadyProcessed === true, 'second release must be idempotent');
  const founderRelease = partnershipModel.assertParticipant(demo, 'usr_founder_1', 'investor');
  assert(founderRelease === false, 'founder is not investor');

  console.log('MILESTONE_TRACKER_VERIFY_OK', {
    health: partnershipModel.getById(demo.id).health,
    progress: partnershipModel.getById(demo.id).overall_progress
  });
} finally {
  if (snapshot != null) fs.writeFileSync(storePath, snapshot, 'utf8');
}
