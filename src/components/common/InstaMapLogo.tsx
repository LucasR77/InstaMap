import React from 'react'

interface InstaMapLogoProps {
  size?: number | string
  className?: string
  showText?: boolean
  textClassName?: string
}

export const InstaMapLogo: React.FC<InstaMapLogoProps> = ({
  size = 32,
  className = '',
  showText = true,
  textClassName = ''
}) => {
  return (
    <div className={`flex items-center gap-2.5 shrink-0 ${className}`}>
      {/* Brand Icon: Matches the exact mindmap aesthetic with Yellow, Violet & Celeste pastel accents */}
      <div
        className="relative rounded-xl overflow-hidden shadow-xs border border-slate-200/80 shrink-0 transition-transform duration-200 hover:scale-105"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full select-none"
        >
          <defs>
            <filter id="concept-map-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#1e293b" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Off-white / Canvas Background */}
          <rect width="36" height="36" rx="9" fill="#FAF9F6" stroke="#E5DFD5" strokeWidth="1" />

          {/* Background Canvas Dots */}
          <circle cx="8" cy="8" r="0.6" fill="#94A3B8" opacity="0.35" />
          <circle cx="18" cy="8" r="0.6" fill="#94A3B8" opacity="0.35" />
          <circle cx="28" cy="8" r="0.6" fill="#94A3B8" opacity="0.35" />
          <circle cx="8" cy="18" r="0.6" fill="#94A3B8" opacity="0.35" />
          <circle cx="18" cy="18" r="0.6" fill="#94A3B8" opacity="0.35" />
          <circle cx="28" cy="18" r="0.6" fill="#94A3B8" opacity="0.35" />
          <circle cx="8" cy="28" r="0.6" fill="#94A3B8" opacity="0.35" />
          <circle cx="18" cy="28" r="0.6" fill="#94A3B8" opacity="0.35" />
          <circle cx="28" cy="28" r="0.6" fill="#94A3B8" opacity="0.35" />

          {/* Top Branch (Celeste / Sky Blue) */}
          <path
            d="M 16 16 C 18.5 16, 19.5 10.5, 22 10.5"
            stroke="#0284C7"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Bottom Branch (Violeta / Purple) */}
          <path
            d="M 16 20 C 18.5 20, 19.5 25.5, 22 25.5"
            stroke="#9333EA"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Root Node (Left: Beige / Amarillo Cálido) */}
          <rect
            x="4"
            y="12"
            width="12.5"
            height="12"
            rx="3.5"
            fill="#FAEDCD"
            stroke="#D4A373"
            strokeWidth="1.2"
            filter="url(#concept-map-shadow)"
          />
          <line x1="6.5" y1="16.5" x2="14" y2="16.5" stroke="#432818" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="7.5" y1="19.5" x2="13" y2="19.5" stroke="#432818" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />

          {/* Top Right Subnode (Celeste / Pastel Sky Blue) */}
          <rect
            x="22"
            y="6"
            width="10.5"
            height="9"
            rx="2.5"
            fill="#E0F2FE"
            stroke="#0284C7"
            strokeWidth="1.1"
            filter="url(#concept-map-shadow)"
          />
          <line x1="24.5" y1="10.5" x2="30" y2="10.5" stroke="#0369A1" strokeWidth="1.2" strokeLinecap="round" />

          {/* Bottom Right Subnode (Violeta / Pastel Lavender) */}
          <rect
            x="22"
            y="21"
            width="10.5"
            height="9"
            rx="2.5"
            fill="#F3E8FF"
            stroke="#9333EA"
            strokeWidth="1.1"
            filter="url(#concept-map-shadow)"
          />
          <line x1="24.5" y1="25.5" x2="30" y2="25.5" stroke="#7E22CE" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Title Text: Insta + M (Amarilla) + a (Violeta) + p (Celeste) */}
      {showText && (
        <span
          className={`font-black text-base tracking-tight text-slate-900 font-sans select-none ${textClassName}`}
        >
          Insta
          <span className="text-amber-500 font-black">M</span>
          <span className="text-violet-500 font-black">a</span>
          <span className="text-sky-500 font-black">p</span>
        </span>
      )}
    </div>
  )
}
