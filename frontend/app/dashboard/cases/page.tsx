'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import AlertPanel from '@/components/AlertPanel'
import { api, type CaseItem, type TimelineItem, formatFraudType, timeAgo, normaliseIso } from '@/lib/api'
import { C, FONT, riskColor } from '@/lib/tokens'
import PageHeader from '@/components/PageHeader'

const CASE_EXPLANATIONS: Record<string, string> = {
  'Coordinated Insider Threat': 'Multiple fraud patterns detected across several users in a 24-hour window - suggesting coordinated insider activity.',
  'Multi-Pattern Insider Threat': 'Three or more distinct fraud patterns detected from a single user within a 24-hour window - indicating deliberate, multi-vector insider activity.',
  'Data Exfiltration Attempt': 'Bulk downloads combined with cross-department access - consistent with data aggregation before extraction.',
  'Privilege Abuse Sequence': 'Repeated privilege escalation combined with off-hours access - indicates active boundary probing.',
  'Treasury Manipulation': 'Velocity spikes combined with account modifications in treasury - consistent with financial manipulation.',
  'Escalating Insider Risk': 'Risk score trending upward across multiple sessions - cumulative pattern warrants heightened monitoring.',
}


const SEVERITY = {
  critical: { label: 'Critical', color: C.critical, wash: C.criticalWash },
  high: { label: 'High', color: C.critical, wash: C.criticalWash },
  medium: { label: 'Medium', color: C.medium, wash: C.mediumWash },
  low: { label: 'Low', color: C.low, wash: C.lowWash },
} as const

function sev(s: string) {
  return SEVERITY[s as keyof typeof SEVERITY] ?? SEVERITY.low
}

function CaseRow({ item, active, onClick }: { item: CaseItem; active: boolean; onClick: () => void }) {
  const sv = sev(item.severity)
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={active ? undefined : 'row-hover'}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: active ? C.card : 'transparent',
        boxShadow: active ? `inset 2px 0 0 ${C.ink}` : 'none',
        border: 'none', borderBottom: `1px solid ${C.border}`,
        padding: '16px 24px', cursor: 'pointer', fontFamily: 'inherit', color: C.textPrimary,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 14, color: C.textPrimary }}>{item.name}</span>
        <span style={{ fontSize: 12, color: sv.color, background: sv.wash, borderRadius: 4, padding: '1px 7px', flexShrink: 0 }}>{sv.label}</span>
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textMuted }}>
        {item.user_names.join(', ')}
      </p>
      <p style={{ margin: '6px 0 0', fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>
        {item.linked_alerts_count} alerts / opened {timeAgo(item.start_time)}
      </p>
    </button>
  )
}

const KIND_TAG: Record<TimelineItem['kind'], { tag: string; color: string; wash: string }> = {
  baseline:       { tag: 'Baseline', color: C.textMuted, wash: C.hover },
  suspicious:     { tag: 'Unusual',  color: C.medium,    wash: C.mediumWash },
  trigger:        { tag: 'Alert',    color: C.critical,  wash: C.criticalWash },
  analyst_action: { tag: 'Analyst',  color: C.low,       wash: C.lowWash },
  case_opened:    { tag: 'Case',     color: C.amber,     wash: C.mediumWash },
}

