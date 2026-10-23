'use client'

import { C, FONT } from '@/lib/tokens'

const STYLE = {
  critical: { color: C.critical, wash: C.criticalWash, label: 'Critical' },
  high: { color: C.critical, wash: C.criticalWash, label: 'High' },
  medium: { color: C.medium, wash: C.mediumWash, label: 'Medium' },
  low: { color: C.low, wash: C.lowWash, label: 'Low' },
}

interface Props {
  level: 'critical' | 'high' | 'medium' | 'low'
  score?: number
  size?: 'sm' | 'md'
}

export default function RiskBadge({ level, score, size = 'md' }: Props) {
  const s = STYLE[level]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
        background: s.wash,
        color: s.color,
        padding: size === 'sm' ? '2px 7px' : '3px 9px',
        fontSize: size === 'sm' ? 12 : 13,
        fontWeight: 400,
        borderRadius: 4,
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}
    >
      {s.label}
      {score !== undefined && (
        <span style={{ fontFamily: FONT.mono, fontSize: size === 'sm' ? 11 : 12 }}>{Math.round(score)}</span>
      )}
    </span>
  )
}
