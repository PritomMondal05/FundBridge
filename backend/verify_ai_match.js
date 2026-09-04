import { getInvestorMatches, getFounderMatches } from './services/aiMatchmakingService.js';

async function verify() {
  try {
    const investor = await getInvestorMatches('usr_investor_1');
    console.log('INVESTOR_MATCHES_SOURCE', investor.source);
    console.log('INVESTOR_MATCHES_COUNT', investor.matches.length);
    console.log('INVESTOR_MATCHES_SAMPLE', JSON.stringify(investor.matches.slice(0, 2)));

    const founder = await getFounderMatches('agrisense');
    console.log('FOUNDER_MATCHES_SOURCE', founder.source);
    console.log('FOUNDER_MATCHES_COUNT', founder.matches.length);
    console.log('FOUNDER_MATCHES_SAMPLE', JSON.stringify(founder.matches.slice(0, 2)));
  } catch (err) {
    console.error('AI_MATCH_VERIFY_FAILED');
    console.error(err);
    process.exit(1);
  }
}

verify();
