import { analyzeContent, getHealthInfo, resolveApiKey, MediaAnalysisPayload } from './src/services/analyzer';

export interface Env {
  GEMINI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Resolve active API key from Cloudflare worker env or process.env
    const apiKey = resolveApiKey(env.GEMINI_API_KEY || env.GOOGLE_API_KEY);
    // Sync process.env for runtime compatibility
    if (apiKey && typeof process !== 'undefined' && process.env) {
      process.env.GEMINI_API_KEY = apiKey;
    }

    // Health check endpoint
    if (pathname === '/api/health' || pathname === '/api/health/') {
      return jsonResponse(getHealthInfo(apiKey));
    }

    // Media analysis endpoint
    if (pathname === '/api/analyze' || pathname === '/api/analyze/') {
      if (request.method !== 'POST') {
        return jsonResponse(
          {
            success: false,
            error: `Method ${request.method} Not Allowed. /api/analyze accepts POST requests only.`,
            allowedMethods: ['POST', 'OPTIONS'],
          },
          405,
          { 'Allow': 'POST, OPTIONS' }
        );
      }

      if (!apiKey) {
        return jsonResponse(
          {
            success: false,
            error:
              'GEMINI_API_KEY is not configured on Cloudflare. Please set GEMINI_API_KEY in Cloudflare Worker Settings -> Variables and Secrets.',
          },
          500
        );
      }

      let payload: MediaAnalysisPayload;
      try {
        payload = await request.json();
      } catch (err: any) {
        return jsonResponse(
          {
            success: false,
            error: 'Malformed JSON payload. Please ensure request body is valid JSON.',
          },
          400
        );
      }

      try {
        const result = await analyzeContent(payload, apiKey);
        return jsonResponse({
          success: true,
          data: result,
        });
      } catch (err: any) {
        console.error('[Cloudflare Worker] Error analyzing media:', err);
        return jsonResponse(
          {
            success: false,
            error: err?.message || 'An unexpected error occurred while analyzing media.',
          },
          500
        );
      }
    }

    // API catch-all: any other /api/* path returns 404 JSON
    if (pathname.startsWith('/api/')) {
      return jsonResponse(
        {
          success: false,
          error: `API route ${request.method} ${pathname} not found.`,
        },
        404
      );
    }

    // Static Assets fallback (Cloudflare Workers Static Assets binding)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
