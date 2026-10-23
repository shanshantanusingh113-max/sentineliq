import { C } from '@/lib/tokens'

// Mark: a baseline with a single point lifting off it - one person's behaviour
// leaving their own normal. Drawn as an ink tile with parchment strokes.
export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <rect x="0" y="0" width="24" height="24" rx="4" fill={C.ink} />
      <path d="M4 15.5 H9.5 L12 15.5 L14.5 8 L16 15.5 H20" fill="none" stroke={C.onInk} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14.5" cy="8" r="1.7" fill={C.ember} />
    </svg>
  )
}

export function Wordmark({ size = 14 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <LogoMark size={Math.round(size * 1.45)} />
      <span style={{ fontSize: size, fontWeight: 500, color: C.textPrimary, letterSpacing: '-0.005em' }}>SentinelIQ</span>
    </span>
  )
}
