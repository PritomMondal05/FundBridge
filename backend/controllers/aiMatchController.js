// Controller layer: translates HTTP requests into service calls, and
// service results into HTTP responses. No Gemini logic lives here —
// that's the service's job. This separation means you could reuse
// getInvestorMatches() from a future feature (a cron job, a CLI script)
// without dragging Express along with it.

import { getInvestorMatches, getFounderMatches } from '../services/aiMatchmakingService.js';

export async function investorMatchesHandler(req, res) {
  try {
    const { investorId } = req.params;
    const result = await getInvestorMatches(investorId);
    res.status(200).json({
      matches: result.matches || result,
      source: result.source || 'gemini',
      count: Array.isArray(result.matches || result) ? (result.matches || result).length : 0
    });
  } catch (err) {
    console.error('\n🔴🔴🔴 AI MATCH ERROR 🔴🔴🔴');
    console.error(err);
    console.error('🔴🔴🔴 END ERROR 🔴🔴🔴\n');
    res.status(500).json({ error: 'Failed to generate investor matches.' });
  }
}

export async function founderMatchesHandler(req, res) {
  try {
    const { campaignId } = req.params;
    const result = await getFounderMatches(campaignId);
    res.status(200).json({
      matches: result.matches || result,
      source: result.source || 'gemini',
      count: Array.isArray(result.matches || result) ? (result.matches || result).length : 0
    });
  } catch (err) {
    console.error('\n🔴🔴🔴 AI MATCH ERROR 🔴🔴🔴');
    console.error(err);
    console.error('🔴🔴🔴 END ERROR 🔴🔴🔴\n');
    res.status(500).json({ error: 'Failed to generate founder matches.' });
  }
}