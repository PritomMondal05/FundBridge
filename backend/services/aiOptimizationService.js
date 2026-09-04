import { callGeminiForJSON, isGeminiConfigured } from '../lib/geminiClient.js';
import { sanitizeStringArray, sanitizeText } from '../lib/aiSanitize.js';
import { loadCampaignRecord, loadCampaignsForFounder, loadInvestorRecord, loadLocalUsers } from '../lib/matchCatalog.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';

const contentSchema = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    content: { type: 'string' },
    suggestions: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['type', 'content']
};

const BIO_MAX = 900;
const CAMPAIGN_MAX = 1800;
const NOTE_MAX = 500;

function compact(value, max = 400) {
  return sanitizeText(value, max);
}

function roleOf(user) {
  return String(user?.role || '').toLowerCase();
}

export async function loadFounderRecord(founderId) {
  const id = String(founderId || '').trim();
  if (!id) return null;
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, university, department, bio, role, vetting_status')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) return data;
  }
  return loadLocalUsers().find((u) => String(u.id) === id && roleOf(u) === 'founder')
    || loadLocalUsers().find((u) => String(u.id) === id)
    || null;
}

async function requireFounder(founderId) {
  const founder = await loadFounderRecord(founderId);
  if (!founder) {
    const err = new Error('Founder account not found.');
    err.status = 404;
    throw err;
  }
  if (roleOf(founder) && roleOf(founder) !== 'founder') {
    const err = new Error('Founder AI tools are only available to founder accounts.');
    err.status = 403;
    throw err;
  }
  return founder;
}

export async function requireInvestor(investorId) {
  const investor = await loadInvestorRecord(investorId);
  if (!investor) {
    const err = new Error('Investor account not found.');
    err.status = 404;
    throw err;
  }
  if (roleOf(investor) && roleOf(investor) !== 'investor') {
    const err = new Error('Investor intelligence is only available to investor accounts.');
    err.status = 403;
    throw err;
  }
  return investor;
}

function founderFacts(founder, extra = {}, campaignHint = null) {
  return {
    name: compact(extra.name || founder.name, 80),
    role: compact(extra.role || 'Founder', 80),
    university: compact(extra.university || founder.university, 80),
    department: compact(extra.department || founder.department, 80),
    startup: compact(extra.startup || campaignHint?.title, 80),
    industry: compact(extra.industry || campaignHint?.category, 80),
    experience: compact(extra.experience, NOTE_MAX),
    skills: compact(extra.skills, NOTE_MAX),
    achievements: compact(extra.achievements, NOTE_MAX),
    mission: compact(extra.mission, NOTE_MAX),
    existingBio: compact(extra.existingBio || extra.bio || founder.bio, BIO_MAX)
  };
}

function campaignFacts(campaign = {}, draft = {}) {
  return {
    startupName: compact(draft.title || campaign.title, 80),
    university: compact(draft.university || campaign.university, 80),
    location: compact(draft.location || campaign.location, 80),
    industry: compact(draft.category || campaign.category, 80),
    stage: compact(draft.stage || campaign.stage, 80),
    tagline: compact(draft.tagline || campaign.tagline, 180),
    problem: compact(draft.problem, NOTE_MAX),
    solution: compact(draft.solution, NOTE_MAX),
    product: compact(draft.product, NOTE_MAX),
    targetAudience: compact(draft.targetAudience, NOTE_MAX),
    businessModel: compact(draft.businessModel || campaign.revenue_structure || campaign.operational_model, 180),
    fundingRequirement: compact(draft.fundingRequirement || draft.equityOffer || campaign.equity_offer, 120),
    fundingGoal: Number(draft.goal || campaign.goal || 0) || null,
    existingDescription: compact(draft.description || campaign.description, CAMPAIGN_MAX)
  };
}

function missingFactsMessage(kind, facts) {
  if (kind === 'bio') {
    const hasIdentity = Boolean(facts.name || facts.university || facts.startup || facts.experience || facts.existingBio);
    if (!hasIdentity) return 'Add a name, university, startup, or a few facts before generating a bio. The assistant will not invent missing details.';
  }
  if (kind === 'campaign') {
    const hasIdentity = Boolean(facts.startupName || facts.existingDescription || facts.problem || facts.solution || facts.tagline);
    if (!hasIdentity) return 'Add a startup name, tagline, or problem/solution notes before generating a campaign description.';
  }
  return '';
}

function validateContent(parsed, expectedType, maxLength) {
  if (!parsed || typeof parsed !== 'object') return null;
  const content = sanitizeText(parsed.content, maxLength);
  if (!content) return null;
  return {
    type: expectedType,
    content,
    suggestions: sanitizeStringArray(parsed.suggestions)
  };
}

