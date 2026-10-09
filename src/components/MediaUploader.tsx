import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video,
  X,
  Sparkles,
  AlertCircle,
  Clock,
  FileCheck,
  Zap,
  Sliders,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  MediaType,
  TargetPlatform,
  ContentTone,
  MarketingFormula,
} from '../types';
import {
  validateImageFile,
  validateVideoFile,
  extractVideoKeyframes,
  optimizeImageForAnalysis,
  fileToBase64,
  formatBytes,
  formatDuration,
  MAX_VIDEO_DURATION_SECONDS,
} from '../utils/mediaUtils';
import { SAMPLE_PRESETS, SamplePreset } from '../utils/sampleData';

interface MediaUploaderProps {
  onStartAnalysis: (payload: {
    mediaType: MediaType;
    mimeType: string;
    base64Data: string;
    videoFrames?: string[];
    fileName: string;
    fileSize: number;
    duration?: number;
    platform: TargetPlatform;
    tone: ContentTone;
    formula?: MarketingFormula;
    customInstructions?: string;
  }) => void;
  isAnalyzing: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onStartAnalysis,
  isAnalyzing,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Settings
  const [platform, setPlatform] = useState<TargetPlatform>('all');
  const [tone, setTone] = useState<ContentTone>('engaging');
  const [formula, setFormula] = useState<MarketingFormula>('standard');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    setError(null);
    setIsValidating(true);

    const isVideo =
      selectedFile.type.startsWith('video/') ||
      /\.(mp4|mov|webm)$/i.test(selectedFile.name);

