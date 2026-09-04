import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callGeminiForJSON, callGeminiWithSearchJSON, isGeminiConfigured } from '../lib/geminiClient.js';
import { isSafeHttpUrl, sanitizeHttpUrl, sanitizeText } from '../lib/aiSanitize.js';
import { loadInvestorRecord } from '../lib/matchCatalog.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, '..', 's3_investment_trends.json');
const CACHE_TTL_MS = Number(process.env.TRENDS_CACHE_TTL_MS || 6 * 60 * 60 * 1000);

const RSS_FEEDS = [
  'https://news.google.com/rss/search?q=venture+capital+startup+funding&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=fintech+OR+climate+tech+OR+healthtech+investment&hl=en-US&gl=US&ceid=US:en',
  'https://techcrunch.com/category/venture/feed/'
];

const trendListSchema = {
  type: 'object',
  properties: {
    trends: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          category: { type: 'string' },
          summary: { type: 'string' },
          significance: { type: 'string' },
          investorInsight: { type: 'string' },
          source: { type: 'string' },
          sourceUrl: { type: 'string' },
          publishedAt: { type: 'string' },
          factualBasis: { type: 'string' },
          interpretation: { type: 'string' },
          relevantSectors: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['title', 'summary', 'significance']
      }
    }
  },
  required: ['trends']
};

function readCacheFile() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null;
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeCacheFile(payload) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.warn('Trend cache write skipped:', err.message);
  }
}

