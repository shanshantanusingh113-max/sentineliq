'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import AlertPanel from '@/components/AlertPanel'
import RiskBadge from '@/components/RiskBadge'
import { api, type Alert, type Stats, formatFraudType, timeAgo } from '@/lib/api'
import { C, FONT, SHADOW, riskColor } from '@/lib/tokens'
import PageHeader from '@/components/PageHeader'

const RISK_LEVELS = ['all', 'critical', 'high', 'medium', 'low']
const STATUSES = ['all', 'open', 'resolved', 'dismissed']
const TIME_RANGES = [
  { value: 'all', label: 'Any time' },
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

function Select({ value, onChange, options, label }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label?: string }[]; label: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      style={{
        background: C.bg, border: `1px solid ${C.border}`, color: C.textPrimary,
        padding: '6px 10px', fontSize: 13, borderRadius: 4, cursor: 'pointer',
        fontFamily: 'inherit', outline: 'none',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label ?? (o.value === 'all' ? `Any ${label.toLowerCase()}` : o.value.charAt(0).toUpperCase() + o.value.slice(1))}</option>
      ))}
    </select>
  )
}

function AlertRow({ alert, selected, onClick, isRight }: {
  alert: Alert; selected: boolean; onClick: () => void; isRight?: boolean
}) {
  const color = riskColor(alert.risk_score)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      className={selected ? undefined : 'row-hover'}
      style={{
        padding: '14px 28px', borderBottom: `1px solid ${C.border}`,
        borderLeft: isRight ? `1px solid ${C.border}` : undefined,
        cursor: 'pointer',
        background: selected ? C.card : 'transparent',
        boxShadow: selected ? `inset 2px 0 0 ${C.ink}` : 'none',
        display: 'grid', gridTemplateColumns: '1fr auto', gap: '3px 16px',
      }}
    >
      <span style={{ fontSize: 14, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {alert.user_name}
        {alert.status !== 'open' && (
          <span style={{
            marginLeft: 8, fontSize: 12, padding: '1px 7px', borderRadius: 4,
            background: alert.status === 'resolved' ? C.lowWash : C.hover,
            color: alert.status === 'resolved' ? C.low : C.textMuted,
          }}>
            {alert.status === 'resolved' ? 'Resolved' : 'Dismissed'}
          </span>
        )}
      </span>
      <span style={{ fontSize: 16, color, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(alert.risk_score)}
      </span>
      <span style={{ fontSize: 13, color: C.textMuted }}>{formatFraudType(alert.fraud_type)}</span>
      <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textFaint, textAlign: 'right' }}>{timeAgo(alert.ingested_at ?? alert.timestamp)}</span>
    </div>
  )
}

