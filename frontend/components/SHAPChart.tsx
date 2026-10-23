'use client'

import type { SHAPValue } from '@/lib/api'
import { C, FONT } from '@/lib/tokens'

const LABELS: Record<string, string> = {
  login_hour_deviation: 'login_hour_z',
  transaction_velocity_ratio: 'tx_velocity_ratio',
  access_entropy: 'access_entropy',
  download_volume_zscore: 'download_vol_z',
  location_mismatch: 'location_mismatch',
  privilege_use_ratio: 'privilege_use_ratio',
  device_change_frequency: 'device_change_freq',
  off_hours_ratio: 'off_hours_ratio',
}

interface Props {
  values: SHAPValue[]
}

export default function SHAPChart({ values }: Props) {
  if (!values || values.length === 0) {
    return <p style={{ margin: 0, color: C.textMuted, fontSize: 14 }}>No attribution was recorded for this alert.</p>
  }

  const absMax = values.reduce((m, v) => Math.max(m, Math.abs(v.contribution ?? 0)), 1e-9)
  const top = values[0]
  const cols = '150px 1fr 60px'

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: cols, marginBottom: 10 }}>
        <span />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.low }}>lowers risk</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.critical }}>raises risk</span>
        </div>
        <span />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {values.map((sv) => {
          const contrib = sv.contribution ?? 0
          const absVal = Math.abs(contrib)
          const isPositive = sv.direction ? sv.direction === 'positive' : contrib >= 0
          const barPct = (absVal / absMax) * 48
          const color = isPositive ? C.critical : C.low
          const isZero = absVal < 1e-4

          return (
            <div key={sv.feature} style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center' }}>
              <span style={{
                fontSize: 12, color: C.textBody, fontFamily: FONT.mono,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 10,
              }} title={sv.feature}>
                {LABELS[sv.feature] || sv.feature}
              </span>

              <div style={{ position: 'relative', height: 6, background: C.hover, borderRadius: 2 }}>
                <span aria-hidden="true" style={{ position: 'absolute', left: '50%', top: -3, bottom: -3, width: 1, background: C.borderStrong }} />
                <span style={{
                  position: 'absolute', top: 0, bottom: 0,
                  ...(isPositive ? { left: '50%' } : { right: '50%' }),
                  width: isZero ? 1 : `${barPct}%`,
                  background: isZero ? C.textFaint : color, borderRadius: 2,
                  transition: 'width 0.4s ease',
                }} />
              </div>

              <span style={{ fontSize: 12, color: isZero ? C.textFaint : color, textAlign: 'right', fontFamily: FONT.mono }}>
                {contrib >= 0 ? '+' : ''}{contrib.toFixed(3)}
              </span>
            </div>
          )
        })}
      </div>

      {top && Math.abs(top.contribution ?? 0) > 1e-4 && (
        <p style={{ margin: '14px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.55 }}>
          The strongest signal was <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textPrimary }}>{LABELS[top.feature] || top.feature}</span> at{' '}
          {(top.value ?? 0).toFixed(2)}, adding{' '}
          <span style={{ color: top.contribution >= 0 ? C.critical : C.low }}>{top.contribution >= 0 ? '+' : ''}{(top.contribution ?? 0).toFixed(3)}</span>{' '}
          to the score. <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>SHAP / XGBoost TreeExplainer</span>
        </p>
      )}
    </div>
  )
}
