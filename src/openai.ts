import { Env, OpenAISessionResponse } from './types';

/**
 * OpenAI API base URL
 */
const OPENAI_API_BASE = 'https://api.openai.com/v1';

/**
 * Create a new ChatKit session with OpenAI
 */
export async function createChatKitSession(env: Env): Promise<OpenAISessionResponse> {
  const response = await fetch(`${OPENAI_API_BASE}/realtime/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'verse',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as OpenAISessionResponse;
  return data;
}

/**
 * Refresh an existing ChatKit session
 * Note: OpenAI Realtime API creates new sessions. The refresh endpoint
 * creates a new session rather than extending an existing one.
 * The currentClientSecret can be validated if needed for additional security.
 */
export async function refreshChatKitSession(
  env: Env,
  currentClientSecret: string
): Promise<OpenAISessionResponse> {
  // For now, we create a new session on refresh
  // In production, you might want to validate the currentClientSecret
  // or implement additional logic based on your requirements
  
  if (!currentClientSecret || currentClientSecret.trim() === '') {
    throw new Error('Invalid current client secret');
  }

  // Create a new session (OpenAI Realtime API approach)
  return await createChatKitSession(env);
}
