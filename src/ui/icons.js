// Spark Panic 2.1 - Crisp Inline Vector SVG Icon System
// Eliminates missing Unicode glyph boxes ('□') and provides custom alien diagrams

export const ICON_SVG = {
  // Glowing 4-point diamond Star Shard icon
  shard: (cls = 'w-4 h-4 text-cosmic-gold') => `
    <svg class="${cls} inline-block shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
    </svg>
  `,

  // 5-point Star Rating icon
  star: (cls = 'w-4 h-4 text-cosmic-gold', filled = true) => `
    <svg class="${cls} inline-block shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="${filled 
        ? 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' 
        : 'M12 4.5l2.2 4.46 4.93.72-3.56 3.47.84 4.91L12 15.75l-4.41 2.31.84-4.91-3.56-3.47 4.93-.72L12 4.5z'}" />
    </svg>
  `,

  // Crisp Modal Close Button 'X'
  close: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  `,

  // Planet / Celestial World
  planet: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <path d="M3.5 14.5c4-7 13-7 17 0" />
    </svg>
  `,

  // Rocket / Launch
  rocket: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2.5 5-2.5" />
      <path d="M12 15v5s3.03-.55 4.5-2c1.63-1.62 2.5-5 2.5-5" />
    </svg>
  `,

  // Retry / Refresh
  refresh: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  `,

  // Lightning Bolt
  bolt: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  `,

  // Shield
  shield: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  `,

  // Armory Wrench / Tool
  wrench: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  `,

  // Codex Book / Archive
  book: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  `,

  // Endless Infinity
  infinity: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18.178 8c5.096 0 5.096 8 0 8-2.695 0-4.717-3.238-6.178-5-1.461 1.762-3.483 5-6.178 5-5.096 0-5.096-8 0-8 2.695 0 4.717 3.238 6.178 5 1.461-1.762 3.483-5 6.178-5z" />
    </svg>
  `,

  // Audio / Speaker
  volume: (muted = false, cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      ${muted 
        ? '<line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />' 
        : '<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />'}
    </svg>
  `,

  // Pause
  pause: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  `,

  // Play
  play: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  `,

  // Arrow / Chevron Right
  arrowRight: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  `,

  // Map / Constellation Menu
  map: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  `,

  // Lock
  lock: (cls = 'w-3.5 h-3.5') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  `,

  // Crown / Boss
  crown: (cls = 'w-3.5 h-3.5 text-cosmic-gold') => `
    <svg class="${cls} inline-block shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 4l3 12h14l3-12-5 6-5-6-5 6z" />
    </svg>
  `,

  // Trophy
  trophy: (cls = 'w-4 h-4 text-cosmic-gold') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 2h12v7a6 6 0 0 1-12 0V2z" />
    </svg>
  `,

  // Supply Pod / Power-Up Crate
  pod: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  `,

  // Synthwave BGM / Musical Note
  music: (enabled = true, cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" fill="currentColor" />
      <circle cx="18" cy="16" r="3" fill="currentColor" />
      ${enabled ? '' : '<line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="2.5" />'}
    </svg>
  `,

  // Clipboard Copy
  copy: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  `,

  // Import / Download Save Code
  importSave: (cls = 'w-4 h-4') => `
    <svg class="${cls} inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  `,

  // Turret Chassis Diagrams
  chassisSvg: (chassisId) => {
    switch (chassisId) {
      case 'striker':
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0 drop-shadow-[0_0_8px_#00e5ff]">
            <circle cx="24" cy="24" r="8" fill="#042331" stroke="#00e5ff" stroke-width="2" />
            <path d="M12 28 L6 18 L18 20 Z M36 28 L42 18 L30 20 Z" fill="#0284c7" stroke="#00e5ff" stroke-width="1.5" />
            <rect x="20" y="8" width="3.5" height="14" rx="1" fill="#e2e8f0" stroke="#00e5ff" stroke-width="1.2" />
            <rect x="24.5" y="8" width="3.5" height="14" rx="1" fill="#e2e8f0" stroke="#00e5ff" stroke-width="1.2" />
            <circle cx="24" cy="24" r="3.5" fill="#00e5ff" />
          </svg>
        `;
      case 'tesla':
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0 drop-shadow-[0_0_8px_#e040fb]">
            <circle cx="24" cy="24" r="9" fill="#2d0538" stroke="#e040fb" stroke-width="2" />
            <path d="M16 10 L20 18 M32 10 L28 18" stroke="#00e5ff" stroke-width="2.5" stroke-linecap="round" />
            <circle cx="16" cy="10" r="2.5" fill="#00e5ff" />
            <circle cx="32" cy="10" r="2.5" fill="#00e5ff" />
            <path d="M19 14 Q24 9 29 14" stroke="#e040fb" stroke-width="2" fill="none" stroke-dasharray="2,2" />
            <polygon points="24,19 26,24 23,25 25,29 21,25 24,24" fill="#00e5ff" />
          </svg>
        `;
      case 'railgun':
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0 drop-shadow-[0_0_10px_#ffd700]">
            <circle cx="24" cy="28" r="9" fill="#332203" stroke="#ffd700" stroke-width="2" />
            <rect x="21" y="4" width="6" height="22" rx="1.5" fill="#1e293b" stroke="#ffd700" stroke-width="2" />
            <line x1="18" y1="10" x2="30" y2="10" stroke="#ff3366" stroke-width="2" stroke-linecap="round" />
            <line x1="18" y1="16" x2="30" y2="16" stroke="#ff3366" stroke-width="2" stroke-linecap="round" />
            <circle cx="24" cy="6" r="2" fill="#ffffff" />
            <circle cx="24" cy="28" r="4" fill="#ffd700" />
          </svg>
        `;
      default:
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0">
            <circle cx="24" cy="24" r="10" fill="#0f172a" stroke="#00e5ff" stroke-width="2" />
          </svg>
        `;
    }
  },

  // Distinct 48x48 Custom Ship Vector Graphics for 7 Alien Classes
  shipSvg: (classKey) => {
    switch (classKey) {
      case 'SCOUT':
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0 drop-shadow-[0_0_8px_#00e5ff]">
            <path d="M24 6 L38 38 L24 30 L10 38 Z" fill="#042331" stroke="#00e5ff" stroke-width="2" stroke-linejoin="round" />
            <polygon points="24,14 28,26 24,24 20,26" fill="#00e5ff" />
            <path d="M16 35 L16 42 M32 35 L32 42" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        `;
      case 'INTERCEPTOR':
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0 drop-shadow-[0_0_8px_#e040fb]">
            <path d="M24 6 L28 24 L38 16 L35 38 L24 32 L13 38 L10 16 L20 24 Z" fill="#2d0538" stroke="#e040fb" stroke-width="2" stroke-linejoin="round" />
            <circle cx="24" cy="9" r="2.5" fill="#f5d0fe" />
            <circle cx="38" cy="16" r="2" fill="#e040fb" />
            <circle cx="10" cy="16" r="2" fill="#e040fb" />
            <circle cx="24" cy="24" r="3" fill="#e040fb" />
          </svg>
        `;
      case 'CRYO':
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0 drop-shadow-[0_0_8px_#00e676]">
            <polygon points="24,6 40,15 40,33 24,42 8,33 8,15" fill="#042a17" stroke="#00e676" stroke-width="2" />
            <polygon points="24,14 32,19 32,29 24,34 16,29 16,19" fill="#00e67633" stroke="#69f0ae" stroke-width="1.5" />
            <circle cx="24" cy="24" r="4" fill="#69f0ae" />
          </svg>
        `;
      case 'PHASE':
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0 drop-shadow-[0_0_8px_#a855f7]">
            <polygon points="24,4 42,24 24,44 6,24" fill="none" stroke="#a855f7" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.5" />
            <polygon points="24,8 38,24 24,40 10,24" fill="#1e0b36" stroke="#c084fc" stroke-width="2" />
            <line x1="24" y1="8" x2="24" y2="40" stroke="#a855f7" stroke-width="1.5" />
            <circle cx="24" cy="24" r="4.5" fill="#d8b4fe" />
          </svg>
        `;
      case 'DROPSHIP':
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0 drop-shadow-[0_0_8px_#ff3366]">
            <path d="M16 10 L32 10 L40 22 L36 38 L12 38 L8 22 Z" fill="#3b0816" stroke="#ff3366" stroke-width="2" stroke-linejoin="round" />
            <rect x="4" y="20" width="7" height="15" rx="2" fill="#ff336644" stroke="#ff3366" stroke-width="1.5" />
            <rect x="37" y="20" width="7" height="15" rx="2" fill="#ff336644" stroke="#ff3366" stroke-width="1.5" />
            <polygon points="20,14 28,14 30,22 18,22" fill="#ff3366" />
            <circle cx="24" cy="30" r="3" fill="#fecdd3" />
          </svg>
        `;
      case 'DREADNOUGHT':
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0 drop-shadow-[0_0_10px_#ffd700]">
            <line x1="16" y1="4" x2="16" y2="16" stroke="#ffd700" stroke-width="2.5" />
            <line x1="32" y1="4" x2="32" y2="16" stroke="#ffd700" stroke-width="2.5" />
            <path d="M24 10 L36 18 L42 34 L32 42 L16 42 L6 34 L12 18 Z" fill="#332203" stroke="#ffd700" stroke-width="2" stroke-linejoin="round" />
            <circle cx="16" cy="18" r="3" fill="#ffd700" />
            <circle cx="32" cy="18" r="3" fill="#ffd700" />
            <circle cx="24" cy="28" r="6" fill="#ffd700" />
            <circle cx="24" cy="28" r="3" fill="#ffffff" />
          </svg>
        `;
      case 'BOSS':
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0 drop-shadow-[0_0_12px_#ff1744]">
            <path d="M12 4 L18 18 L14 26 M36 4 L30 18 L34 26" stroke="#ffd700" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <path d="M24 12 L38 22 L44 38 L34 44 L24 38 L14 44 L4 38 L10 22 Z" fill="#38020c" stroke="#ff1744" stroke-width="2.5" stroke-linejoin="round" />
            <circle cx="24" cy="28" r="8" fill="none" stroke="#ffd700" stroke-width="1.5" stroke-dasharray="3,2" />
            <circle cx="24" cy="28" r="4.5" fill="#ff1744" />
            <circle cx="24" cy="28" r="2" fill="#ffffff" />
          </svg>
        `;
      default:
        return `
          <svg viewBox="0 0 48 48" class="w-12 h-12 shrink-0">
            <polygon points="24,8 40,38 8,38" fill="#1e293b" stroke="#00e5ff" stroke-width="2" />
          </svg>
        `;
    }
  }
};
