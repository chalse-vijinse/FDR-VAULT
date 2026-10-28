import React from 'react';

/**
 * FDRvault Brand Logo
 * Combines an FDR document certificate, protective security shield, and precision vault lock.
 * Colors: Deep Navy (#12345A), Royal Blue (#2563EB), Accent Teal (#14B8A6).
 * Tagline: "Secure Deposits. Smarter Management."
 */
export default function FdrVaultLogo({
  size = 'md',
  theme = 'light', // 'light' (on white/light bg) or 'dark' (on dark navy/slate bg)
  showTagline = true,
  iconOnly = false,
  className = ''
}) {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-base', tagline: 'text-[9px]', sub: 'text-[10px]' },
    md: { icon: 'w-9 h-9', text: 'text-lg', tagline: 'text-[10px]', sub: 'text-[11px]' },
    lg: { icon: 'w-11 h-11', text: 'text-2xl', tagline: 'text-xs', sub: 'text-xs' },
    xl: { icon: 'w-14 h-14', text: 'text-3xl', tagline: 'text-sm', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon SVG: Shield + FDR Document + Vault Dial */}
      <div className={`relative ${currentSize.icon} shrink-0 transition-transform duration-200 hover:scale-105`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="vaultShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#12345A" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="vaultTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#14B8A6" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Protective Shield Geometry */}
          <path
            d="M24 3.5L6.5 10.8V22.2C6.5 33.1 13.9 43.1 24 46C34.1 43.1 41.5 33.1 41.5 22.2V10.8L24 3.5Z"
            fill="url(#vaultShieldGrad)"
            stroke={isDark ? '#38BDF8' : '#3B82F6'}
            strokeWidth="1.2"
          />

          {/* FDR Certificate Document Shape with Folded Top-Right Corner */}
          <path
            d="M14 14C14 12.8954 14.8954 12 16 12H28L34 18V34C34 35.1046 33.1046 36 32 36H16C14.8954 36 14 35.1046 14 34V14Z"
            fill="#FFFFFF"
            fillOpacity="0.14"
            stroke="#FFFFFF"
            strokeWidth="1.4"
          />
          {/* Document Fold Flap */}
          <path
            d="M28 12V18H34"
            stroke="#FFFFFF"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Precision Vault Lock Dial */}
          <circle
            cx="24"
            cy="27"
            r="6.5"
            fill="url(#vaultTealGrad)"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            filter="url(#softGlow)"
          />
          <circle cx="24" cy="27" r="2.2" fill="#FFFFFF" />

          {/* Vault Dial Radial Latches */}
          <path
            d="M24 20.5V22.5M24 31.5V33.5M17.5 27H19.5M28.5 27H30.5"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {!iconOnly && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-extrabold tracking-tight ${currentSize.text} ${
                isDark ? 'text-white' : 'text-[#12345A]'
              }`}
            >
              FDR<span className="text-[#2563EB] dark:text-[#38BDF8]">vault</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-600 border border-teal-500/30">
              AICTE
            </span>
          </div>

          {showTagline && (
            <span
              className={`font-medium tracking-normal mt-0.5 ${currentSize.tagline} ${
                isDark ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Secure Deposits. Smarter Management.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
