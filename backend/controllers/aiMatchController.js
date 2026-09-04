import { getInvestorMatches, getFounderMatches, getFounderMatchesForUser } from '../services/aiMatchmakingService.js';

function sendError(res, err, fallbackMessage) {
  const message = err?.message || fallbackMessage;
  const notFound = /not found/i.test(message);
  console.error('AI MATCH ERROR:', err);
  res.status(notFound ? 404 : 500).json({ error: notFound ? message : fallbackMessage });
}

export async function investorMatchesHandler(req, res) {
  try {
    const { investorId } = req.params;
    if (!investorId) return res.status(400).json({ error: 'investorId is required.' });
    const result = await getInvestorMatches(investorId);
    const matches = result.matches || [];
    res.status(200).json({
      matches,
      source: result.source || 'heuristic',
      count: matches.length,
      profileIncomplete: Boolean(result.profileIncomplete)
    });
  } catch (err) {
    sendError(res, err, 'Failed to generate investor matches.');
  }
}

export async function founderMatchesHandler(req, res) {
  try {
    const { campaignId } = req.params;
    if (!campaignId) return res.status(400).json({ error: 'campaignId is required.' });
    const result = await getFounderMatches(campaignId);
    const matches = result.matches || [];
    res.status(200).json({
      matches,
      source: result.source || 'heuristic',
      count: matches.length,
      campaign: result.campaign || null
    });
  } catch (err) {
    sendError(res, err, 'Failed to generate founder matches.');
  }
}

export async function founderUserMatchesHandler(req, res) {
  try {
    const { founderId } = req.params;
    if (!founderId) return res.status(400).json({ error: 'founderId is required.' });
    const result = await getFounderMatchesForUser(founderId);
    const matches = result.matches || [];
    res.status(200).json({
      matches,
      source: result.source || 'heuristic',
      count: matches.length,
      campaign: result.campaign || null,
      needsCampaign: Boolean(result.needsCampaign)
    });
  } catch (err) {
    sendError(res, err, 'Failed to generate founder matches.');
  }
}
