// SentinelIQ design tokens - "Ink on Void" editorial system.
// The OFF+BRAND editorial language (parchment / ink / paper / ash / stone) inverted
// into a deep black theme. Monochrome by default; risk colors are the only functional
// hues, and the iridescent gradient appears once, in the landing hero.

export const C = {
  // Surfaces (level 0 -> 2)
  bg: '#0A0A09',        // Void - page canvas (inverted Parchment)
  card: '#121211',      // Paper - elevated card surface
  panel: '#181816',     // Stone - secondary panel
  hover: '#1D1D1B',     // Stone hover
  bgDeep: '#050505',    // Absolute black - wells, code blocks, inputs

  // Lines
  border: '#2A2A27',    // Ash - 1px hairlines
  borderStrong: '#3A3A36',
  focus: '#6B6A66',

  // Text
  textPrimary: '#E5E4E0', // Bone - Parchment used as ink
  textMuted: '#8A8984',   // Smoke
  textFaint: '#55544F',
  onInk: '#0A0A09',       // text on a Bone fill

  // Functional risk signal - the only hues allowed in product UI
  critical: '#DC2626',
  medium: '#D97706',
  low: '#16A34A',
  amber: '#D97706',

  // Tinted banners
  criticalWash: '#1F0B0B',
  amberWash: '#1C1307',
  infoWash: '#121211',
} as const

export const FONT_SANS =
  "'Inter', 'Neue Haas Grotesk Display', ui-sans-serif, system-ui, -apple-system, sans-serif"
export const FONT_MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

// Single signature gradient - landing hero sphere only.
export const IRIDESCENT =
  'linear-gradient(255deg, rgb(250, 203, 14), rgb(240, 107, 168) 30%, rgb(120, 186, 230) 65%, rgb(255, 255, 255))'

// Radii: cards are sharp, interactive elements get 10px.
export const R = { card: 0, control: 10 } as const

// Museum-signage label (11px, caps, wide tracking)
export const LABEL = {
  fontSize: 11,
  fontWeight: 400,
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  color: C.textMuted,
}

export function riskColor(score: number): string {
  if (score >= 65) return C.critical
  if (score >= 40) return C.medium
  return C.low
}

export function riskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}
