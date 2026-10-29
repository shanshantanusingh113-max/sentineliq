'use client'

import { C } from '@/lib/tokens'
import CountUp from '@/components/CountUp'

// Animate the numeric part of a stat ("0.04%", "$19.5M", 50); non-numeric values render as-is.
function AnimatedValue({ value }: { value: string | number }) {
  const m = String(value).match(/^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/)
  if (!m) return <>{value}</>
  const decimals = (m[2].split('.')[1] || '').length
  return <CountUp to={parseFloat(m[2])} decimals={decimals} prefix={m[1]} suffix={m[3]} duration={1.2} />
}

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

  if (loading) {
    return (
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 0,
          padding: '19px 19px 15px',
        }}
      >
        <div style={{ width: 80, height: 12, background: C.border, borderRadius: 0, marginBottom: 12 }} />
        <div style={{ width: 120, height: 28, background: C.border, borderRadius: 0, marginBottom: 8 }} />
        <div style={{ width: 60, height: 10, background: C.border, borderRadius: 0 }} />
      </div>
    )
  }

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 0,
        padding: '19px 19px 15px',
      }}
      className="rise"
    >
      <p style={{ margin: 0, fontSize: 11, color: C.textMuted, letterSpacing: '0.05em', fontWeight: 400, textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ margin: '30px 0 15px', fontSize: 46, fontWeight: 400, color: accentColor, lineHeight: 0.8, letterSpacing: '0.013em' }}>
        <AnimatedValue value={value} />
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {change !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: change > 0 ? C.critical : change < 0 ? C.low : C.textMuted,
            }}
          >
            {change > 0 ? `+${change}` : change}
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: C.textMuted }}>{sub}</span>}
      </div>
    </div>
  )
}
