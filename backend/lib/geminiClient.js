import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const FALLBACK_MODEL_NAME = process.env.GEMINI_FALLBACK_MODEL || MODEL_NAME;

let aiClient = null;

export function getGeminiModelNames() {
  return [...new Set([MODEL_NAME, FALLBACK_MODEL_NAME].filter(Boolean))];
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

function extractText(response) {
  if (!response) return '';
  if (typeof response.text === 'string') return response.text;
  try {
    return response.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
  } catch {
    return '';
  }
}

export function parseJsonFromModel(rawText) {
  const cleaned = String(rawText || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function callGeminiForJSON(promptText, schema, options = {}) {
  const client = getAiClient();
  if (!client) return null;

  const tryModels = getGeminiModelNames();
  for (const modelName of tryModels) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          ...(options.config || {})
        }
      });
      const parsed = parseJsonFromModel(extractText(response));
      if (parsed) return parsed;
      if (options.parseFailureValue !== undefined) return options.parseFailureValue;
      return null;
    } catch (err) {
      const msg = err?.message || String(err);
      const isMissingModel = msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('not available');
      if (!isMissingModel) throw err;
      console.warn(`Gemini model ${modelName} unavailable; retrying with fallback model.`);
    }
  }
  return options.parseFailureValue !== undefined ? options.parseFailureValue : null;
}

export async function callGeminiWithSearchJSON(promptText) {
  const client = getAiClient();
  if (!client) return null;

  const tryModels = getGeminiModelNames();
  for (const modelName of tryModels) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      return parseJsonFromModel(extractText(response));
    } catch (err) {
      const msg = err?.message || String(err);
      const isMissingModel = msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('not available');
      if (!isMissingModel) {
        console.warn('Gemini search grounding failed:', msg);
        return null;
      }
    }
  }
  return null;
}
