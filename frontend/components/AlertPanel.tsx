'use client'

import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { api, type Alert, type AuditEntry, type PeerComparison, type TimelineItem, formatFraudType, timeAgo, normaliseIso } from '@/lib/api'
import { C, SHADOW, FONT, riskColor } from '@/lib/tokens'
import RiskBadge from './RiskBadge'
import SHAPChart from './SHAPChart'

const FEATURE_DESC: Record<string, string> = {
  login_hour_deviation: 'login hour deviation from baseline',
  access_entropy: 'cross-department access pattern',
  transaction_velocity_ratio: 'transaction velocity',
  download_volume_zscore: 'download volume anomaly',
  device_change_frequency: 'device switching frequency',
  privilege_use_ratio: 'privilege escalation attempts',
  off_hours_ratio: 'off-hours activity ratio',
  location_mismatch: 'location anomaly',
}

const FRAUD_BEHAVIOR: Record<string, string> = {
  off_hours_login: 'logged into core banking systems outside their normal working hours',
  bulk_download: 'performed a high-volume data download atypical for their role',
  cross_department_access: 'accessed systems and records across departments outside their normal scope',
  privilege_escalation: 'attempted to use elevated privileges or access restricted system functions',
  velocity_spike: 'executed an abnormal surge of transactions in a compressed time window',
  account_modification: 'modified account records in systems outside their department scope',
  anomalous_behavior: 'exhibited multiple behavioural deviations from their established baseline',
}

function formatTs(iso: string): string {
  const diff = Date.now() - new Date(normaliseIso(iso)).getTime()
  if (diff < 0) return 'Just now'
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h ${rem}m ago` : `${h}h ago`
}

function generatePlainExplanation(alert: Alert, peerData?: PeerComparison | null): string {
  const firstName = alert.user_name.split(' ')[0]
  const behavior = FRAUD_BEHAVIOR[alert.fraud_type] ?? 'exhibited unusual behavioural patterns'

  let text = `${firstName} ${behavior}.`

  if (peerData && peerData.metrics.length > 0) {
    const top = [...peerData.metrics].sort((a, b) => b.multiplier - a.multiplier)[0]
    if (top.multiplier > 1.5) {
      const role = peerData.role.replace(/_/g, ' ')
      text += ` Their ${top.metric.toLowerCase()} is ${top.multiplier.toFixed(1)}x the ${role} peer average, placing them well outside the normal range for this role.`
    }
  }

  const topShap = [...(alert.shap_values ?? [])]
    .filter((v) => v.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 2)

  if (topShap.length === 1) {
    const f1 = FEATURE_DESC[topShap[0].feature] ?? topShap[0].feature.replace(/_/g, ' ')
    text += ` The primary signal driving this alert was ${f1}, which deviated significantly from this user's established baseline.`
  } else if (topShap.length >= 2) {
    const f1 = FEATURE_DESC[topShap[0].feature] ?? topShap[0].feature.replace(/_/g, ' ')
    const f2 = FEATURE_DESC[topShap[1].feature] ?? topShap[1].feature.replace(/_/g, ' ')
    text += ` The two strongest signals were ${f1} and ${f2}, each deviating significantly from this user's established baseline.`
  }

  return text
}

function recommendedAction(risk: number): { text: string; color: string } {
  if (risk >= 80) {
    return {
      text: 'Suspend system access immediately. Notify HR and Security Operations. Preserve audit trail for legal review.',
      color: C.critical,
    }
  }
  if (risk >= 50) {
    return {
      text: 'Force MFA re-authentication. Flag for supervisor review within 4 hours.',
      color: C.medium,
    }
  }
  return { text: 'Monitor for 24 hours. No immediate action required.', color: C.low }
}

interface Props {
  alertId: string | null
  onClose: () => void
  onResolved?: (id: string, newStatus: 'resolved' | 'dismissed') => void
}

