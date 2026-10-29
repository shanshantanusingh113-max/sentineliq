import { C } from '@/lib/tokens'

// Inline wordmark: a square sentinel mark (frame + scan line) and the name.
// Inline SVG so it renders everywhere, including clones without Git LFS.
export default function Logo({ size = 15, color = C.textPrimary }: { size?: number; color?: string }) {
  const mark = Math.round(size * 1.35)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color }}>
      <svg width={mark} height={mark} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="0.75" y="0.75" width="18.5" height="18.5" stroke={color} strokeWidth="1.5" />
        <rect x="5" y="5" width="10" height="10" fill={color} />
        <line x1="0.75" y1="10" x2="19.25" y2="10" stroke={C.critical} strokeWidth="1.5" />
      </svg>
      <span style={{ fontSize: size, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
        SentinelIQ.
      </span>
    </span>
  )
}