function CaseTimeline({ caseId }: { caseId: string }) {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!caseId) return
    setLoading(true)
    api.caseTimeline(caseId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [caseId])

  if (loading) return (
    <div style={{ display: 'grid', gap: 12 }} aria-busy="true">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 36 }} />)}
    </div>
  )
  if (!items.length) return <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>No events are linked to this case yet.</p>

  // Oldest first, so the case reads as a story from baseline to alert.
  const ordered = [...items].sort((a, b) => new Date(normaliseIso(a.timestamp)).getTime() - new Date(normaliseIso(b.timestamp)).getTime())

  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: '0 0 0 104px', position: 'relative' }}>
      <span aria-hidden="true" style={{ position: 'absolute', left: 87, top: 8, bottom: 8, width: 1, background: C.borderStrong }} />
      {ordered.map((item, i) => {
        const k = KIND_TAG[item.kind] ?? KIND_TAG.baseline
        const ts = new Date(normaliseIso(item.timestamp)).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        return (
          <li key={item.id} style={{ position: 'relative', marginBottom: i < ordered.length - 1 ? 22 : 0 }}>
            <span style={{ position: 'absolute', left: -104, top: 1, width: 72, fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>{ts}</span>
            <span aria-hidden="true" style={{ position: 'absolute', left: -20, top: 6, width: 7, height: 7, borderRadius: '50%', background: k.color, boxShadow: `0 0 0 3px ${C.bg}` }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: k.color, background: k.wash, borderRadius: 4, padding: '1px 7px' }}>{k.tag}</span>
              <span style={{ fontSize: 14, color: C.textPrimary }}>{item.title}</span>
              {item.risk_delta && <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.critical }}>{item.risk_delta}</span>}
            </div>
            {item.explanation && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{item.explanation}</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'timeline' | 'alerts'>('timeline')
  const [acting, setActing] = useState(false)
  const [banner, setBanner] = useState<{ text: string; color: string } | null>(null)

  useEffect(() => {
    api.cases()
      .then(data => { setCases(data); setSelectedCaseId(data[0]?.id ?? null) })
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }, [])

  const selectedCase = cases.find(c => c.id === selectedCaseId) ?? null

  const removeCase = (id: string) => {
    setCases(prev => {
      const remaining = prev.filter(c => c.id !== id)
      setSelectedCaseId(remaining[0]?.id ?? null)
      return remaining
    })
  }

  const handleResolve = async () => {
    if (!selectedCaseId || acting) return
    setActing(true)
    await api.resolveCase(selectedCaseId).catch(() => null)
    setBanner({ text: 'Case closed as resolved. The audit trail is kept.', color: C.low })
    setTimeout(() => { removeCase(selectedCaseId) }, 1400)
    setActing(false)
  }

  const handleDismiss = async () => {
    if (!selectedCaseId || acting) return
    setActing(true)
    await api.dismissCase(selectedCaseId).catch(() => null)
    setBanner({ text: 'Case dismissed. The alerts were not related, so no further action is needed.', color: C.textMuted })
    setTimeout(() => { removeCase(selectedCaseId) }, 1400)
    setActing(false)
  }

  const tabStyle = (on: boolean) => ({
    padding: '10px 2px', marginRight: 22, fontSize: 14, fontFamily: 'inherit',
    background: 'none', border: 'none', cursor: 'pointer',
    color: on ? C.textPrimary : C.textMuted,
    borderBottom: `1px solid ${on ? C.textPrimary : 'transparent'}`, marginBottom: -1,
  }) as const

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <PageHeader
          title="Cases"
          description={loading ? 'Loading open investigations' : `${cases.length} open. Repeat alerts for the same person within 24 hours are grouped into one case.`}
        />

        <div className="cases-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) 1fr', overflow: 'hidden' }}>
          {/* Case list */}
          <div style={{ overflowY: 'auto', borderRight: `1px solid ${C.border}` }}>
            {loading && [...Array(4)].map((_, i) => (
              <div key={i} style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'grid', gap: 8 }}>
                <div className="skeleton" style={{ height: 14, width: '70%' }} />
                <div className="skeleton" style={{ height: 12, width: '40%' }} />
              </div>
            ))}
            {!loading && cases.length === 0 && (
              <p style={{ color: C.textMuted, fontSize: 14, padding: 24, margin: 0, lineHeight: 1.5 }}>
                No open cases. A case opens when the same person triggers a second alert within 24 hours.
              </p>
            )}
            {cases.map(item => (
              <CaseRow key={item.id} item={item} active={item.id === selectedCaseId} onClick={() => { setSelectedCaseId(item.id); setBanner(null) }} />
            ))}
          </div>

          {/* Case detail */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedCase ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontSize: 14 }}>
                Choose a case to see its sequence of events.
              </div>
            ) : (
              <>
                <div style={{ padding: '24px 32px 0', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: FONT.mono, fontSize: 12, color: C.textMuted }}>
                        {selectedCase.linked_alerts_count} linked alerts / opened {timeAgo(selectedCase.start_time)}
                      </p>
                      <h2 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 400, letterSpacing: '-0.012em', color: C.textPrimary }}>{selectedCase.name}</h2>
                      <p style={{ margin: '4px 0 0', fontSize: 14, color: C.textMuted }}>{selectedCase.user_names.join(', ')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-linen btn-sm" onClick={handleDismiss} disabled={acting}>Dismiss case</button>
                      <button className="btn btn-ink btn-sm" onClick={handleResolve} disabled={acting}>Close as resolved</button>
                    </div>
                  </div>

                  {CASE_EXPLANATIONS[selectedCase.name] && (
                    <p className="serif" style={{ margin: '18px 0 0', maxWidth: 680, fontSize: 18, lineHeight: 1.5, color: C.textBody, borderLeft: `2px solid ${sev(selectedCase.severity).color}`, paddingLeft: 16 }}>
                      {CASE_EXPLANATIONS[selectedCase.name]}
                    </p>
                  )}

                  {banner && (
                    <p role="status" style={{ margin: '14px 0 0', fontSize: 14, color: C.textBody }}>
                      <span style={{ color: banner.color }}>{banner.text.split('.')[0]}.</span>{banner.text.slice(banner.text.indexOf('.') + 1)}
                    </p>
                  )}

                  <div role="tablist" style={{ display: 'flex', marginTop: 20 }}>
                    <button role="tab" aria-selected={view === 'timeline'} onClick={() => setView('timeline')} style={tabStyle(view === 'timeline')}>Sequence of events</button>
                    <button role="tab" aria-selected={view === 'alerts'} onClick={() => setView('alerts')} style={tabStyle(view === 'alerts')}>Alerts ({selectedCase.alerts.length})</button>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: view === 'timeline' ? '28px 32px' : 0 }}>
                  {view === 'timeline' ? (
                    <CaseTimeline caseId={selectedCase.id} />
                  ) : (
                    <div>
                      {selectedCase.alerts.map(alert => (
                        <div
                          key={alert.id}
                          role="button"
                          tabIndex={0}
                          className="row-hover"
                          onClick={() => setSelectedAlertId(alert.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedAlertId(alert.id) } }}
                          style={{ padding: '14px 32px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr auto', gap: '3px 16px' }}
                        >
                          <span style={{ fontSize: 14, color: C.textPrimary }}>{formatFraudType(alert.fraud_type)}</span>
                          <span style={{ fontSize: 16, color: riskColor(alert.risk_score), textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(alert.risk_score)}</span>
                          <span style={{ fontSize: 13, color: C.textMuted }}>{alert.user_name}</span>
                          <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textFaint, textAlign: 'right' }}>{timeAgo(alert.ingested_at ?? alert.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AlertPanel alertId={selectedAlertId} onClose={() => setSelectedAlertId(null)} />
    </div>
  )
}
