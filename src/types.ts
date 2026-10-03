/**
 * AEZEY AI Studio - Type Definitions
 * AI-Powered Content Creation for Smarter Social Media
 */

export type MediaType = 'image' | 'video';

export type ContentTone = 'engaging' | 'professional' | 'promotional' | 'storytelling' | 'casual';

export type TargetPlatform = 'all' | 'instagram' | 'linkedin' | 'facebook' | 'tiktok' | 'twitter';

export interface AnalysisRequest {
  mediaType: MediaType;
  mimeType: string;
  base64Data?: string;
  videoFrames?: string[]; // Base64 JPEG frames for multi-frame video comprehension
  fileName: string;
  fileSize: number;
  duration?: number; // In seconds for videos
  platform?: TargetPlatform;
  tone?: ContentTone;
  customInstructions?: string;
}

export interface HashtagGroup {
  industry: string[];
  niche: string[];
  topic: string[];
  audience: string[];
  productService: string[];
  location?: string[];
  all: string[];
}

export interface SeoKeywordGroup {
  mainTopic: string[];
  productService: string[];
  industry: string[];
  audience: string[];
  brand: string[];
  searchIntent: string[];
  all: string[];
}

export interface DetectedContext {
  detectedBrand: string | null;
  hasBrand: boolean;
  visibleText: string[];
  detectedLanguage: 'English' | 'Urdu' | 'Mixed (Urdu-English)' | string;
  tone: string;
  mainTopic: string;
  promotionalIntent: 'High' | 'Medium' | 'Low' | 'Informational' | 'Educational';
  targetAudience: string;
  contactInfoFound?: {
    phone?: string;
    email?: string;
    website?: string;
    prices?: string;
    offers?: string;
  };
  visualHighlights: string[];
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  primaryCaption: string;
  alternativeCaption: string;
  hashtags: HashtagGroup;
  seoKeywords: SeoKeywordGroup;
  callToAction: string;
  contentSummary: string;
  detectedContext: DetectedContext;
  platform?: TargetPlatform;
  tone?: ContentTone;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}