async function fetchWithTimeout(url, timeoutMs = 8000, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FundBridge/1.0 (investment research)', ...headers }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseRssItems(xml) {
  const items = [];
  const blocks = String(xml || '').split(/<item[\s>]/i).slice(1);
  for (const block of blocks) {
    const chunk = block.split(/<\/item>/i)[0] || '';
    const title = decodeXml((chunk.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const link = decodeXml((chunk.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || '');
    const sourceUrl = sanitizeHttpUrl(link) || sanitizeHttpUrl((chunk.match(/url="([^"]+)"/i) || [])[1]);
    const publishedAt = decodeXml((chunk.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] || '');
    const description = sanitizeText(decodeXml((chunk.match(/<description[^>]*>([\s\S]*?)<\/description>/i) || [])[1] || ''), 400);
    const source = decodeXml((chunk.match(/<source[^>]*>([\s\S]*?)<\/source>/i) || [])[1] || '');
    if (title) {
      items.push({
        title: sanitizeText(title, 180),
        sourceUrl,
        publishedAt,
        description,
        source: sanitizeText(source, 80)
      });
    }
  }
  return items;
}

async function fetchRssArticles() {
  const collected = [];
  await Promise.all(RSS_FEEDS.map(async (feed) => {
    try {
      const xml = await fetchWithTimeout(feed, 8000);
      collected.push(...parseRssItems(xml));
    } catch (err) {
      console.warn(`Trend RSS skipped (${feed}):`, err.message);
    }
  }));
  const seen = new Set();
  return collected.filter((item) => {
    const key = (item.sourceUrl || item.title).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 18);
}

async function fetchNewsApiArticles() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];
  const endpoint = `https://newsapi.org/v2/everything?q=${encodeURIComponent('venture capital OR startup funding OR fintech investment')}&language=en&sortBy=publishedAt&pageSize=15`;
  try {
    const raw = await fetchWithTimeout(endpoint, 8000, { 'X-Api-Key': apiKey });
    const parsed = JSON.parse(raw);
    return (parsed.articles || []).map((article) => ({
      title: sanitizeText(article.title, 180),
      sourceUrl: sanitizeHttpUrl(article.url),
      publishedAt: article.publishedAt || '',
      description: sanitizeText(article.description, 400),
      source: sanitizeText(article.source?.name, 80)
    })).filter((item) => item.title);
  } catch (err) {
    console.warn('NewsAPI fetch skipped:', err.message);
    return [];
  }
}

function normalizeTrend(raw, index) {
  const sourceUrl = sanitizeHttpUrl(raw.sourceUrl);
  return {
    id: `trend_${index + 1}_${String(raw.title || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
    title: sanitizeText(raw.title, 160),
    category: sanitizeText(raw.category, 60) || 'Global markets',
    summary: sanitizeText(raw.summary, 420),
    significance: sanitizeText(raw.significance, 360),
    investorInsight: sanitizeText(raw.investorInsight, 360),
    factualBasis: sanitizeText(raw.factualBasis || raw.summary, 360),
    interpretation: sanitizeText(raw.interpretation || raw.investorInsight, 360),
    source: sanitizeText(raw.source, 80) || (sourceUrl ? new URL(sourceUrl).hostname : 'External news'),
    sourceUrl,
    publishedAt: sanitizeText(raw.publishedAt, 80),
    relevantSectors: Array.isArray(raw.relevantSectors)
      ? raw.relevantSectors.map((s) => sanitizeText(s, 40)).filter(Boolean).slice(0, 5)
      : []
  };
}

function articlesToFallbackTrends(articles) {
  return articles.slice(0, 8).map((article, index) => normalizeTrend({
    title: article.title,
    category: 'Market news',
    summary: article.description || article.title,
    significance: 'Sourced from current market coverage. Open the original article for full context.',
    investorInsight: 'Treat this as a reported development, not a FundBridge investment recommendation.',
    factualBasis: article.description || article.title,
    interpretation: 'No additional AI interpretation is available until the summarizer is configured or recovers.',
    source: article.source,
    sourceUrl: article.sourceUrl,
    publishedAt: article.publishedAt,
    relevantSectors: []
  }, index));
}

async function summarizeArticles(articles) {
  const payload = articles.slice(0, 12).map((article) => ({
    title: article.title,
    source: article.source,
    sourceUrl: article.sourceUrl,
    publishedAt: article.publishedAt,
    excerpt: article.description
  }));

  const prompt = `
You are the FundBridge AI Optimization Engine summarizing CURRENT investment news for professional investors.

TASK:
Turn the supplied source articles into 6-8 concise "What's Burning" trend cards.

RULES:
- Use only the supplied articles. Do not invent companies, funding rounds, numbers, or quotes.
- If an article is thin, keep the summary conservative.
- Clearly separate factualBasis (what the source reports) from interpretation (why an investor might care).
- interpretation must be labeled as possible implication, not confirmed fact.
- Preserve source name, sourceUrl, and publishedAt from the matching article.
- Map relevantSectors to industries such as FinTech, HealthTech, ClimateTech, EdTech, SaaS, AI, Cybersecurity when justified by the article.

SOURCE ARTICLES (JSON):
${JSON.stringify(payload)}
`.trim();

  const parsed = await callGeminiForJSON(prompt, trendListSchema);
  const trends = Array.isArray(parsed?.trends) ? parsed.trends.map((item, index) => normalizeTrend(item, index)).filter((item) => item.title && item.summary) : [];
  return trends;
}

async function searchBackedTrends() {
  if (!isGeminiConfigured()) return [];
  const parsed = await callGeminiWithSearchJSON(`
Find 6 current global venture/startup investment trends from reputable sources published recently.
Return JSON only: {"trends":[{"title":"","category":"","summary":"","significance":"","investorInsight":"","factualBasis":"","interpretation":"","source":"","sourceUrl":"","publishedAt":"","relevantSectors":[""]}]}
Do not invent URLs. If a source URL is unknown, leave sourceUrl empty.
Do not present speculation as fact.
`);
  const trends = Array.isArray(parsed?.trends) ? parsed.trends.map((item, index) => normalizeTrend(item, index)).filter((item) => item.title && item.summary) : [];
  return trends.filter((item) => !item.sourceUrl || isSafeHttpUrl(item.sourceUrl));
}

let memoryCache = null;
let inflight = null;

async function persistSupabase(trends, fetchedAt) {
  if (!isSupabaseConfigured || !supabase || !trends.length) return;
  try {
    await supabase.from('investment_trends').upsert(
      trends.map((trend) => ({
        id: trend.id,
        title: trend.title,
        category: trend.category,
        summary: trend.summary,
        significance: trend.significance,
        investor_insight: trend.investorInsight,
        source: trend.source,
        source_url: trend.sourceUrl,
        published_at: trend.publishedAt || null,
        fetched_at: fetchedAt,
        relevant_sectors: trend.relevantSectors
      })),
      { onConflict: 'id' }
    );
  } catch {
    // Table is optional; JSON cache remains the primary store.
  }
}

async function buildTrendBundle() {
  const newsApi = await fetchNewsApiArticles();
  const rss = newsApi.length ? [] : await fetchRssArticles();
  const articles = [...newsApi, ...rss].filter((item) => item.title);
  let trends = [];
  let source = 'unavailable';

  if (articles.length && isGeminiConfigured()) {
    try {
      trends = await summarizeArticles(articles);
      source = 'gemini+news';
    } catch (err) {
      if (err?.status !== 429) console.warn('Trend summarization failed:', err.message);
    }
  }

  if (!trends.length && articles.length) {
    trends = articlesToFallbackTrends(articles);
    source = 'news';
  }

  if (!trends.length) {
    try {
      trends = await searchBackedTrends();
      if (trends.length) source = 'gemini-search';
    } catch (err) {
      console.warn('Trend search fallback failed:', err.message);
    }
  }

  const fetchedAt = new Date().toISOString();
  const bundle = {
    fetchedAt,
    expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    source,
    providerConfigured: Boolean(process.env.NEWS_API_KEY) || isGeminiConfigured(),
    trends
  };
  memoryCache = bundle;
  writeCacheFile(bundle);
  await persistSupabase(trends, fetchedAt);
  return bundle;
}

function cacheIsFresh(bundle) {
  if (!bundle?.fetchedAt) return false;
  return Date.now() - new Date(bundle.fetchedAt).getTime() < CACHE_TTL_MS;
}

async function getCachedBundle({ force = false } = {}) {
  if (!force && memoryCache && cacheIsFresh(memoryCache)) return memoryCache;
  const fileCache = readCacheFile();
  if (!force && fileCache && cacheIsFresh(fileCache)) {
    memoryCache = fileCache;
    return fileCache;
  }
  if (inflight) return inflight;
  inflight = buildTrendBundle().finally(() => {
    inflight = null;
  });
  return inflight;
}

function scoreTrend(trend, investor) {
  const sectors = (investor?.sector_interests || []).map((s) => String(s).toLowerCase());
  if (!sectors.length) return 1;
  const haystack = [trend.category, ...(trend.relevantSectors || []), trend.title, trend.summary].join(' ').toLowerCase();
  let score = 1;
  for (const sector of sectors) {
    const token = sector.split(/[/,]/)[0].trim();
    if (token && haystack.includes(token)) score += 4;
  }
  return score;
}

export async function getWhatsBurning({ investorId, force = false } = {}) {
  const investor = investorId ? await loadInvestorRecord(investorId) : null;
  const bundle = await getCachedBundle({ force });
  const ranked = [...(bundle.trends || [])]
    .map((trend) => ({ ...trend, relevanceScore: scoreTrend(trend, investor), personalized: scoreTrend(trend, investor) > 1 }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore || String(b.publishedAt).localeCompare(String(a.publishedAt)));

  const status = ranked.length ? 'ok' : 'empty';
  return {
    status: bundle.providerConfigured || ranked.length ? status : 'unconfigured',
    source: bundle.source,
    fetchedAt: bundle.fetchedAt,
    expiresAt: bundle.expiresAt,
    personalized: Boolean(investor && (investor.sector_interests || []).length),
    sectorInterests: investor?.sector_interests || [],
    trends: ranked,
    message: ranked.length
      ? ''
      : bundle.providerConfigured
        ? 'No current investment trends could be retrieved. The rest of FundBridge is still available.'
        : 'Trend data is not configured yet. Set GEMINI_API_KEY and optionally NEWS_API_KEY on the server.'
  };
}
