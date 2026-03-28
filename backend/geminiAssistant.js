import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROJECT_ASSISTANT_CONTEXT } from './assistantContext.js';

const MAX_USER_MESSAGE = 8000;
const MAX_HISTORY_MESSAGES = 24;

/**
 * @param {{ role: string, content: string }[]} messages
 * @returns {Promise<string>}
 */
export async function runGeminiAssistant(messages) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    const err = new Error('GEMINI_API_KEY_MISSING');
    err.code = 'GEMINI_API_KEY_MISSING';
    throw err;
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages array required');
  }

  const slice = messages.slice(-MAX_HISTORY_MESSAGES);
  const last = slice[slice.length - 1];
  if (last.role !== 'user') {
    throw new Error('last message must be from user');
  }

  const lastText = String(last.content ?? '').slice(0, MAX_USER_MESSAGE).trim();
  if (!lastText) {
    throw new Error('empty user message');
  }

  const genAI = new GoogleGenerativeAI(key);
  // gemini-1.5-* сняты с API (404). Стабильная замена: gemini-2.5-flash; см. https://ai.google.dev/gemini-api/docs/models/gemini
  const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: {
      role: 'system',
      parts: [{ text: PROJECT_ASSISTANT_CONTEXT }]
    }
  });

  const history = [];
  for (let i = 0; i < slice.length - 1; i++) {
    const m = slice[i];
    const text = String(m.content ?? '').slice(0, MAX_USER_MESSAGE);
    if (m.role === 'user') {
      history.push({ role: 'user', parts: [{ text }] });
    } else if (m.role === 'assistant' || m.role === 'model') {
      history.push({ role: 'model', parts: [{ text }] });
    }
  }

  // SDK: история должна начинаться с user, не с model
  while (history.length > 0 && history[0].role !== 'user') {
    history.shift();
  }

  const chat = model.startChat({ history });
  let result;
  try {
    result = await chat.sendMessage(lastText);
  } catch (e) {
    const raw = e?.message ?? String(e);
    if (
      /\[404 Not Found\]|models\/[\w.-]+\s+is not found|is not found for API version v1beta|is not supported for generateContent/i.test(
        raw
      )
    ) {
      const err = new Error('GEMINI_MODEL_INVALID');
      err.code = 'GEMINI_MODEL_INVALID';
      throw err;
    }
    if (/429|Quota exceeded|quota exceeded|RESOURCE_EXHAUSTED/i.test(raw)) {
      const err = new Error('GEMINI_QUOTA');
      err.code = 'GEMINI_QUOTA';
      throw err;
    }
    throw e;
  }
  const text = result.response?.text?.();
  if (!text || typeof text !== 'string') {
    throw new Error('empty model response');
  }
  return text.trim();
}
