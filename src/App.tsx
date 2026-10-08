import React, { useState, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Layers,
  Flame,
  Globe,
  Key,
} from 'lucide-react';
import { AezeyLogo } from './components/AezeyLogo';
import { MediaUploader } from './components/MediaUploader';
import { ResultsDisplay } from './components/ResultsDisplay';
import { FeaturesShowcase } from './components/FeaturesShowcase';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AnalysisResult, MediaType, TargetPlatform, ContentTone } from './types';

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // In-app API Key Management (overrides or tests keys without redeploying)
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('aezey_custom_api_key') || '';
    } catch {
      return '';
    }
  });

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    try {
      if (key) {
        localStorage.setItem('aezey_custom_api_key', key);
      } else {
        localStorage.removeItem('aezey_custom_api_key');
      }
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  };

  const handleClearApiKey = () => {
    setCustomApiKey('');
    try {
      localStorage.removeItem('aezey_custom_api_key');
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  };

  // Cached last request payload for 1-click regeneration
  const [lastPayload, setLastPayload] = useState<any | null>(null);

  const generatorRef = useRef<HTMLDivElement>(null);

  const scrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartAnalysis = async (payload: {
    mediaType: MediaType;
    mimeType: string;
    base64Data: string;
    videoFrames?: string[];
    fileName: string;
    fileSize: number;
    duration?: number;
    platform: TargetPlatform;
    tone: ContentTone;
    customInstructions?: string;
  }) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setLastPayload(payload);

    setAnalysisStep('Initiating multi-modal visual inspection...');

    try {
      // Step simulation for responsive feedback
      const stepTimer1 = setTimeout(() => {
        setAnalysisStep('Scanning for dynamic brand, visible text, and logos...');
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        setAnalysisStep('Detecting language, pricing, contact details, and offers...');
      }, 2600);

      const stepTimer3 = setTimeout(() => {
        setAnalysisStep('Synthesizing captions, hashtags, SEO keywords, and CTAs...');
      }, 4200);

      const requestPayload = {
        ...payload,
        apiKey: customApiKey || undefined,
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-goog-api-key': customApiKey } : {}),
        },
        body: JSON.stringify(requestPayload),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          throw new Error('Server returned an invalid JSON response. Please check server logs.');
        }
      } else {
        const textBody = await response.text();
        throw new Error(
          `Server returned status ${response.status} (${response.statusText})${textBody ? `: ${textBody.slice(0, 150)}` : ''}`
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || `Request failed with status ${response.status}. Please verify your file and try again.`
        );
      }

      setResult(data.data);
      // Auto-scroll to results smoothly
      setTimeout(() => {
        window.scrollTo({
          top: (generatorRef.current?.offsetTop || 0) + 380,
          behavior: 'smooth',
        });
      }, 300);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(
        err?.message ||
          'Connection error or analysis timeout. Please ensure the server has network access and retry.'
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleRegenerate = () => {
    if (lastPayload) {
      handleStartAnalysis(lastPayload);
    }
  };

  const handleClearResults = () => {
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Brand Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <AezeyLogo size="md" />

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={scrollToGenerator}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              AI Generator
            </button>
            <a href="#features" className="hover:text-cyan-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">
              How It Works
            </a>
          </nav>

          {/* Right Status Badge & CTA */}
          <div className="flex items-center gap-3">
            {/* API Key Settings Button */}
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                customApiKey
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60'
                  : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800'
              }`}
              title="Configure Gemini API Key"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">
                {customApiKey ? 'Custom Key' : 'API Key'}
              </span>
              <span className="sm:hidden">Key</span>
              {customApiKey && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
            </button>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Gemini 3.8 Flash Online
            </span>

            <button
              onClick={scrollToGenerator}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Create Content
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-12">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto pt-4 sm:pt-8 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Official AEZEY AI Studio Platform
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            AI-Powered Content Creation for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
              Smarter Social Media
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 mt-5 max-w-2xl leading-relaxed">
            Generate high-converting social media captions, alternative hooks, targeted hashtags,
            SEO keywords, and tailored CTAs from any uploaded image or short video clip.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <button
              onClick={scrollToGenerator}
              className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-xl shadow-blue-500/25 transition-all transform hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all"
            >
              Explore Capabilities
            </a>
          </div>

          {/* Quick Metrics / Guarantees */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 w-full max-w-2xl text-left border-y border-slate-800/80 py-4">
            <div>
              <span className="text-xs text-slate-400">Dynamic Recognition</span>
              <p className="text-sm font-bold text-white mt-0.5">Brand & Text</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Video Analysis</span>
              <p className="text-sm font-bold text-white mt-0.5">Up to 30 Seconds</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Language Detection</span>
              <p className="text-sm font-bold text-white mt-0.5">English, Urdu, Mixed</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Data Policy</span>
              <p className="text-sm font-bold text-white mt-0.5">Zero Storage</p>
            </div>
          </div>
        </section>

        {/* AI Content Generator Section */}
        <section ref={generatorRef} id="generator" className="w-full scroll-mt-24">
          <MediaUploader onStartAnalysis={handleStartAnalysis} isAnalyzing={isAnalyzing} />

          {/* Processing Loading Indicator */}
          {isAnalyzing && (
            <div className="mt-8 p-8 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-center flex flex-col items-center justify-center backdrop-blur-xl animate-in fade-in duration-300">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white">Analyzing Media & Recognizing Context</h3>
              <p className="text-sm text-cyan-300 mt-1 font-medium animate-pulse">
                {analysisStep || 'Processing image frames with Gemini 3.8 Flash...'}
              </p>
              <p className="text-xs text-slate-400 mt-3 max-w-md">
                Preserving exact visible brand names, numbers, offers, and language nuances without
                generic assumptions.
              </p>
            </div>
          )}

          {/* Error Display */}
          {errorMessage && (
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-sm text-red-200">Processing Failed</p>
                  <p className="text-xs text-red-300 leading-relaxed">{errorMessage}</p>
                </div>
                {(errorMessage.includes('authentication') ||
                  errorMessage.includes('401') ||
                  errorMessage.includes('UNAUTHENTICATED') ||
                  errorMessage.includes('GEMINI_API_KEY')) && (
                  <button
                    onClick={() => setIsApiKeyModalOpen(true)}
                    className="self-start sm:self-center shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Update / Configure API Key
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Generated Results */}
          {result && (
            <ResultsDisplay
              result={result}
              onRegenerate={handleRegenerate}
              onClear={handleClearResults}
              isRegenerating={isAnalyzing}
            />
          )}
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-10 border-t border-slate-800/80">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Simple 3-Step Workflow
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              How AEZEY AI Studio Works
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-cyan-400 font-black text-sm flex items-center justify-center mb-4">
                01
              </div>
              <h4 className="text-base font-bold text-white">Upload Media Asset</h4>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Drop in a photo (JPG, PNG, WEBP) or short video clip (MP4, MOV, WEBM) up to 30
                seconds. The client validates duration automatically.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/30 text-cyan-400 font-black text-sm flex items-center justify-center mb-4">
                02
              </div>
              <h4 className="text-base font-bold text-white">Deep Context Analysis</h4>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Gemini 3.8 Flash extracts visible brand logos, exact text, product lines, contact
                numbers, discount offers, and detects English or Urdu nuances.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-cyan-400 font-black text-sm flex items-center justify-center mb-4">
                03
              </div>
              <h4 className="text-base font-bold text-white">Publish-Ready Results</h4>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Receive dual captions, categorized hashtag sets, high-intent SEO keywords, and
                compelling CTAs with 1-click copying.
              </p>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        <section id="features">
          <FeaturesShowcase />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <AezeyLogo size="md" showTagline />
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              Empowering creators, digital agencies, freelancers, and businesses with authentic,
              visually grounded social media intelligence.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-2">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Zero Media Retention
              </span>
              <span>•</span>
              <span>Secure Gemini API</span>
              <span>•</span>
              <span>Cloud Run Hosted</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              &copy; {new Date().getFullYear()} AEZEY AI Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentKey={customApiKey}
        onSaveKey={handleSaveApiKey}
        onClearKey={handleClearApiKey}
      />
    </div>
  );
}
