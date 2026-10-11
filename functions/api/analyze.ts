import { analyzeContent, resolveApiKey, MediaAnalysisPayload } from '../../src/services/analyzer';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-goog-api-key',
  'Access-Control-Max-Age': '86400',
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestPost(contextOrRequest: any, maybeEnv?: any) {
  let request: Request;
  let env: any;

  if (contextOrRequest && contextOrRequest.request && typeof contextOrRequest.request.json === 'function') {
    request = contextOrRequest.request;
    env = contextOrRequest.env || contextOrRequest.data?.env || contextOrRequest.cloudflare?.env || contextOrRequest;
  } else if (contextOrRequest instanceof Request || (contextOrRequest && typeof contextOrRequest.json === 'function')) {
    request = contextOrRequest;
    env = maybeEnv || (contextOrRequest as any).env;
  } else {
    request = contextOrRequest?.request || contextOrRequest;
    env = contextOrRequest?.env || maybeEnv || contextOrRequest;
  }

  // Resolve API key from all available environments
  const envApiKey =
    resolveApiKey(undefined, env) ||
    resolveApiKey(undefined, contextOrRequest) ||
    resolveApiKey(undefined, maybeEnv);

  if (envApiKey && typeof process !== 'undefined' && process.env) {
    process.env.GEMINI_API_KEY = envApiKey;
  }
  if (envApiKey && typeof globalThis !== 'undefined') {
    (globalThis as any).GEMINI_API_KEY = envApiKey;
  }

  const headerKey =
    request.headers?.get?.('x-goog-api-key') ||
    (request.headers?.get?.('Authorization')
      ? request.headers.get('Authorization')!.replace(/^Bearer\s+/i, '')
      : undefined);

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

  const clientKey = payload?.apiKey || headerKey;
  const activeKey =
    resolveApiKey(clientKey || envApiKey, env) ||
    resolveApiKey(clientKey, contextOrRequest);

  try {
    const result = await analyzeContent(payload, activeKey, env || contextOrRequest);
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

export async function onRequest(contextOrRequest: any, maybeEnv?: any) {
  const req = contextOrRequest?.request || contextOrRequest;
  if (req?.method === 'POST') {
    return onRequestPost(contextOrRequest, maybeEnv);
  }
  if (req?.method === 'OPTIONS') {
    return onRequestOptions();
  }
  return new Response(
    JSON.stringify({
      success: false,
      error: `Method ${req?.method || 'UNKNOWN'} Not Allowed. /api/analyze accepts POST requests only.`,
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
