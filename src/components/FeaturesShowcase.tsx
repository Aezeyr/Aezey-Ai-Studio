import React from 'react';
import {
  ScanText,
  Video,
  Languages,
  ShieldCheck,
  Sparkles,
  Zap,
  TrendingUp,
  Share2,
} from 'lucide-react';

export const FeaturesShowcase: React.FC = () => {
  const features = [
    {
      icon: <ScanText className="w-6 h-6 text-cyan-400" />,
      title: 'Dynamic Brand Recognition',
      description:
        'Zero hardcoded data or generic hallucinations. Recognizes the exact brand name, logo, phone numbers, URLs, and offers visible in your upload.',
    },
    {
      icon: <Video className="w-6 h-6 text-blue-400" />,
      title: '30s Video Frame Analysis',
      description:
        'Analyzes short videos (MP4, MOV, WEBM ≤ 30s) across multiple timeline snapshots—not just the opening frame. Detects scene shifts, products, and visual cues.',
    },
    {
      icon: <Languages className="w-6 h-6 text-emerald-400" />,
      title: 'Auto Language Detection',
      description:
        'Native support for English, natural Urdu (Nastaliq script), and mixed Urdu-English (Roman Urdu). No awkward or robotic translations.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      title: 'Dual Captions & Custom Hooks',
      description:
        'Receive both a primary high-converting caption and an alternative creative variation with hooks designed to stop the social media scroll.',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-amber-400" />,
      title: 'Categorized Social Hashtags',
      description:
        'Organized into Industry, Niche, Topic, and Audience tags for optimal algorithm distribution on Instagram, TikTok, Facebook, and LinkedIn.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-cyan-300" />,
      title: 'Zero Permanent Media Storage',
      description:
        'Your photos and videos are processed securely in memory and discarded immediately after generation for maximum user privacy.',
    },
  ];

  return (
    <section className="w-full py-12 border-t border-slate-800/80">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/60 border border-cyan-500/20 px-3 py-1 rounded-full">
          Engineered For Marketers & Creators
        </span>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
          Smarter Social Media In Seconds
        </h3>
        <p className="text-sm text-slate-400 mt-2">
          From digital agencies and resellers to local brands and content creators—AEZEY AI Studio
          delivers publish-ready copy grounded in real visual evidence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-sm group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-cyan-500/40 transition-all">
              {feature.icon}
            </div>
            <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              {feature.title}
            </h4>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
