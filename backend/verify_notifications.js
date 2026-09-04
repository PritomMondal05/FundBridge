import { createAndDispatchNotification, fallbackNotifications } from './utils/storeUtils.js';
import { NOTIFICATION_TYPES } from './lib/notificationTypes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const storePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 's3_notifications.json');
const snapshot = fs.existsSync(storePath) ? fs.readFileSync(storePath, 'utf8') : null;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  const a = await createAndDispatchNotification('usr_investor_1', 'Proposal accepted', 'Test', NOTIFICATION_TYPES.PROPOSAL_ACCEPTED, {
    eventKey: 'verify_proposal_accepted_once',
    linkUrl: 'tab:portfolio'
  });
  const b = await createAndDispatchNotification('usr_investor_1', 'Proposal accepted', 'Test', NOTIFICATION_TYPES.PROPOSAL_ACCEPTED, {
    eventKey: 'verify_proposal_accepted_once',
    linkUrl: 'tab:portfolio'
  });
  assert(a && a.id, 'create failed');
  assert(a.id === b.id, 'event_key must be idempotent');
  assert(a.link_url === 'tab:portfolio', 'link_url missing');
  const leaked = fallbackNotifications.filter((n) => n.user_id === 'usr_founder_2' && n.event_key === 'verify_proposal_accepted_once');
  assert(leaked.length === 0, 'notification leaked to another user');
  console.log('NOTIFICATION_VERIFY_OK', { id: a.id, type: a.type });
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  if (snapshot != null) fs.writeFileSync(storePath, snapshot, 'utf8');
  else if (fs.existsSync(storePath)) {
    const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    const cleaned = parsed.filter((n) => n.event_key !== 'verify_proposal_accepted_once');
    fs.writeFileSync(storePath, JSON.stringify(cleaned, null, 2), 'utf8');
  }
}
