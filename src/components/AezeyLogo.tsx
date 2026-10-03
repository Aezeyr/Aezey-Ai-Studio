import React from 'react';

interface AezeyLogoProps {
  variant?: 'full' | 'icon' | 'horizontal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const AezeyLogo: React.FC<AezeyLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showTagline = false,
}) => {
  // Heights and dimensions based on size
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const subTextSizes = {
    sm: 'text-[9px] tracking-[0.25em]',
    md: 'text-xs tracking-[0.3em]',
    lg: 'text-sm tracking-[0.35em]',
    xl: 'text-base tracking-[0.4em]',
  };

  const renderIconMark = () => (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${iconSizes[size]} transition-transform duration-300 group-hover:scale-105 shrink-0`}
      aria-label="AEZEY AI Studio Logo Mark"
    >
      <defs>
        <linearGradient id="mark_blue_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="mark_cyan_glow" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>
        <linearGradient id="mark_dark_fold" x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <filter id="mark_glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00F0FF" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Left Main Backbone of A */}
      <path
        d="M52 14 L20 85 C17 92 21 99 29 99 L38 99 L60 48 L46 22 Z"
        fill="url(#mark_dark_fold)"
      />

      {/* Outer Bevel Highlight Left */}
      <path
        d="M52 14 L20 85 C18 90 22 95 27 95 L34 95 L58 42 Z"
        fill="url(#mark_blue_grad)"
      />

      {/* Right Dynamic Fold */}
      <path
        d="M52 14 L78 72 C81 78 77 86 70 88 L52 92 L62 70 L48 40 Z"
        fill="url(#mark_blue_grad)"
      />

      {/* Lower Sharp Base */}
      <path d="M40 85 L76 85 L84 97 L36 97 Z" fill="url(#mark_blue_grad)" />

      {/* Glowing Cyan Wing Accent */}
      <path
        d="M48 78 L68 78 L60 96 C50 94 44 88 48 78 Z"
        fill="url(#mark_cyan_glow)"
        filter="url(#mark_glow)"
      />

      {/* Circuit Lines & Connection Nodes Branching Right */}
      <path
        d="M66 50 L84 50 L92 42 L102 42"
        stroke="#00F0FF"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="104" cy="42" r="3.5" fill="#00F0FF" filter="url(#mark_glow)" />

      <path
        d="M70 60 L90 60 L98 56 L108 56"
        stroke="#38BDF8"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="110" cy="56" r="3.5" fill="#38BDF8" />

      <path
        d="M68 68 L86 68 L94 76 L104 76"
        stroke="#0284C7"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="106" cy="76" r="3.5" fill="#0284C7" />

      <path
        d="M74 55 L82 55 L88 64 L96 64"
        stroke="#00D2FF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="98" cy="64" r="2.5" fill="#00F0FF" />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{renderIconMark()}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {renderIconMark()}

      <div className="flex flex-col">
        {/* Brand Name: ΛEZEY with distinct cyan triangle accent in A */}
        <div className={`flex items-center tracking-wider font-extrabold text-white leading-none ${textSizes[size]}`}>
          {/* Custom Styled Chevron A */}
          <span className="relative inline-flex items-center justify-center mr-0.5">
            <span className="text-white font-black">Λ</span>
            <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-cyan-400" />
          </span>
          <span className="text-white">EZ</span>
          <span className="text-white">E</span>
          <span className="text-cyan-400">Y</span>
        </div>

        {/* Subtitle: — AI Studio — */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="h-[1.5px] w-3.5 bg-gradient-to-r from-transparent to-cyan-400 rounded-full" />
          <span className={`font-semibold uppercase text-cyan-300/90 whitespace-nowrap ${subTextSizes[size]}`}>
            AI Studio
          </span>
          <span className="h-[1.5px] w-3.5 bg-gradient-to-l from-transparent to-cyan-400 rounded-full" />
        </div>

        {showTagline && (
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            AI-Powered Content Creation for Smarter Social Media
          </p>
        )}
      </div>
    </div>
  );
};
