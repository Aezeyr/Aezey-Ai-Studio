import { getHealthInfo, resolveApiKey } from '../../src/services/analyzer';

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

export async function onRequestGet(contextOrRequest: any, maybeEnv?: any) {
  let request: Request | undefined;
  let env: any;

  if (contextOrRequest && contextOrRequest.request) {
    request = contextOrRequest.request;
    env = contextOrRequest.env || contextOrRequest.data?.env || contextOrRequest.cloudflare?.env || contextOrRequest;
  } else if (contextOrRequest instanceof Request) {
    request = contextOrRequest;
    env = maybeEnv || (contextOrRequest as any).env;
  } else {
    request = contextOrRequest?.request || contextOrRequest;
    env = contextOrRequest?.env || maybeEnv || contextOrRequest;
  }

  const url = request && typeof request.url === 'string' ? new URL(request.url) : null;
  const queryKey = url?.searchParams.get('apiKey') || undefined;
  const headerKey =
    request?.headers?.get?.('x-goog-api-key') ||
    (request?.headers?.get?.('Authorization')
      ? request.headers.get('Authorization')!.replace(/^Bearer\s+/i, '')
      : undefined);

  const apiKey =
    resolveApiKey(queryKey || headerKey, env) ||
    resolveApiKey(undefined, env) ||
    resolveApiKey(undefined, contextOrRequest);

  return new Response(JSON.stringify(getHealthInfo(apiKey, env || contextOrRequest)), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export async function onRequest(contextOrRequest: any, maybeEnv?: any) {
  const req = contextOrRequest?.request || contextOrRequest;
  if (req?.method === 'OPTIONS') {
    return onRequestOptions();
  }
  return onRequestGet(contextOrRequest, maybeEnv);
}
