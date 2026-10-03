import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

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

// Lazy initialization of GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured on the server. Please ensure the API key is set in environment secrets.'
      );
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    brand: 'AEZEY AI Studio',
    tagline: 'AI-Powered Content Creation for Smarter Social Media',
    version: '1.0.0',
    hasApiKey: hasKey,
    model: 'gemini-3.1-flash-lite',
  });
});

// Analyze image or video endpoint (supports both /api/analyze and /api/analyze/)
app.post(['/api/analyze', '/api/analyze/'], async (req, res) => {
  try {
    const {
      mediaType,
      mimeType,
      base64Data,
      videoFrames,
      duration,
      platform = 'all',
      tone = 'engaging',
      customInstructions = '',
    } = req.body;

    if (!mediaType || (!base64Data && (!videoFrames || videoFrames.length === 0))) {
      return res.status(400).json({
        success: false,
        error: 'Missing media payload. Please upload a valid image or video file.',
      });
    }

    if (mediaType === 'video' && duration && duration > 30.5) {
      return res.status(400).json({
        success: false,
        error: `Video duration (${Math.round(duration)}s) exceeds the 30-second maximum limit allowed.`,
      });
    }

    const ai = getAiClient();
    const parts: any[] = [];

    // Process image
    if (mediaType === 'image' && base64Data) {
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    } 
    // Process video frames or raw base64 video
    else if (mediaType === 'video') {
      if (videoFrames && Array.isArray(videoFrames) && videoFrames.length > 0) {
        // Limit frames to max 10 to prevent memory crashes
        const sampledFrames = videoFrames.slice(0, 10);
        sampledFrames.forEach((frameBase64: string) => {
          const cleanFrame = frameBase64.replace(/^data:[^;]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanFrame,
            },
          });
        });
      } else if (base64Data) {
        const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'video/mp4',
            data: cleanBase64,
          },
        });
      }
    }

    const promptText = `
You are the advanced content analysis engine of "AEZEY AI Studio".

CRITICAL INSTRUCTIONS FOR DYNAMIC BRAND & TEXT RECOGNITION:
1. This application is generic and dynamic.
2. DO NOT hard-code or invent any brand name.
3. DETECT ONLY THE BRAND NAME VISIBLE IN THIS CURRENT UPLOAD.
4. If a brand name is clearly visible, preserve it EXACTLY as shown.
5. If NO brand name is visible, set detectedBrand to null.
6. Accurately transcribe visible phone numbers, URLs, addresses, prices, and offers.

CRITICAL LANGUAGE HANDLING:
1. Detect primary language (English, Urdu script, or Mixed Roman Urdu/English).
2. Generate natural, fluent, and culturally appropriate content matching detected language.

CONTENT OUTPUT OBJECTIVES:
- Target Platform: ${platform}
- Selected Tone: ${tone}
${customInstructions ? `- User Custom Request: ${customInstructions}` : ''}

Respond ONLY with valid JSON matching the schema provided.
`;

    parts.push({ text: promptText });

    const generateConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryCaption: { type: Type.STRING },
          alternativeCaption: { type: Type.STRING },
          hashtags: {
            type: Type.OBJECT,
            properties: {
              industry: { type: Type.ARRAY, items: { type: Type.STRING } },
              niche: { type: Type.ARRAY, items: { type: Type.STRING } },
              topic: { type: Type.ARRAY, items: { type: Type.STRING } },
              audience: { type: Type.ARRAY, items: { type: Type.STRING } },
              productService: { type: Type.ARRAY, items: { type: Type.STRING } },
              location: { type: Type.ARRAY, items: { type: Type.STRING } },
              all: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['industry', 'niche', 'topic', 'all'],
          },
          seoKeywords: {
            type: Type.OBJECT,
            properties: {
              mainTopic: { type: Type.ARRAY, items: { type: Type.STRING } },
              productService: { type: Type.ARRAY, items: { type: Type.STRING } },
              industry: { type: Type.ARRAY, items: { type: Type.STRING } },
              audience: { type: Type.ARRAY, items: { type: Type.STRING } },
              brand: { type: Type.ARRAY, items: { type: Type.STRING } },
              searchIntent: { type: Type.ARRAY, items: { type: Type.STRING } },
              all: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['mainTopic', 'industry', 'all'],
          },
          callToAction: { type: Type.STRING },
          contentSummary: { type: Type.STRING },
          detectedContext: {
            type: Type.OBJECT,
            properties: {
              detectedBrand: { type: Type.STRING },
              hasBrand: { type: Type.BOOLEAN },
              visibleText: { type: Type.ARRAY, items: { type: Type.STRING } },
              detectedLanguage: { type: Type.STRING },
              tone: { type: Type.STRING },
              mainTopic: { type: Type.STRING },
              promotionalIntent: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              visualHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'hasBrand',
              'visibleText',
              'detectedLanguage',
              'tone',
              'mainTopic',
              'promotionalIntent',
              'targetAudience',
              'visualHighlights',
            ],
          },
        },
        required: [
          'primaryCaption',
          'alternativeCaption',
          'hashtags',
          'seoKeywords',
          'callToAction',
          'contentSummary',
          'detectedContext',
        ],
      },
    };

    // Valid Gemini Model Cascade (gemini-3.8-flash -> gemini-3.1-flash-lite -> gemini-flash-latest)
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: { parts },
          config: generateConfig,
        });
        if (response && response.text) {
          break;
        }
      } catch (modelErr: any) {
        lastError = modelErr;
        console.warn(`Model ${modelName} failed, trying next... Error:`, modelErr?.message);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All AI models were temporarily busy. Please retry.');
    }

    // Clean JSON response against markdown wrappers
    let rawText = response.text.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedData = JSON.parse(rawText);

    // Format hashtags
    const formatTags = (tags: string[]) => {
      if (!Array.isArray(tags)) return [];
      return tags.map((t) => (t.startsWith('#') ? t : `#${t.replace(/\s+/g, '')}`));
    };

    if (parsedData.hashtags) {
      parsedData.hashtags.industry = formatTags(parsedData.hashtags.industry || []);
      parsedData.hashtags.niche = formatTags(parsedData.hashtags.niche || []);
      parsedData.hashtags.topic = formatTags(parsedData.hashtags.topic || []);
      parsedData.hashtags.audience = formatTags(parsedData.hashtags.audience || []);
      parsedData.hashtags.productService = formatTags(parsedData.hashtags.productService || []);
      parsedData.hashtags.location = formatTags(parsedData.hashtags.location || []);

      const combined = Array.from(
        new Set([
          ...parsedData.hashtags.industry,
          ...parsedData.hashtags.niche,
          ...parsedData.hashtags.topic,
          ...parsedData.hashtags.audience,
          ...parsedData.hashtags.productService,
          ...parsedData.hashtags.location,
          ...formatTags(parsedData.hashtags.all || []),
        ])
      );
      parsedData.hashtags.all = combined;
    }

    // Format SEO keywords
    if (parsedData.seoKeywords) {
      const allKeywords = Array.from(
        new Set([
          ...(parsedData.seoKeywords.mainTopic || []),
          ...(parsedData.seoKeywords.productService || []),
          ...(parsedData.seoKeywords.industry || []),
          ...(parsedData.seoKeywords.audience || []),
          ...(parsedData.seoKeywords.brand || []),
          ...(parsedData.seoKeywords.searchIntent || []),
          ...(parsedData.seoKeywords.all || []),
        ])
      );
      parsedData.seoKeywords.all = allKeywords;
    }

    const finalResult = {
      id: 'aezey_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      primaryCaption: parsedData.primaryCaption,
      alternativeCaption: parsedData.alternativeCaption,
      hashtags: parsedData.hashtags,
      seoKeywords: parsedData.seoKeywords,
      callToAction: parsedData.callToAction,
      contentSummary: parsedData.contentSummary,
      detectedContext: {
        ...parsedData.detectedContext,
        detectedBrand:
          parsedData.detectedContext?.detectedBrand &&
          parsedData.detectedContext.detectedBrand.trim() !== ''
            ? parsedData.detectedContext.detectedBrand.trim()
            : null,
      },
      platform,
      tone,
    };

    return res.json({
      success: true,
      data: finalResult,
    });
  } catch (error: any) {
    console.error('Error analyzing media in AEZEY AI Studio:', error);
    return res.status(500).json({
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
