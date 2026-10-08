import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { analyzeContent, getHealthInfo, resolveApiKey } from './src/services/analyzer';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Payload limit setup for base64 media uploads
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Dedicated error handler for JSON parsing and payload size issues
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('Invalid JSON payload received:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload. Please ensure the request body is valid JSON.',
    });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payload size exceeds the 50MB limit.',
    });
  }
  next(err);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const queryKey = typeof req.query.apiKey === 'string' ? req.query.apiKey : undefined;
  const headerKey =
    (req.headers['x-goog-api-key'] as string) ||
    (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : undefined);
  res.json(getHealthInfo(queryKey || headerKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY));
});

// Analyze image or video endpoint (supports both /api/analyze and /api/analyze/)
app.post(['/api/analyze', '/api/analyze/'], async (req, res) => {
  try {
    const headerKey =
      (req.headers['x-goog-api-key'] as string) ||
      (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : undefined);
    const clientKey = req.body?.apiKey || headerKey;
    const apiKey = resolveApiKey(clientKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error:
          'GEMINI_API_KEY is not configured on the server. Please ensure the API key is set in environment secrets or configured in API Key Settings.',
      });
    }

    const result = await analyzeContent(req.body, apiKey);
    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error analyzing media in AEZEY AI Studio:', error);
    const isClientError =
      error?.message?.includes('Missing media') || error?.message?.includes('exceeds');
    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: error?.message || 'An unexpected error occurred while processing.',
    });
  }
});

// Explicitly reject non-POST requests to /api/analyze with 405 Method Not Allowed
app.all(['/api/analyze', '/api/analyze/'], (req, res) => {
  res.header('Allow', 'POST, OPTIONS');
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} Not Allowed. /api/analyze accepts POST requests only.`,
    allowedMethods: ['POST', 'OPTIONS'],
  });
});

// Catch-all for unhandled API routes to return JSON 404 instead of SPA HTML
app.all('/api/*', (req, res) => {
  return res.status(404).json({
    success: false,
    error: `API route ${req.method} ${req.path} not found.`,
  });
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AEZEY AI Studio] Server is active on port ${PORT}`);
  });
}

startServer();
