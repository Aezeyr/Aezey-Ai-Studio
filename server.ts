import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit to support images and short video frames
app.use(express.json({ limit: '45mb' }));
app.use(express.urlencoded({ extended: true, limit: '45mb' }));

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
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
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
    model: 'gemini-3.8-flash',
  });
});

// Analyze image or video endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const {
      mediaType,
      mimeType,
      base64Data,
      videoFrames,
      fileName,
      fileSize,
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
        error: `Video duration (${Math.round(duration)}s) exceeds the 30-second maximum limit allowed for short video processing.`,
      });
    }

    const ai = getAiClient();

    // Prepare content parts
    const parts: any[] = [];

    if (mediaType === 'image' && base64Data) {
      // Clean base64 header if present
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    } else if (mediaType === 'video') {
      // If we have extracted keyframes across the 30-second video, include them for robust multi-point visual analysis
      if (videoFrames && Array.isArray(videoFrames) && videoFrames.length > 0) {
        videoFrames.forEach((frameBase64: string) => {
          const cleanFrame = frameBase64.replace(/^data:[^;]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanFrame,
            },
          });
        });
      } else if (base64Data) {
        // Direct video inlineData
        const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'video/mp4',
            data: cleanBase64,
          },
        });
      }
    }

    // System prompt enforcing strict dynamic brand recognition, language fidelity, and comprehensive social media output
    const promptText = `
You are the advanced content analysis engine of "AEZEY AI Studio", an AI-powered social media generation platform.

CRITICAL INSTRUCTIONS FOR DYNAMIC BRAND & TEXT RECOGNITION:
1. This application is completely generic and dynamic.
2. DO NOT hard-code or invent any brand, such as "Azeem", "Azeem Academic Solution", or any previous upload's name.
3. DETECT ONLY THE BRAND NAME VISIBLE IN THIS CURRENT UPLOAD.
4. If a brand name is clearly visible (e.g. "ABC Fashion", "Nike", "Gourmet Bakery", "TechCorp", etc.), preserve it EXACTLY as shown with zero typos or alteration.
5. If NO brand name is present or visible, set detectedBrand to null and do NOT invent one.
6. Accurately transcribe any visible phone numbers, website URLs, addresses, prices, and special offers visible in the media. Never invent contact details or pricing that isn't clearly visible.

CRITICAL LANGUAGE HANDLING:
1. Automatically detect the primary language of the uploaded media (English, Urdu in Nastaliq or Roman Urdu, or Mixed Urdu-English).
2. If English: Generate natural, engaging English social media content.
3. If Urdu: Generate natural, fluent Urdu content (using proper Urdu script).
4. If Mixed (Urdu-English / Roman Urdu): Generate natural mixed content as commonly used on Pakistani and South Asian social media.
5. Never perform robotic or unnecessary literal translations. Use culturally fitting expressions.

CONTENT OUTPUT OBJECTIVES:
- Target Platform: ${platform}
- Selected Tone: ${tone}
${customInstructions ? `- User Custom Request: ${customInstructions}` : ''}
- Primary Caption: An engaging, complete, polished social media caption tailored to the media with hook, body, and CTA.
- Alternative Caption: A distinct alternate variation (different angle, hook style, or tone) for the same media.
- Hashtags: Diverse, relevant hashtags categorized into Industry, Niche, Topic, Audience, Product/Service, and Location (if identifiable), plus a unified list. No viral spam or random tags.
- SEO Keywords: High-intent search terms based on main topic, product/service, industry, audience, brand, and search intent.
- Call to Action (CTA): Realistic, clear next step for viewers (e.g., DM for orders, visit link in bio, comment below, contact via number shown).
- Content Summary: Concise explanation of what the media depicts.
- Detected Context: Brand, visible text, detected language, tone, promotional intent, target audience, contact details (if visible), and visual highlights.

Respond ONLY with valid JSON matching the exact schema requested.
`;

    parts.push({ text: promptText });

    // Execute with primary model (gemini-3.8-flash), falling back to gemini-2.5-flash on 503/high-demand
    let response;
    const generateConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryCaption: {
            type: Type.STRING,
            description: 'Engaging, ready-to-post primary caption',
          },
          alternativeCaption: {
            type: Type.STRING,
            description: 'Alternative caption variation in a different style',
          },
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
          callToAction: {
            type: Type.STRING,
            description: 'Direct call to action based on visible content',
          },
          contentSummary: {
            type: Type.STRING,
            description: 'Concise summary of the visual elements and main message',
          },
          detectedContext: {
            type: Type.OBJECT,
            properties: {
              detectedBrand: {
                type: Type.STRING,
                description: 'Exact brand name visible in image/video or empty string if none',
              },
              hasBrand: { type: Type.BOOLEAN },
              visibleText: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'All text transcribed accurately from the media',
              },
              detectedLanguage: {
                type: Type.STRING,
                description: 'English, Urdu, or Mixed (Urdu-English)',
              },
              tone: { type: Type.STRING },
              mainTopic: { type: Type.STRING },
              promotionalIntent: {
                type: Type.STRING,
                description: 'High, Medium, Low, Informational, or Educational',
              },
              targetAudience: { type: Type.STRING },
              contactInfoFound: {
                type: Type.OBJECT,
                properties: {
                  phone: { type: Type.STRING },
                  email: { type: Type.STRING },
                  website: { type: Type.STRING },
                  prices: { type: Type.STRING },
                  offers: { type: Type.STRING },
                },
              },
              visualHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
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

    // Multi-tier fallback cascade: gemini-3.8-flash -> gemini-3.1-flash-lite -> gemini-3.6-flash
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];
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
        console.warn(`Model ${modelName} failed or busy, trying next available model in cascade... Error:`, modelErr?.message);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All candidate AI models were temporarily busy. Please retry in a few seconds.');
    }

    const rawText = response.text;
    if (!rawText) {
      throw new Error('Gemini model returned an empty response. Please try again.');
    }

    const parsedData = JSON.parse(rawText);

    // Format hashtags with '#' symbol if not already present
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
      
      // Combine all unique hashtags
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
          parsedData.detectedContext.detectedBrand &&
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
    const errorMessage =
      error?.message ||
      'An unexpected error occurred while analyzing the uploaded media. Please try again.';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
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