export default function AlertPanel({ alertId, onClose, onResolved }: Props) {
  const [alert, setAlert] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [note, setNote] = useState('')
  const [noteSavedAt, setNoteSavedAt] = useState<Date | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [peerData, setPeerData] = useState<PeerComparison | null>(null)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!alertId) { setAlert(null); return }
    setLoading(true)
    setTimeline([])
    setPeerData(null)
    api.alert(alertId)
      .then(setAlert)
      .catch(() => setAlert(null))
      .finally(() => setLoading(false))
  }, [alertId])

  useEffect(() => {
    setNote(alert?.notes || '')
    setNoteSavedAt(null)
    setAuditLog([])
    if (!alert) return
    api.alertTimeline(alert.id)
      .then(setTimeline)
      .catch(() => setTimeline([]))
    api.auditLog({ alert_id: alert.id, limit: 10 })
      .then(setAuditLog)
      .catch(() => setAuditLog([]))
    api.peerComparison(alert.id)
      .then(setPeerData)
      .catch(() => setPeerData(null))
  }, [alert?.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const handleResolve = async () => {
    if (!alert) return
    setActing(true)
    try {
      await api.resolveAlert(alert.id)
      setAlert({ ...alert, status: 'resolved' })
      onResolved?.(alert.id, 'resolved')
    } catch {
      showToast('Couldn\'t resolve the alert. Try again.')
    } finally { setActing(false) }
  }

  const handleDismiss = async () => {
    if (!alert) return
    setActing(true)
    try {
      await api.dismissAlert(alert.id)
      setAlert({ ...alert, status: 'dismissed' })
      onResolved?.(alert.id, 'dismissed')
    } catch {
      showToast('Couldn\'t dismiss the alert. Try again.')
    } finally { setActing(false) }
  }

  const handleLabel = async (label: 'TP' | 'FP') => {
    if (!alert) return
    setActing(true)
    await api.labelAlert(alert.id, label).catch(() => null)
    setAlert({ ...alert, label })
    setActing(false)
    showToast('Label saved. It will be used in the next retrain.')
  }

  const saveNote = async () => {
    if (!alert || note === (alert.notes || '')) return
    await api.noteAlert(alert.id, note).catch(() => null)
    setAlert({ ...alert, notes: note })
    setNoteSavedAt(new Date())
  }

  const handleExport = async () => {
    if (!alert) return
    try {
      const data = await api.exportAlert(alert.id)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sentineliq-evidence-${alert.id.slice(0, 8)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Couldn\'t export the evidence. Try again.')
    }
  }

  if (!alertId) return null

  const scoreColor = alert ? riskColor(alert.risk_score) : C.textFaint
  const action = alert ? recommendedAction(alert.risk_score) : null

  const h3 = { margin: '0 0 12px', fontSize: 16, fontWeight: 400, color: C.textPrimary } as const
  const kindStyle = (kind: string) => {
    switch (kind) {
      case 'trigger': return { label: 'Alert', color: C.critical, wash: C.criticalWash }
      case 'case_opened': return { label: 'Case opened', color: C.amber, wash: C.mediumWash }
      case 'suspicious': return { label: 'Unusual', color: C.medium, wash: C.mediumWash }
      case 'analyst_action': return { label: 'Analyst', color: C.low, wash: C.lowWash }
      default: return { label: 'Baseline', color: C.textMuted, wash: C.hover }
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="alert-panel-backdrop"
        style={{ position: 'fixed', inset: 0, background: 'rgba(38,37,30,0.24)', zIndex: 100 }}
      />

      {/* Toast */}
      {toast && (
        <div role="status" style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: C.ink, color: C.onInk, borderRadius: 4,
          padding: '10px 18px', fontSize: 13,
          zIndex: 200, whiteSpace: 'nowrap', boxShadow: SHADOW.popover,
        }}>
          {toast}
        </div>
      )}

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={alert ? `Alert for ${alert.user_name}` : 'Alert detail'}
        className="alert-panel-overlay panel-full"
        style={{
          position: 'fixed', top: '50%', left: '50%',
          width: 1000, maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh',
          background: C.bg, borderRadius: 8, boxShadow: SHADOW.popover,
          zIndex: 101, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 28px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', gap: 20, flexShrink: 0 }}>
          {alert ? (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontFamily: FONT.mono, fontSize: 12, color: C.textMuted }}>
                  alert {alert.id.slice(0, 8)} / {timeAgo(alert.ingested_at ?? alert.timestamp)}
                </p>
                <h2 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 400, letterSpacing: '-0.012em', lineHeight: 1.2, color: C.textPrimary }}>
                  {formatFraudType(alert.fraud_type)}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: C.textMuted }}>
                  {alert.user_name} <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textFaint, marginLeft: 6 }}>{alert.user_id}</span>
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'flex-end' }}>
                  <RiskBadge level={alert.risk_level} />
                  <span style={{ fontSize: 54, lineHeight: 0.9, letterSpacing: '-0.03em', color: scoreColor, fontVariantNumeric: 'tabular-nums' }}>{Math.round(alert.risk_score)}</span>
                </div>
                <p style={{ margin: '6px 0 0', fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>risk / 100</p>
              </div>
            </>
          ) : (
            <div style={{ flex: 1 }} aria-busy="true">
              <div className="skeleton" style={{ height: 12, width: 160, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 24, width: 260, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: 140 }} />
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Close alert"
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 8px', flexShrink: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {loading && (
          <div style={{ padding: 28, display: 'grid', gap: 14 }} aria-busy="true">
            {[420, 560, 380, 240, 300].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: 14, width: w, maxWidth: '100%' }} />
            ))}
          </div>
        )}

        {!loading && alert && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* The account - what happened, in plain language */}
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}`, background: C.card }}>
              <p className="serif" style={{
                margin: 0, maxWidth: 720, fontSize: 19, lineHeight: 1.5, color: C.textBody,
                borderLeft: `2px solid ${scoreColor}`, paddingLeft: 18,
              }}>
                {alert.ai_narrative || generatePlainExplanation(alert, peerData)}
              </p>
              {action && (
                <p style={{ margin: '16px 0 0 20px', fontSize: 14, color: C.textBody, maxWidth: 700 }}>
                  <span style={{ color: action.color }}>Recommended next step.</span> {action.text}
                </p>
              )}
            </div>

            <div className="alert-demo-grid" style={{ display: 'grid', gridTemplateColumns: '11fr 9fr' }}>
              {/* Evidence */}
              <div style={{ padding: '24px 28px', borderRight: `1px solid ${C.border}`, display: 'grid', gap: 32, alignContent: 'start' }}>
                <section>
                  <h3 style={h3}>What drove the score</h3>
                  <SHAPChart values={alert.shap_values ?? []} />
                </section>

                <section>
                  <h3 style={h3}>How each model scored it</h3>
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 4 }}>
                    {([
                      { label: 'Isolation Forest', key: 'isolation_forest', weight: '0.4', desc: 'one-off outliers' },
                      { label: 'LSTM autoencoder', key: 'lstm', weight: '0.4', desc: 'drift over time' },
                      { label: 'XGBoost', key: 'xgboost', weight: '0.2', desc: 'known fraud patterns' },
                    ] as const).map(({ label, key, weight, desc }, i) => {
                      const pct = Math.round(alert.model_scores[key] * 100)
                      return (
                        <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 36px', gap: 14, alignItems: 'center', padding: '12px 14px', borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 14, color: C.textPrimary }}>{label}</p>
                            <p style={{ margin: '2px 0 0', fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>{desc} / weight {weight}</p>
                          </div>
                          <div style={{ height: 6, background: C.hover, borderRadius: 2 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: riskColor(pct), borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 14, color: C.textPrimary, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{pct}</span>
                        </div>
                      )
                    })}
                  </div>
                </section>

                {peerData && peerData.metrics.length > 0 && (
                  <section>
                    <h3 style={h3}>Compared with other {peerData.role.replace(/_/g, ' ')}s</h3>
                    <div style={{ display: 'grid', gap: 14 }}>
                      {peerData.metrics.map((m) => {
                        const color = m.multiplier > 3 ? C.critical : m.multiplier > 1.5 ? C.medium : C.low
                        const barPct = Math.min(100, (m.multiplier / 6) * 100)
                        return (
                          <div key={m.metric}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 14, color: C.textBody }}>{m.metric}</span>
                              <span style={{ fontSize: 14, color, fontVariantNumeric: 'tabular-nums' }}>
                                {m.multiplier <= 1.2 ? 'within normal range' : `${m.multiplier.toFixed(1)}x peer average`}
                              </span>
                            </div>
                            <div style={{ height: 6, background: C.hover, borderRadius: 2, position: 'relative' }}>
                              <div style={{ width: `${barPct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
                              <span title="Peer average" style={{ position: 'absolute', left: `${100 / 6}%`, top: -3, bottom: -3, width: 1, background: C.textMuted }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                <section>
                  <label htmlFor="case-notes" style={{ ...h3, display: 'block' }}>Investigator notes</label>
                  <textarea
                    id="case-notes"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={saveNote}
                    onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveNote() }}
                    placeholder="What did you check, and what did you find? Saved when you click away, or with Cmd+Enter."
                    style={{
                      width: '100%', minHeight: 96, padding: '12px 14px',
                      background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
                      color: C.textPrimary, fontSize: 16, lineHeight: 1.5,
                      fontFamily: FONT.serif, resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                  {noteSavedAt && (
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: C.textMuted }}>Note saved {timeAgo(noteSavedAt.toISOString())}</p>
                  )}
                </section>
              </div>

              {/* Chronology */}
              <div style={{ padding: '24px 28px', display: 'grid', gap: 32, alignContent: 'start' }}>
                <section>
                  <h3 style={h3}>
                    Sequence of events
                    {timeline.length > 0 && <span style={{ fontSize: 13, color: C.textMuted, marginLeft: 8 }}>{timeline.length}</span>}
                  </h3>
                  {timeline.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>No earlier events are linked to this alert.</p>
                  ) : (
                    <ol style={{ listStyle: 'none', margin: 0, padding: '0 0 0 18px', position: 'relative' }}>
                      <span aria-hidden="true" style={{ position: 'absolute', left: 3, top: 8, bottom: 8, width: 1, background: C.borderStrong }} />
                      {timeline.map((item, i) => {
                        const k = kindStyle(item.kind)
                        return (
                          <li key={item.id} style={{ position: 'relative', marginBottom: i < timeline.length - 1 ? 18 : 0 }}>
                            <span aria-hidden="true" style={{ position: 'absolute', left: -18, top: 6, width: 7, height: 7, borderRadius: '50%', background: k.color, boxShadow: `0 0 0 3px ${C.bg}` }} />
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: k.color, background: k.wash, borderRadius: 4, padding: '1px 7px' }}>{k.label}</span>
                              <span style={{ fontSize: 14, color: C.textPrimary }}>{item.title}</span>
                              {item.risk_delta && <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.critical }}>{item.risk_delta}</span>}
                              <span style={{ marginLeft: 'auto', fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>{formatTs(item.timestamp)}</span>
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{item.explanation}</p>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </section>

                <section>
                  <h3 style={h3}>Analyst activity</h3>
                  {auditLog.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>Nobody has acted on this alert yet.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {auditLog.map((entry) => (
                        <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                          <p style={{ margin: 0, fontSize: 14, color: C.textBody, lineHeight: 1.45 }}>{entry.message}</p>
                          <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>{timeAgo(entry.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}

        {/* Decision bar */}
        {!loading && alert && (
          <div style={{
            borderTop: `1px solid ${C.border}`, padding: '14px 28px', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: C.bg,
          }}>
            <span style={{ fontSize: 14, color: C.textMuted, marginRight: 2 }}>Was this a real threat?</span>
            {(['TP', 'FP'] as const).map((lbl) => {
              const on = alert.label === lbl
              return (
                <button
                  key={lbl}
                  className={`btn btn-sm ${on ? 'btn-ink' : 'btn-ghost'}`}
                  disabled={acting}
                  aria-pressed={on}
                  onClick={() => handleLabel(lbl)}
                >
                  {lbl === 'TP' ? 'Yes, real' : 'No, false positive'}
                </button>
              )
            })}

            <span style={{ flex: 1 }} />

            <button className="btn btn-ghost btn-sm" onClick={handleExport}>
              <Download size={13} strokeWidth={1.6} aria-hidden="true" />
              Export evidence
            </button>
            {alert.status === 'open' ? (
              <>
                <button className="btn btn-linen btn-sm" disabled={acting} onClick={handleDismiss}>Dismiss</button>
                <button className="btn btn-ink btn-sm" disabled={acting} onClick={handleResolve}>Mark resolved</button>
              </>
            ) : (
              <span style={{ fontSize: 14, color: alert.status === 'resolved' ? C.low : C.textMuted }}>
                {alert.status === 'resolved' ? 'Resolved' : 'Dismissed'}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  )
}
