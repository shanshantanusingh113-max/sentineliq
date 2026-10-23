// SentinelIQ design tokens - warm parchment system.
// Cream canvas, warm ink text, hairline borders, 4px corners.
// Ember is a text-only accent (links, short emphasis) - never a fill.
// Crimson / amber / forest form the risk scale (critical-high / medium / low).

export const C = {
  // Surfaces
  bg: '#F7F7F4',          // parchment - page canvas
  card: '#F2F1ED',        // bone - cards and panels
  hover: '#E6E5E0',       // linen - hover, selected rows, secondary buttons
  bgDeep: '#EBEAE5',      // window chrome, inset wells
  panel: '#EFEEEA',       // subtle alternate surface

  // Lines
  border: '#DEDDD8',      // hairline (ink at ~10% over parchment)
  borderStrong: '#CDCDC9',// stone - dividers on elevated surfaces

  // Text
  textPrimary: '#26251E', // ink - never pure black
  textBody: '#45443C',    // long-form body
  textMuted: '#7A7974',   // ash
  textFaint: '#A1A19F',   // mist - captions, placeholders

  // Accents
  ember: '#F54E00',       // inline links + emphasis only
  verdant: '#1F8A65',

  // Risk scale
  critical: '#CF2D56',    // crimson
  medium: '#C08532',      // amber
  low: '#34785C',         // forest
  amber: '#C08532',

  // Tinted wells behind risk content (paper-tinted, no glows)
  criticalWash: '#F6E7E8',
  mediumWash: '#F4ECDF',
  lowWash: '#E5EEE8',

  // Primary action
  ink: '#26251E',
  onInk: '#F7F7F4',
} as const

export const FONT = {
  sans: 'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", sans-serif',
  serif: '"EB Garamond", "Iowan Old Style", "Palatino Linotype", ui-serif, Georgia, serif',
  mono: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const

export const SHADOW = {
  card: '0 28px 70px rgba(38,37,30,0.10), 0 14px 32px rgba(38,37,30,0.07), 0 0 0 1px rgba(38,37,30,0.06)',
  popover: '0 24px 60px rgba(38,37,30,0.16), 0 0 0 1px rgba(38,37,30,0.08)',
  subtle: '0 1px 0 rgba(38,37,30,0.04)',
} as const

export function riskColor(score: number): string {
  if (score >= 65) return C.critical
  if (score >= 40) return C.medium
  return C.low
}

export function riskWash(score: number): string {
  if (score >= 65) return C.criticalWash
  if (score >= 40) return C.mediumWash
  return C.lowWash
}

export function riskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}
