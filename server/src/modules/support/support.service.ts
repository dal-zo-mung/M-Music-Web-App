import { env } from '../../config/env.js';
import { normalizePlainText } from '../shared/security/input.js';

const MAX_MESSAGES = 14;
const MAX_USER_CHARS = 2000;

export interface SupportChatTurn {
  content: string;
  role: 'assistant' | 'system' | 'user';
}

export interface SupportChatResult {
  reply: string;
  stub: boolean;
}

function sanitizeTurns(raw: unknown): SupportChatTurn[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const out: SupportChatTurn[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const record = item as Record<string, unknown>;
    const role = record.role === 'assistant' || record.role === 'user' ? record.role : null;
    const content =
      typeof record.content === 'string'
        ? normalizePlainText(record.content, { maxLength: MAX_USER_CHARS, preserveNewlines: true })
        : '';

    if (!role || !content) {
      continue;
    }

    out.push({ content, role });
    if (out.length >= MAX_MESSAGES) {
      break;
    }
  }

  return out;
}

const SYSTEM_PROMPT =
  'You are the in-app help assistant for M-Music, a lyrics and music discovery site. ' +
  'Give short, accurate, friendly answers. Never ask users for passwords or secrets. ' +
  'If you are unsure, suggest using the site search or the community lyrics section.';

export async function runSupportChat(turns: unknown): Promise<SupportChatResult> {
  const sanitized = sanitizeTurns(turns);

  if (sanitized.length === 0) {
    return {
      reply: 'Please type a message so I can help.',
      stub: true
    };
  }

  if (!env.groqApiKey) {
    return {
      reply:
        'The live assistant is not configured on the server yet. Ask your project owner to set GROQ_API_KEY ' +
        'in the environment (the key stays on the server only). Meanwhile you can use Search, Community, ' +
        'and your profile settings from the header menu.',
      stub: true
    };
  }

  const messages: Array<{ content: string; role: 'assistant' | 'system' | 'user' }> = [
    { content: SYSTEM_PROMPT, role: 'system' },
    ...sanitized.map((turn) => ({ content: turn.content, role: turn.role }))
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      body: JSON.stringify({
        max_tokens: 512,
        messages,
        model: env.groqModel,
        temperature: 0.35
      }),
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        'Content-Type': 'application/json'
      },
      method: 'POST'
    });

    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    if (!response.ok) {
      return {
        reply: 'The assistant is temporarily unavailable. Please try again in a few minutes.',
        stub: true
      };
    }

    const choices = payload?.choices;

    if (!Array.isArray(choices) || choices.length === 0) {
      return {
        reply: 'The assistant returned an empty response. Please try again.',
        stub: true
      };
    }

    const first = choices[0] as Record<string, unknown> | undefined;
    const message = first?.message as Record<string, unknown> | undefined;
    const content =
      typeof message?.content === 'string'
        ? normalizePlainText(message.content, { maxLength: 4000, preserveNewlines: true })
        : '';

    if (!content) {
      return {
        reply: 'The assistant returned an empty response. Please try again.',
        stub: true
      };
    }

    return { reply: content, stub: false };
  } catch (error) {
    console.error('Groq request failed', error);
    return {
      reply: 'Could not reach the assistant service. Please try again later.',
      stub: true
    };
  }
}
