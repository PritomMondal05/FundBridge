import {
  generateCampaignDescription,
  generateFounderBio,
  improveCampaignDescription,
  improveFounderBio,
  requireInvestor
} from '../services/aiOptimizationService.js';
import { getWhatsBurning } from '../services/investmentTrendsService.js';
import { consumeRateLimit, rateLimitHeaders } from '../lib/aiRateLimit.js';

function sendError(res, err, fallbackMessage) {
  const status = err?.status || (/not found/i.test(err?.message || '') ? 404 : 500);
  console.error('AI OPTIMIZATION ERROR:', err);
  res.status(status).json({ error: err?.status ? err.message : fallbackMessage });
}

function applyLimit(req, res, key, options) {
  const result = consumeRateLimit(key, options);
  const headers = rateLimitHeaders(result);
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  if (!result.allowed) {
    res.status(429).json({ error: 'Too many AI requests. Please wait a few minutes and try again.' });
    return false;
  }
  return true;
}

function founderIdFrom(req) {
  return req.body?.founderId || req.body?.userId || req.query?.founderId || req.query?.userId;
}

export async function generateBioHandler(req, res) {
  try {
    const founderId = founderIdFrom(req);
    if (!founderId) return res.status(400).json({ error: 'founderId is required.' });
    if (!applyLimit(req, res, `bio:${founderId}`)) return;
    const result = await generateFounderBio({ founderId, extras: req.body || {} });
    res.status(200).json(result);
  } catch (err) {
    sendError(res, err, 'Failed to generate founder bio.');
  }
}

export async function improveBioHandler(req, res) {
  try {
    const founderId = founderIdFrom(req);
    if (!founderId) return res.status(400).json({ error: 'founderId is required.' });
    if (!applyLimit(req, res, `bio:${founderId}`)) return;
    const result = await improveFounderBio({
      founderId,
      extras: { ...(req.body || {}), existingBio: req.body?.existingBio || req.body?.bio }
    });
    res.status(200).json(result);
  } catch (err) {
    sendError(res, err, 'Failed to improve founder bio.');
  }
}

export async function generateCampaignHandler(req, res) {
  try {
    const founderId = founderIdFrom(req);
    if (!founderId) return res.status(400).json({ error: 'founderId is required.' });
    if (!applyLimit(req, res, `campaign:${founderId}`)) return;
    const result = await generateCampaignDescription({
      founderId,
      campaignId: req.body?.campaignId,
      draft: req.body?.draft || req.body || {}
    });
    res.status(200).json(result);
  } catch (err) {
    sendError(res, err, 'Failed to generate campaign description.');
  }
}

export async function improveCampaignHandler(req, res) {
  try {
    const founderId = founderIdFrom(req);
    if (!founderId) return res.status(400).json({ error: 'founderId is required.' });
    if (!applyLimit(req, res, `campaign:${founderId}`)) return;
    const result = await improveCampaignDescription({
      founderId,
      campaignId: req.body?.campaignId,
      draft: { ...(req.body?.draft || req.body || {}), description: req.body?.existingDescription || req.body?.description || req.body?.draft?.description }
    });
    res.status(200).json(result);
  } catch (err) {
    sendError(res, err, 'Failed to improve campaign description.');
  }
}

export async function whatsBurningHandler(req, res) {
  try {
    const investorId = req.query.investorId || req.query.userId;
    if (!investorId) return res.status(400).json({ error: 'investorId is required.' });
    if (!applyLimit(req, res, `trends:${investorId}`, { limit: 40, windowMs: 15 * 60 * 1000 })) return;
    await requireInvestor(investorId);
    const result = await getWhatsBurning({
      investorId,
      force: String(req.query.refresh || '') === '1'
    });
    res.status(200).json(result);
  } catch (err) {
    sendError(res, err, 'Failed to load investment trends.');
  }
}

export async function legacyGenerateHandler(req, res) {
  try {
    const action = req.body?.action;
    const founderId = founderIdFrom(req);
    if (action === 'pitch_bio' || action === 'slogan' || action === 'business_summary') {
      if (!founderId) return res.status(400).json({ error: 'founderId is required.' });
      if (!applyLimit(req, res, `legacy:${founderId}`)) return;
      const result = await generateCampaignDescription({
        founderId,
        campaignId: req.body?.campaignId,
        draft: req.body || {}
      });
      return res.status(200).json({
        bio: result.content,
        slogan: result.suggestions?.[0] || '',
        summary: result.content,
        type: result.type,
        content: result.content,
        suggestions: result.suggestions,
        source: result.source
      });
    }
    res.status(400).json({ error: 'Unsupported AI action. Use the founder bio/campaign or whats-burning endpoints.' });
  } catch (err) {
    sendError(res, err, 'AI generation failed.');
  }
}
