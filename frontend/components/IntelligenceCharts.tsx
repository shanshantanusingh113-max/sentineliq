'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Intelligence, DeptRiskItem } from '@/lib/api'
import { formatFraudType } from '@/lib/api'
import { C, FONT, SHADOW, riskColor } from '@/lib/tokens'

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '18px 20px 20px' }}>
      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 16, color: C.textPrimary, fontWeight: 400 }}>{title}</h3>
        {sub && <span style={{ fontSize: 13, color: C.textMuted }}>{sub}</span>}
      </div>
      {children}
    </section>
  )
}

const tick = { fontSize: 12, fill: C.textMuted, fontFamily: FONT.mono }
const shortDate = (d: string) => {
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: C.bg, borderRadius: 4, boxShadow: SHADOW.popover, padding: '8px 12px' }}>
      <p style={{ margin: 0, fontFamily: FONT.mono, fontSize: 12, color: C.textMuted }}>{label ? shortDate(label) : ''}</p>
      <p style={{ margin: '2px 0 0', fontSize: 14, color: C.textPrimary }}>{payload[0].value}{unit}</p>
    </div>
  )
}

function TrendLine({ data, dataKey, unit, label }: { data: object[]; dataKey: string; unit: string; label: string }) {
  return (
    <div role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={C.border} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={tick} axisLine={{ stroke: C.borderStrong }} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: C.borderStrong, strokeWidth: 1 }} />
          <Line type="monotone" dataKey={dataKey} stroke={C.ink} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: C.ink, stroke: C.card, strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function IntelligenceCharts({ data }: { data: Intelligence }) {
  const sortedAnom = [...data.anomaly_type_breakdown].sort((a, b) => b.count - a.count)
  const maxCount = Math.max(...sortedAnom.map(a => a.count), 1)
  const totalAnom = sortedAnom.reduce((s, a) => s + a.count, 0)
  const totalVolume = data.alert_volume_last_7_days.reduce((s, d) => s + d.count, 0)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Panel title="Alerts per day" sub={`${totalVolume} in the last 7 days`}>
        <TrendLine data={data.alert_volume_last_7_days} dataKey="count" unit=" alerts" label="Line chart of alerts per day over the last 7 days" />
      </Panel>

      <div className="intel-grid" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        <Panel title="Alerts by pattern" sub={`${totalAnom} in the last 7 days`}>
          {sortedAnom.length === 0 ? (
            <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>No unusual behaviour has been flagged yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {sortedAnom.map((a) => {
                const w = (a.count / maxCount) * 100
                return (
                  <div key={a.fraud_type} title={`${formatFraudType(a.fraud_type)}: ${a.count}`} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 36px', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 14, color: C.textBody, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatFraudType(a.fraud_type)}</span>
                    <div style={{ height: 8, background: C.hover, borderRadius: 2 }}>
                      <div style={{ width: `${w}%`, height: '100%', background: C.ink, borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ fontSize: 14, color: C.textPrimary, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{a.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

        <Panel title="Average risk by department" sub="7-day window">
          {data.department_risk_breakdown.length === 0 ? (
            <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>No alerts yet, so no department scores.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {data.department_risk_breakdown.map((d: DeptRiskItem) => (
                <div key={d.department} title={`${d.department}: average ${d.avg_risk.toFixed(0)}, ${d.alert_count} alerts`} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 36px', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: C.textBody, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatFraudType(d.department)}</span>
                  <div style={{ height: 8, background: C.hover, borderRadius: 2 }}>
                    <div style={{ width: `${Math.min(100, d.avg_risk)}%`, height: '100%', background: riskColor(d.avg_risk), borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 14, color: C.textPrimary, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{d.avg_risk.toFixed(0)}</span>
                </div>
              ))}
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textMuted }}>
                Bar colour follows the risk scale: <span style={{ color: C.low }}>low</span> below 40, <span style={{ color: C.medium }}>medium</span> to 65, <span style={{ color: C.critical }}>high</span> above.
              </p>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="False positive rate" sub="from analyst labels">
        <TrendLine data={data.false_positive_rate_trend} dataKey="rate" unit="%" label="Line chart of false positive rate over time" />
      </Panel>
    </div>
  )
}
