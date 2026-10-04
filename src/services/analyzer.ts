import { GoogleGenAI, Type } from '@google/genai';

export interface MediaAnalysisPayload {
  mediaType: 'image' | 'video';
  mimeType?: string;
  base64Data?: string;
  videoFrames?: string[];
  duration?: number;
  platform?: string;
  tone?: string;
  customInstructions?: string;
}

export interface MediaAnalysisResult {
  id: string;
  timestamp: number;
  primaryCaption: string;
  alternativeCaption: string;
  hashtags: {
    industry: string[];
    niche: string[];
    topic: string[];
    audience: string[];
    productService: string[];
    location: string[];
    all: string[];
  };
  seoKeywords: {
    mainTopic: string[];
    productService: string[];
    industry: string[];
    audience: string[];
    brand: string[];
    searchIntent: string[];
    all: string[];
  };
  callToAction: string;
  contentSummary: string;
  detectedContext: {
    detectedBrand: string | null;
    hasBrand: boolean;
    visibleText: string[];
    detectedLanguage: string;
    tone: string;
    mainTopic: string;
    promotionalIntent: string;
    targetAudience: string;
    visualHighlights: string[];
  };
  platform: string;
  tone: string;
}

const RESPONSE_SCHEMA = {
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
};

const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

/**
 * Strips markdown code blocks if the model outputs ```json ... ```
 */
function extractJsonString(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return text.trim();
}

/**
 * Formats tags ensuring '#' prefix and no spaces
 */
function formatTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.map((t) => (t.startsWith('#') ? t : `#${t.replace(/\s+/g, '')}`));
}

/**
 * Unified Core Content Analyzer for AEZEY AI Studio.
 * Runs in Node.js (Express), Cloudflare Workers, and Cloudflare Pages Functions.
 */
export async function analyzeContent(
  payload: MediaAnalysisPayload,
  apiKey: string
): Promise<MediaAnalysisResult> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please configure it in your environment or secrets.');
  }

  const {
    mediaType,
    mimeType,
    base64Data,
    videoFrames,
    duration,
    platform = 'all',
    tone = 'engaging',
    customInstructions = '',
  } = payload;

  if (!mediaType || (!base64Data && (!videoFrames || videoFrames.length === 0))) {
    throw new Error('Missing media payload. Please upload a valid image or video file.');
  }

  if (mediaType === 'video' && duration && duration > 30.5) {
    throw new Error(
      `Video duration (${Math.round(duration)}s) exceeds the 30-second maximum limit allowed.`
    );
  }

  const parts: any[] = [];

  // Prepare image parts
  if (mediaType === 'image' && base64Data) {
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    });
  }
  // Prepare video parts (prioritize keyframes for fast & reliable inference)
  else if (mediaType === 'video') {
    if (videoFrames && Array.isArray(videoFrames) && videoFrames.length > 0) {
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
    responseSchema: RESPONSE_SCHEMA,
  };

  const ai = new GoogleGenAI({ apiKey });
  let responseText: string | null = null;
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: generateConfig,
      });

      if (response && response.text) {
        responseText = response.text;
        break;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[AEZEY AI Studio] Model ${modelName} call failed, trying next... Error:`, err?.message);
    }
  }

  // Direct REST API fallback if SDK throws or is restricted
  if (!responseText) {
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const restRes = await fetch(restUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: RESPONSE_SCHEMA,
            },
          }),
        });

        if (restRes.ok) {
          const restJson: any = await restRes.json();
          const textCandidate = restJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textCandidate) {
            responseText = textCandidate;
            break;
          }
        }
      } catch (restErr: any) {
        lastError = restErr;
      }
    }
  }

  if (!responseText) {
    throw lastError || new Error('All AI models were temporarily busy or unavailable. Please retry.');
  }

  const rawJson = extractJsonString(responseText);
  let parsedData: any;
  try {
    parsedData = JSON.parse(rawJson);
  } catch (parseErr: any) {
    console.error('Failed to parse Gemini JSON output:', rawJson);
    throw new Error('AI output could not be parsed as valid JSON. Please try again.');
  }

  // Format hashtags
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

  const finalResult: MediaAnalysisResult = {
    id: 'aezey_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now(),
    primaryCaption: parsedData.primaryCaption || '',
    alternativeCaption: parsedData.alternativeCaption || '',
    hashtags: parsedData.hashtags || {
      industry: [],
      niche: [],
      topic: [],
      audience: [],
      productService: [],
      location: [],
      all: [],
    },
    seoKeywords: parsedData.seoKeywords || {
      mainTopic: [],
      productService: [],
      industry: [],
      audience: [],
      brand: [],
      searchIntent: [],
      all: [],
    },
    callToAction: parsedData.callToAction || '',
    contentSummary: parsedData.contentSummary || '',
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

  return finalResult;
}

export function getHealthInfo(apiKey?: string) {
  return {
    status: 'ok',
    brand: 'AEZEY AI Studio',
    tagline: 'AI-Powered Content Creation for Smarter Social Media',
    version: '1.0.0',
    hasApiKey: Boolean(apiKey),
    model: CANDIDATE_MODELS[0],
  };
}
