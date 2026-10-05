import { analyzeContent, resolveApiKey, MediaAnalysisPayload } from '../../src/services/analyzer';

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

export async function onRequestPost(context: { request: Request; env: Record<string, string> }) {
  const { request, env } = context;
  const apiKey = resolveApiKey(env?.GEMINI_API_KEY || env?.GOOGLE_API_KEY);
  if (apiKey && typeof process !== 'undefined' && process.env) {
    process.env.GEMINI_API_KEY = apiKey;
  }

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          'GEMINI_API_KEY is not configured on Cloudflare. Please set GEMINI_API_KEY in Cloudflare Pages Settings -> Environment variables.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }

  let payload: MediaAnalysisPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Malformed JSON payload. Please ensure request body is valid JSON.',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }

  try {
    const result = await analyzeContent(payload, apiKey);
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'An unexpected error occurred while analyzing media.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
}

export async function onRequest(context: { request: Request }) {
  return new Response(
    JSON.stringify({
      success: false,
      error: `Method ${context.request.method} Not Allowed. /api/analyze accepts POST requests only.`,
      allowedMethods: ['POST', 'OPTIONS'],
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST, OPTIONS',
        ...CORS_HEADERS,
      },
    }
  );
}