    if (isVideo) {
      const validation = await validateVideoFile(selectedFile);
      if (!validation.valid) {
        setError(validation.error || 'Video validation failed.');
        setIsValidating(false);
        return;
      }

      setFile(selectedFile);
      setMediaType('video');
      setDuration(validation.duration);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setIsValidating(false);
    } else {
      const validation = validateImageFile(selectedFile);
      if (!validation.valid) {
        setError(validation.error || 'Image validation failed.');
        setIsValidating(false);
        return;
      }

      setFile(selectedFile);
      setMediaType('image');
      setDuration(undefined);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    if (previewUrl && !previewUrl.startsWith('data:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setDuration(undefined);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadSamplePreset = (preset: SamplePreset) => {
    handleClear();
    const dataUrl = preset.generateDataUrl();
    setPreviewUrl(dataUrl);
    setMediaType('image');
    setFile(
      new File([new Blob()], `${preset.id}-sample.jpg`, { type: 'image/jpeg' })
    );
    setError(null);
  };

  const handleSubmitWithFormula = async (selectedFormula?: MarketingFormula) => {
    const activeFormula = selectedFormula !== undefined ? selectedFormula : formula;
    if (selectedFormula !== undefined) {
      setFormula(selectedFormula);
    }

    if (!previewUrl && !file) {
      setError(
        selectedFormula && selectedFormula !== 'standard'
          ? `Please select or drag in an image or video first, then click ${selectedFormula} to generate.`
          : 'Please select or drag in an image or video first.'
      );
      return;
    }

    try {
      let base64Data = '';
      let videoFrames: string[] = [];

      if (file && file.size > 0) {
        if (mediaType === 'video') {
          // Extract keyframes for reliable visual multi-frame comprehension
          videoFrames = await extractVideoKeyframes(file, 5);
          // Only send full raw video base64 if keyframe extraction was not possible
          if (!videoFrames || videoFrames.length === 0) {
            base64Data = await fileToBase64(file);
          }
        } else {
          base64Data = await optimizeImageForAnalysis(file);
        }
      } else if (previewUrl && previewUrl.startsWith('data:')) {
        base64Data = previewUrl;
      }

      onStartAnalysis({
        mediaType,
        mimeType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        base64Data,
        videoFrames: videoFrames.length > 0 ? videoFrames : undefined,
        fileName: file?.name || 'media-sample.jpg',
        fileSize: file?.size || base64Data.length * 0.75,
        duration,
        platform,
        tone,
        formula: activeFormula !== 'standard' ? activeFormula : undefined,
        customInstructions: customInstructions.trim() || undefined,
      });
    } catch (err: any) {
      setError(err?.message || 'Error preparing media for analysis. Please try again.');
    }
  };

  const handleSubmit = () => {
    handleSubmitWithFormula(formula);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Decorative gradient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Capabilities */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>Upload Media & Generate Content</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Supported: Images (JPG, PNG, WEBP) & Videos (MP4, MOV, WEBM ≤ 30s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Dynamic Recognition
          </span>
        </div>
      </div>

      {/* Error Message Banner */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-red-300">Upload Validation Error</p>
            <p className="mt-0.5 text-red-200/90 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Zone / Media Preview */}
      {!previewUrl ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-6 border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px] ${
            dragActive
              ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
              : 'border-slate-700/80 hover:border-slate-500 bg-slate-950/50 hover:bg-slate-900/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/30 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8" />
          </div>

          <p className="text-base sm:text-lg font-semibold text-white">
            Drag & drop your image or short video here
          </p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
            or click to browse from your device. Videos must be{' '}
            <strong className="text-cyan-300">30 seconds or less</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-5 text-xs text-slate-400">
            <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-md">
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              JPG, PNG, WEBP (≤ 25MB)
            </span>
            <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-md">
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              MP4, MOV, WEBM (≤ 30s)
            </span>
          </div>

          {isValidating && (
            <div className="mt-4 flex items-center gap-2 text-cyan-400 text-sm">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              Validating media properties...
            </div>
          )}
        </div>
      ) : (
        /* Preview Card */
        <div className="mt-6 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row items-center gap-5">
            {/* Visual Preview Box */}
            <div className="w-full md:w-80 h-56 md:h-64 bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800 shrink-0">
              {mediaType === 'image' ? (
                <img
                  src={previewUrl}
                  alt="Uploaded media preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}

              <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                {mediaType}
              </span>
            </div>

            {/* File Details & Quick Actions */}
            <div className="flex-1 w-full flex flex-col justify-between self-stretch">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white line-clamp-1">
                      {file?.name || 'Selected Media Asset'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {file?.size ? (
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {formatBytes(file.size)}
                        </span>
                      ) : null}

                      {duration !== undefined && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 font-semibold ${
                            duration <= MAX_VIDEO_DURATION_SECONDS
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-950/80 text-red-300 border border-red-500/30'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {formatDuration(duration)} / 30s Max
                        </span>
                      )}

                      <span className="text-xs bg-cyan-950/60 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        Ready for AI Analysis
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleClear}
                    disabled={isAnalyzing}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/80 hover:text-red-300 text-slate-400 transition-colors"
                    title="Remove media"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  The AI will inspect visual context, extract visible text, recognize the brand
                  dynamically, detect language (English/Urdu/Mixed), and generate captions, hashtags,
                  SEO keywords, and call-to-action text.
                </p>
              </div>

              {/* Controls Toggle */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  {showAdvanced ? 'Hide Customization Options' : 'Tune Platform & Tone'}
                </button>

                <button
                  onClick={handleClear}
                  disabled={isAnalyzing}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Change File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive 1-Click Test Presets */}
      {!previewUrl && (
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Quick Test Presets (Instant 1-Click Load)
            </span>
            <span className="text-[11px] text-slate-400">
              Click any sample to test dynamic brand recognition
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => loadSamplePreset(preset)}
                className="text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {preset.title}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      preset.language === 'Urdu'
                        ? 'bg-emerald-950 text-emerald-300'
                        : preset.language === 'Mixed'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-blue-950 text-blue-300'
                    }`}
                  >
                    {preset.language}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Customization: Platform, Tone, Custom Instructions */}
      {(showAdvanced || previewUrl) && (
        <div className="mt-5 p-4 rounded-xl bg-slate-950/50 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as TargetPlatform)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
            >
              <option value="all">All Platforms (Universal)</option>
              <option value="instagram">Instagram (Reels & Feed)</option>
              <option value="linkedin">LinkedIn (Professional)</option>
              <option value="facebook">Facebook (Business Page)</option>
              <option value="tiktok">TikTok (Short Video)</option>
              <option value="twitter">X / Twitter (Concise Hook)</option>
            </select>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Content Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as ContentTone)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
            >
              <option value="engaging">Engaging & High Conversion</option>
              <option value="professional">Professional & Corporate</option>
              <option value="promotional">Promotional & Sales-Driven</option>
              <option value="storytelling">Storytelling & Emotional</option>
              <option value="casual">Casual & Friendly</option>
            </select>
          </div>

          {/* Custom Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Special Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors resize-none"
            />
          </div>
        </div>
      )}

      {/* Marketing Copy Formulas Feature: AIDA, PAS, BAB Buttons */}
      <div className="mt-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Marketing Formulas (1-Click Generate)
            </h3>
            {formula !== 'standard' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                Selected: {formula}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            Click any button to generate caption & hashtags strictly following that formula
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* AIDA Formula Button */}
          <button
            type="button"
            onClick={() => handleSubmitWithFormula('AIDA')}
            disabled={isAnalyzing}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 group cursor-pointer ${
              formula === 'AIDA'
                ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 hover:border-cyan-500/50 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                AIDA
              </span>
              <span className="text-[10px] uppercase font-semibold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/50">
                Formula
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-snug">
              Attention • Interest • Desire • Action
            </p>
            <span className="text-[11px] font-semibold text-cyan-400 mt-2.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Generate with AIDA →
            </span>
          </button>

          {/* PAS Formula Button */}
          <button
            type="button"
            onClick={() => handleSubmitWithFormula('PAS')}
            disabled={isAnalyzing}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 group cursor-pointer ${
              formula === 'PAS'
                ? 'bg-amber-950/90 border-amber-400 text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 hover:border-amber-500/50 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                PAS
              </span>
              <span className="text-[10px] uppercase font-semibold text-amber-400 px-2 py-0.5 rounded bg-amber-950 border border-amber-800/50">
                Formula
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-snug">
              Problem • Agitate • Solution
            </p>
            <span className="text-[11px] font-semibold text-amber-400 mt-2.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Generate with PAS →
            </span>
          </button>

          {/* BAB Formula Button */}
          <button
            type="button"
            onClick={() => handleSubmitWithFormula('BAB')}
            disabled={isAnalyzing}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 group cursor-pointer ${
              formula === 'BAB'
                ? 'bg-purple-950/90 border-purple-400 text-white shadow-lg shadow-purple-500/20 ring-1 ring-purple-400'
                : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 hover:border-purple-500/50 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                BAB
              </span>
              <span className="text-[10px] uppercase font-semibold text-purple-400 px-2 py-0.5 rounded bg-purple-950 border border-purple-800/50">
                Formula
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-snug">
              Before • After • Bridge
            </p>
            <span className="text-[11px] font-semibold text-purple-400 mt-2.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Generate with BAB →
            </span>
          </button>
        </div>
      </div>

      {/* Main CTA Button */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          Powered by <strong className="text-slate-300">Gemini 3.8 Flash</strong>. Media is
          processed on server and never permanently stored.
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!previewUrl || isAnalyzing}
          className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
            previewUrl && !isAnalyzing
              ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Media Content...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Content & SEO</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
