import { consumeRateLimit } from './lib/aiRateLimit.js';
import { isSafeHttpUrl, sanitizeText, stripHtml } from './lib/aiSanitize.js';
import { generateFounderBio, requireInvestor } from './services/aiOptimizationService.js';
import { getWhatsBurning } from './services/investmentTrendsService.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const html = stripHtml('<p>Hello <script>alert(1)</script>world</p>');
assert(html === 'Hello world', 'HTML sanitizer failed');
assert(sanitizeText('x'.repeat(50), 10) === 'xxxxxxxxxx', 'Text clamp failed');
assert(isSafeHttpUrl('https://techcrunch.com/x') === true, 'HTTPS URL should be allowed');
assert(isSafeHttpUrl('javascript:alert(1)') === false, 'javascript URLs must be rejected');

const first = consumeRateLimit('verify-key', { limit: 2, windowMs: 60_000 });
const second = consumeRateLimit('verify-key', { limit: 2, windowMs: 60_000 });
const third = consumeRateLimit('verify-key', { limit: 2, windowMs: 60_000 });
assert(first.allowed && second.allowed && !third.allowed, 'Rate limiter did not block the third call');

try {
  await generateFounderBio({ founderId: 'missing_user_xyz' });
  throw new Error('Missing founder should fail');
} catch (err) {
  assert(err.status === 404 || /not found/i.test(err.message), 'Missing founder did not 404');
}

try {
  await requireInvestor('usr_founder_1');
  throw new Error('Founder should not pass investor authorization');
} catch (err) {
  assert(err.status === 403 || err.status === 404, 'Investor authorization did not reject founder id');
}

const trends = await getWhatsBurning({ investorId: 'usr_investor_1' });
assert(['ok', 'empty', 'unconfigured'].includes(trends.status), `Unexpected trend status: ${trends.status}`);
if (trends.trends.length) {
  assert(trends.trends.every((item) => item.title && item.summary), 'Trend cards missing required fields');
  assert(trends.trends.every((item) => !item.sourceUrl || isSafeHttpUrl(item.sourceUrl)), 'Unsafe trend URL leaked');
}

console.log('AI_OPTIMIZATION_VERIFY_OK', {
  trendStatus: trends.status,
  trendCount: trends.trends.length,
  trendSource: trends.source
});
