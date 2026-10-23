'use client'

import { C, FONT } from '@/lib/tokens'

interface Props {
  label: string
  value: string | number
  sub?: string
  change?: number
  loading?: boolean
  accent?: 'red' | 'amber' | 'green' | 'neutral'
}

export default function StatCard({ label, value, sub, change, loading, accent = 'neutral' }: Props) {
  const accentColor =
    accent === 'red' ? C.critical : accent === 'amber' ? C.medium : accent === 'green' ? C.low : C.textPrimary

  const shell = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    padding: '18px 20px 16px',
  } as const

  if (loading) {
    return (
      <div style={shell} aria-busy="true">
        <div className="skeleton" style={{ width: 96, height: 12, marginBottom: 14 }} />
        <div className="skeleton" style={{ width: 72, height: 30, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: 120, height: 10 }} />
      </div>
    )
  }

  return (
    <div style={shell}>
      <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>{label}</p>
      <p style={{
        margin: '10px 0 8px', fontSize: 36, fontWeight: 400, color: accentColor,
        lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minHeight: 16 }}>
        {change !== undefined && (
          <span style={{
            fontFamily: FONT.mono, fontSize: 12,
            color: change > 0 ? C.critical : change < 0 ? C.low : C.textMuted,
          }}>
            {change > 0 ? `+${change}` : change}
          </span>
        )}
        {sub && <span style={{ fontSize: 12, color: C.textMuted }}>{sub}</span>}
      </div>
    </div>
  )
}