const FACT_RULES = `
HARD RULES:
- Use only the supplied facts. If a field is empty or "unspecified", omit it.
- Do not invent revenue, funding, investors, customers, awards, metrics, partnerships, credentials, traction, valuation, or market share.
- Do not exaggerate. Keep a professional, investor-facing tone.
- Do not include private identifiers, emails, phone numbers, or document IDs.
- Return JSON with type, content, and optional short suggestions (editing tips, not new facts).
`.trim();

async function runContentJob({ kind, mode, facts, maxLength }) {
  if (!isGeminiConfigured()) {
    const err = new Error('The AI Optimization Engine is not configured. Set GEMINI_API_KEY on the server.');
    err.status = 503;
    throw err;
  }

  const missing = missingFactsMessage(kind, facts);
  if (missing) {
    const err = new Error(missing);
    err.status = 400;
    throw err;
  }

  const expectedType = kind;
  const prompt = `
You are the FundBridge AI Optimization Engine. Write investor-facing ${kind === 'bio' ? 'founder biography' : 'campaign description'} copy for a student entrepreneurship platform in Bangladesh.

MODE: ${mode}
${FACT_RULES}

${kind === 'bio' ? 'Write 90-160 words in first person or concise third person, suitable for a public founder profile.' : 'Write 140-240 words covering problem, what the startup does, why it matters, target market, and the opportunity — only when those facts are supplied.'}

SUPPLIED FACTS (JSON):
${JSON.stringify(facts)}
`.trim();

  let parsed;
  try {
    parsed = await callGeminiForJSON(prompt, contentSchema);
  } catch (err) {
    const wrapped = new Error('AI generation failed. Your original text was not changed.');
    wrapped.status = 502;
    wrapped.cause = err;
    throw wrapped;
  }

  const validated = validateContent(parsed, expectedType, maxLength);
  if (!validated) {
    const err = new Error('The AI returned an unusable response. Please try again. Your original text was not changed.');
    err.status = 502;
    throw err;
  }
  return { ...validated, source: 'gemini' };
}

export async function generateFounderBio({ founderId, extras = {} }) {
  const founder = await requireFounder(founderId);
  const campaigns = await loadCampaignsForFounder(founderId);
  const facts = founderFacts(founder, extras, campaigns[0]);
  return runContentJob({ kind: 'bio', mode: 'generate', facts, maxLength: BIO_MAX });
}

export async function improveFounderBio({ founderId, extras = {} }) {
  const founder = await requireFounder(founderId);
  const campaigns = await loadCampaignsForFounder(founderId);
  const facts = founderFacts(founder, extras, campaigns[0]);
  if (!facts.existingBio) {
    const err = new Error('Add a bio first, or use Generate with AI.');
    err.status = 400;
    throw err;
  }
  return runContentJob({ kind: 'bio', mode: 'improve existing bio; preserve every factual claim; improve clarity, structure, professionalism, and concision', facts, maxLength: BIO_MAX });
}

export async function generateCampaignDescription({ founderId, campaignId, draft = {} }) {
  await requireFounder(founderId);
  let campaign = {};
  if (campaignId) {
    campaign = (await loadCampaignRecord(campaignId)) || {};
    const ownerId = String(campaign.founder_id || campaign.founderId || '');
    if (ownerId && ownerId !== String(founderId)) {
      const err = new Error('You can only optimize campaigns you own.');
      err.status = 403;
      throw err;
    }
  }
  const facts = campaignFacts(campaign, draft);
  return runContentJob({ kind: 'campaign', mode: 'generate', facts, maxLength: CAMPAIGN_MAX });
}

export async function improveCampaignDescription({ founderId, campaignId, draft = {} }) {
  await requireFounder(founderId);
  let campaign = {};
  if (campaignId) {
    campaign = (await loadCampaignRecord(campaignId)) || {};
    const ownerId = String(campaign.founder_id || campaign.founderId || '');
    if (ownerId && ownerId !== String(founderId)) {
      const err = new Error('You can only optimize campaigns you own.');
      err.status = 403;
      throw err;
    }
  }
  const facts = campaignFacts(campaign, draft);
  if (!facts.existingDescription) {
    const err = new Error('Add a campaign description first, or use Generate with AI.');
    err.status = 400;
    throw err;
  }
  return runContentJob({
    kind: 'campaign',
    mode: 'improve existing description; preserve facts; improve clarity, persuasiveness, structure, and investor relevance',
    facts,
    maxLength: CAMPAIGN_MAX
  });
}
