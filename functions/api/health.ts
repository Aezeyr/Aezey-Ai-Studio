import { getHealthInfo, resolveApiKey } from '../../src/services/analyzer';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestGet(context: { env: Record<string, string> }) {
  const apiKey = resolveApiKey(context.env?.GEMINI_API_KEY || context.env?.GOOGLE_API_KEY, context.env);

  return new Response(JSON.stringify(getHealthInfo(apiKey, context.env)), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}
