'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import StatCard from '@/components/StatCard'
import LiveFeed from '@/components/LiveFeed'
import AlertPanel from '@/components/AlertPanel'
import UserTable from '@/components/UserTable'
import { api, type Alert, type Stats, type User, formatFraudType } from '@/lib/api'
import { C, SHADOW, riskColor } from '@/lib/tokens'
import PageHeader, { LiveStatus, SectionTitle } from '@/components/PageHeader'

const _SIMULATE_SCENARIOS = [
  { label: 'Bulk data exfiltration', scenario: 'bulk_exfiltration' },
  { label: 'Privilege escalation', scenario: 'privilege_escalation' },
  { label: 'Off-hours treasury access', scenario: 'off_hours_treasury' },
  { label: 'Account record tampering', scenario: 'account_tampering' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [backendStatus, setBackendStatus] = useState<'ok' | 'initializing' | 'offline'>('ok')
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [newAlertNotif, setNewAlertNotif] = useState<Alert | null>(null)
  const prevAlertIds = useRef<Set<string>>(new Set())
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [simOpen, setSimOpen] = useState(false)
  const [simToast, setSimToast] = useState('')
  const simRef = useRef<HTMLDivElement>(null)
  const [dismissedPatterns, setDismissedPatterns] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('sentinel_dismissed_patterns')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch {
      return new Set()
    }
  })

  const fetchStats = useCallback(async () => {
    try {
      const s = await api.stats()
      setStats(s)
      setLastUpdated(new Date())
      setBackendStatus('ok')
    } catch {
      api.health()
        .then((h) => setBackendStatus(h.status === 'initializing' ? 'initializing' : 'offline'))
        .catch(() => setBackendStatus('offline'))
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.alerts({ page: 1, status: 'open', min_score: 65 })
      const incoming = res.alerts
      if (prevAlertIds.current.size > 0) {
        const fresh = incoming.filter((a) => !prevAlertIds.current.has(a.id))
        if (fresh.length > 0) {
          const top = fresh.sort((a, b) => b.risk_score - a.risk_score)[0]
          setNewAlertNotif(top)
          if (notifTimer.current) clearTimeout(notifTimer.current)
          notifTimer.current = setTimeout(() => setNewAlertNotif(null), 7000)
        }
      }
      incoming.forEach((a) => prevAlertIds.current.add(a.id))
      setAlerts(incoming)
    } catch {
      // backend starting up
    } finally {
      setAlertsLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const u = await api.users()
      setUsers(u)
    } catch {
      // backend starting up
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchAlerts()
    fetchUsers()
    const interval = setInterval(() => {
      fetchStats()
      fetchAlerts()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchStats, fetchAlerts])

  useEffect(() => {
    if (!simOpen) return
    const handler = (e: MouseEvent) => {
      if (simRef.current && !simRef.current.contains(e.target as Node)) setSimOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [simOpen])

  const activePatterns = (stats?.coordinated_patterns ?? []).filter(
    (cp) => !dismissedPatterns.has(cp.pattern)
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <PageHeader title="Overview" description="Live scoring across the monitored workforce">
          {simToast && <span role="status" style={{ fontSize: 13, color: C.textMuted }}>{simToast}</span>}
          <div ref={simRef} style={{ position: 'relative' }}>
            <button
              className="btn btn-linen btn-sm"
              aria-haspopup="menu"
              aria-expanded={simOpen}
              onClick={() => setSimOpen((o) => !o)}
            >
              Simulate an attack
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {simOpen && (
              <div role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: C.bg, borderRadius: 8, zIndex: 50, minWidth: 260, boxShadow: SHADOW.popover, padding: 6 }}>
                <p style={{ margin: 0, padding: '8px 10px 6px', fontSize: 12, color: C.textMuted }}>Inject one scored event into the live stream</p>
                {_SIMULATE_SCENARIOS.map(({ label, scenario }) => (
                  <button
                    key={scenario}
                    role="menuitem"
                    className="row-hover"
                    onClick={async () => {
                      setSimOpen(false)
                      setSimToast(`Injecting ${label.toLowerCase()}...`)
                      try {
                        await api.simulate(scenario)
                        setSimToast(`${label} injected. Watch the queue.`)
                        setTimeout(() => { fetchAlerts(); fetchStats() }, 1500)
                        setTimeout(() => { fetchAlerts(); fetchStats() }, 4000)
                      } catch {
                        setSimToast('Simulation failed. The scoring service is still starting.')
                      }
                      setTimeout(() => setSimToast(''), 8000)
                    }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 10px', fontSize: 14, color: C.textPrimary, background: 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <LiveStatus status={backendStatus} updated={lastUpdated} />
        </PageHeader>

        {/* New alert pop-up notification */}
        <AnimatePresence>
          {newAlertNotif && (
            <motion.div
              key={newAlertNotif.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ flexShrink: 0 }}
            >
              <div
                role="alert"
                style={{
                  background: C.card, padding: '10px 28px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: riskColor(newAlertNotif.risk_score), flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 14, color: C.textBody, flex: 1 }}>
                  New alert for <span style={{ color: C.textPrimary }}>{newAlertNotif.user_name}</span>, {formatFraudType(newAlertNotif.fraud_type).toLowerCase()}, scored{' '}
                  <span style={{ color: riskColor(newAlertNotif.risk_score), fontVariantNumeric: 'tabular-nums' }}>{Math.round(newAlertNotif.risk_score)}</span>
                </p>
                <button className="btn btn-ink btn-sm" onClick={() => { setSelectedAlertId(newAlertNotif.id); setNewAlertNotif(null) }}>
                  Open alert
                </button>
                <button
                  onClick={() => setNewAlertNotif(null)}
                  aria-label="Dismiss"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4, display: 'flex', flexShrink: 0 }}
                >
                  <X size={14} strokeWidth={1.6} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coordinated activity banners */}
        {dismissedPatterns.size > 0 && activePatterns.length === 0 && (
          <div style={{ padding: '6px 28px', background: C.bg, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                try { localStorage.removeItem('sentinel_dismissed_patterns') } catch {}
                setDismissedPatterns(new Set())
              }}
              style={{ fontSize: 12, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Show dismissed notices
            </button>
          </div>
        )}
        {activePatterns.length > 0 && (
          <div
            role="alert"
            style={{
              background: C.criticalWash, padding: '11px 28px', flexShrink: 0,
              display: 'flex', alignItems: 'flex-start', gap: 12,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <AlertTriangle size={15} color={C.critical} strokeWidth={1.6} style={{ flexShrink: 0, marginTop: 3 }} />
            <p style={{ margin: 0, fontSize: 14, color: C.textBody, flex: 1, lineHeight: 1.6 }}>
              <span style={{ color: C.critical }}>Coordinated activity in the {activePatterns[0].window}.</span>{' '}
              {activePatterns.map((cp, i) => (
                <span key={cp.pattern}>
                  <Link href={`/dashboard/alerts?fraud_type=${cp.pattern}`} className="link-ember">{formatFraudType(cp.pattern).toLowerCase()}</Link>
                  {' '}across {cp.users} people{i < activePatterns.length - 1 ? ', ' : '.'}
                </span>
              ))}
            </p>
            <button
              onClick={() => setDismissedPatterns((prev) => {
                const next = new Set(Array.from(prev).concat(activePatterns.map(cp => cp.pattern)))
                try { localStorage.setItem('sentinel_dismissed_patterns', JSON.stringify(Array.from(next))) } catch {}
                return next
              })}
              aria-label="Dismiss coordinated activity notice"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4, display: 'flex', flexShrink: 0 }}
            >
              <X size={14} strokeWidth={1.6} />
            </button>
          </div>
        )}

        <main className="page-pad" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Stat cards */}
          <div className="stat-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatCard
              label="People monitored"
              value={stats?.users_monitored ?? '-'}
              sub="active employees"
              loading={statsLoading}
            />
            <StatCard
              label="Alerts, last 24 hours"
              value={stats != null ? (stats.alerts_24h ?? stats.alerts_today ?? 0) : '-'}
              change={stats?.alerts_change}
              sub="vs prior 24h"
              loading={statsLoading}
              accent="red"
            />
            <StatCard
              label="High risk, open"
              value={stats?.high_risk_count ?? '-'}
              change={stats?.high_risk_change}
              sub="scored 65 or above"
              loading={statsLoading}
              accent="red"
            />
            <StatCard
              label="False positive rate"
              value={stats ? `${stats.false_positive_rate}%` : '-'}
              sub={stats ? `from ${stats.labels_collected} analyst labels` : 'from labeled alerts'}
              loading={statsLoading}
            />
          </div>

          {/* Active learning note */}
          {stats && stats.labels_collected > 0 && (
            <p style={{ margin: '-8px 0 0', fontSize: 13, color: C.textMuted }}>
              {stats.labels_collected} analyst decisions recorded for retraining. Last retrain: {stats.next_retrain_in.toLowerCase()}.{' '}
              <Link href="/dashboard/intelligence" className="link-ember">Model intelligence</Link>
            </p>
          )}

          {/* Feed + Recent alerts */}
          <div className="feed-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
            <LiveFeed onAlertClick={setSelectedAlertId} />

            <div
              style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 16, color: C.textPrimary }}>Open alerts</span>
                <Link href="/dashboard/alerts" className="link-ember" style={{ fontSize: 13 }}>Go to queue</Link>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {alertsLoading
                  ? [...Array(5)].map((_, i) => (
                      <div key={i} style={{ height: 56, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
                        <div className="skeleton" style={{ flex: 1, height: 12 }} />
                        <div className="skeleton" style={{ width: 28, height: 12 }} />
                      </div>
                    ))
                  : alerts.slice(0, 10).map((alert) => {
                      const color =
                        alert.risk_level === 'critical' || alert.risk_level === 'high'
                          ? C.critical
                          : alert.risk_level === 'medium'
                          ? C.medium
                          : C.low
                      return (
                        <div
                          key={alert.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedAlertId(alert.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedAlertId(alert.id) } }}
                          aria-label={`Alert: ${alert.user_name}, ${alert.fraud_type.replace(/_/g, ' ')}, score ${Math.round(alert.risk_score)}`}
                          className="row-hover"
                          style={{
                            padding: '11px 16px', borderBottom: `1px solid ${C.border}`,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 12,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {alert.user_name}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: C.textMuted }}>
                              {formatFraudType(alert.fraud_type)}
                            </p>
                          </div>
                          <span style={{ fontSize: 16, color, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                            {Math.round(alert.risk_score)}
                          </span>
                        </div>
                      )
                    })}
              </div>
            </div>
          </div>

          {/* Users table */}
          <div>
            <SectionTitle aside={`${users.length} people`}>Monitored employees</SectionTitle>
            <UserTable users={users} loading={usersLoading} />
          </div>
        </main>
      </div>

      <AlertPanel
        alertId={selectedAlertId}
        onClose={() => setSelectedAlertId(null)}
        onResolved={(id, newStatus) => {
          setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a))
          fetchAlerts()
        }}
      />
    </div>
  )
}