export default function AlertsPage() {
  const [fraudTypeFilter, setFraudTypeFilter] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [retraining, setRetraining] = useState(false)
  const [retrainMsg, setRetrainMsg] = useState('')

  const [riskLevel, setRiskLevel] = useState('all')
  const [status, setStatus] = useState('open')
  const [timeRange, setTimeRange] = useState('all')
  const [minScore, setMinScore] = useState(65)
  const [page, setPage] = useState(1)
  const [simOpen, setSimOpen] = useState(false)
  const [simToast, setSimToast] = useState('')
  const [simBusy, setSimBusy] = useState(false)
  const simRef = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 40

  useEffect(() => {
    if (!simOpen) return
    const handler = (e: MouseEvent) => {
      if (simRef.current && !simRef.current.contains(e.target as Node)) setSimOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [simOpen])

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.alerts({
        risk_level: riskLevel === 'all' ? undefined : riskLevel,
        status: status === 'all' ? undefined : status,
        time_range: timeRange === 'all' ? undefined : timeRange,
        page,
        page_size: PAGE_SIZE,
        min_score: minScore,
      })
      setAlerts(res.alerts)
      setTotal(res.total)
      api.stats().then(setStats).catch(() => null)
    } catch { /* backend starting */ }
    finally { setLoading(false) }
  }, [riskLevel, status, timeRange, page, minScore])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])
  useEffect(() => { setPage(1) }, [riskLevel, status, timeRange, minScore])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ft = params.get('fraud_type')
    if (ft) setFraudTypeFilter(ft)
    const id = params.get('id')
    if (id) setSelectedId(id)
  }, [])

  useEffect(() => {
    if (!fraudTypeFilter || alerts.length === 0 || selectedId) return
    const match = alerts.find((a) => a.fraud_type === fraudTypeFilter)
    if (match) setSelectedId(match.id)
  }, [fraudTypeFilter, alerts, selectedId])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleResolved = (id: string, newStatus: 'resolved' | 'dismissed') => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    setSelectedId(null)
    if (newStatus) fetchAlerts()
  }

  const handleRetrain = async () => {
    setRetraining(true)
    setRetrainMsg('')
    try {
      const res = await api.retrain()
      setRetrainMsg(res.message)
    } catch { setRetrainMsg('Retrain failed') }
    finally { setRetraining(false) }
  }

  const handleSimulate = async (label: string, scenario: string) => {
    setSimOpen(false)
    setSimBusy(true)
    setSimToast(`Simulating ${label}…`)
    try {
      await api.simulate(scenario)
      setSimToast(`${label} injected - refreshing`)
      setTimeout(() => { setSimToast(''); setPage(1); setStatus('open'); fetchAlerts() }, 2000)
    } catch {
      setSimToast('Simulate failed - backend may be starting')
      setTimeout(() => setSimToast(''), 4000)
    }
    setSimBusy(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <PageHeader
          title="Alerts"
          description={stats && stats.labels_collected > 0
            ? `${total} matching. ${stats.labels_collected} analyst labels so far, ${stats.false_positive_rate}% judged false positives.`
            : `${total} matching`}
        >
          <div ref={simRef} style={{ position: 'relative' }}>
            <button className="btn btn-linen btn-sm" onClick={() => setSimOpen(o => !o)} disabled={simBusy} aria-haspopup="menu" aria-expanded={simOpen}>
              Simulate an attack
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {simOpen && (
              <div role="menu" style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
                background: C.bg, borderRadius: 8, padding: 6,
                minWidth: 240, boxShadow: SHADOW.popover,
              }}>
                {[
                  { label: 'Bulk data exfiltration', scenario: 'bulk_exfiltration' },
                  { label: 'Privilege escalation', scenario: 'privilege_escalation' },
                  { label: 'Off-hours treasury access', scenario: 'off_hours_treasury' },
                  { label: 'Account record tampering', scenario: 'account_tampering' },
                ].map(({ label, scenario }) => (
                  <button key={scenario} role="menuitem" className="row-hover" onClick={() => handleSimulate(label, scenario)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 10px', fontSize: 14, color: C.textPrimary,
                      background: 'transparent', border: 'none', borderRadius: 4,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleRetrain} disabled={retraining}>
            {retraining ? 'Retraining...' : 'Retrain model'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={fetchAlerts} aria-label="Refresh alerts" style={{ padding: '6px 9px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5" /></svg>
          </button>
        </PageHeader>

        <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          {/* Filters row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', flexWrap: 'wrap' }}>
            <Select value={riskLevel} onChange={setRiskLevel} options={RISK_LEVELS.map(v => ({ value: v }))} label="Risk level" />
            <Select value={status} onChange={setStatus} options={STATUSES.map(v => ({ value: v }))} label="Status" />
            <Select value={timeRange} onChange={setTimeRange} options={TIME_RANGES} label="Time range" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              <label htmlFor="min-score" style={{ fontSize: 13, color: C.textMuted, flexShrink: 0 }}>Minimum score</label>
              <input
                id="min-score" type="range" min={0} max={100} value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                style={{ width: 120, accentColor: C.ink, cursor: 'pointer' }}
              />
              <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textPrimary, width: 24, flexShrink: 0 }}>{minScore}</span>
            </div>

            {fraudTypeFilter && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <span style={{ fontSize: 13, color: C.textMuted }}>Pattern</span>
                <span style={{ fontSize: 13, color: C.critical, background: C.criticalWash, borderRadius: 4, padding: '2px 8px' }}>
                  {formatFraudType(fraudTypeFilter)}
                </span>
                <button onClick={() => setFraudTypeFilter(null)} className="link-ember" style={{ fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Toast / retrain message */}
          {(simToast || retrainMsg) && (
            <div role="status" style={{ padding: '8px 28px', background: C.card, borderTop: `1px solid ${C.border}`, fontSize: 13, color: C.textBody }}>
              {simToast || retrainMsg}
            </div>
          )}
        </div>

        {/* Alert grid - scrollable */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {[...Array(16)].map((_, i) => (
                <div key={i} style={{
                  height: 64, borderBottom: `1px solid ${C.border}`,
                  borderLeft: i % 2 === 1 ? `1px solid ${C.border}` : undefined,
                  display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10,
                }}>
                  <div className="skeleton" style={{ flex: 1, height: 12 }} />
                  <div className="skeleton" style={{ width: 24, height: 12 }} />
                </div>
              ))}
            </div>
          )}

          {!loading && alerts.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.textFaint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span style={{ fontSize: 14, color: C.textMuted }}>No alerts match these filters. Lower the minimum score or widen the time range.</span>
            </div>
          )}

          {!loading && alerts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {alerts.map((a, i) => (
                <AlertRow
                  key={a.id}
                  alert={a}
                  selected={selectedId === a.id}
                  onClick={() => setSelectedId(a.id === selectedId ? null : a.id)}
                  isRight={i % 2 === 1}
                />
              ))}
              {/* Fill empty right cell if odd count */}
              {alerts.length % 2 === 1 && (
                <div style={{ borderBottom: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}` }} />
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {alerts.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 28px', borderTop: `1px solid ${C.border}`, flexShrink: 0,
            background: C.bg,
          }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="btn btn-ghost btn-sm">
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMuted }}>
              Page
              <input
                type="number" min={1} max={totalPages} defaultValue={page} key={page}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = parseInt((e.target as HTMLInputElement).value)
                    if (!isNaN(v)) setPage(Math.max(1, Math.min(totalPages, v)))
                  }
                }}
                onBlur={(e) => {
                  const v = parseInt(e.target.value)
                  if (!isNaN(v)) setPage(Math.max(1, Math.min(totalPages, v)))
                }}
                style={{
                  width: 36, textAlign: 'center', background: C.bg, border: `1px solid ${C.border}`,
                  color: C.textPrimary, fontSize: 12, borderRadius: 4, padding: '3px 4px',
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
              of {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="btn btn-ghost btn-sm">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Overlay alert panel */}
      <AlertPanel
        alertId={selectedId}
        onClose={() => setSelectedId(null)}
        onResolved={handleResolved}
      />
    </div>
  )
}
