'use client'

import { useCallback, useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import UserTable from '@/components/UserTable'
import SHAPChart from '@/components/SHAPChart'
import RiskBadge from '@/components/RiskBadge'
import { api, type User, type UserDetail, type UserEvent, type AuditEntry, timeAgo, normaliseIso, formatFraudType } from '@/lib/api'
import { C, FONT, riskColor, riskLevel } from '@/lib/tokens'
import PageHeader from '@/components/PageHeader'

function RiskHistoryChart({ history }: { history: { date: string; score: number }[] }) {
  if (!history.length) return null
  const h = 96
  const w = 400
  const y = (v: number) => h - (v / 100) * h
  const pts = history.map((p, i) => `${(i / Math.max(1, history.length - 1)) * w},${y(p.score)}`).join(' ')
  const last = history[history.length - 1]

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}
      role="img" aria-label={`Risk score over 30 days, now ${Math.round(last.score)}`}>
      <line x1="0" x2={w} y1={y(65)} y2={y(65)} stroke={C.critical} strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" opacity="0.6" />
      <polyline points={pts} fill="none" stroke={C.ink} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

function ActivityHeatmap({ userId }: { userId: string }) {
  const [events, setEvents] = useState<UserEvent[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
    api.userEvents(userId, new Date().toISOString(), 200)
      .then((evs) => { setEvents(evs); setLoaded(true) })
      .catch(() => { setEvents([]); setLoaded(true) })
  }, [userId])

  const hourCounts = Array(24).fill(0)
  events.forEach((ev) => {
    try {
      const hr = new Date(normaliseIso(ev.timestamp)).getHours()
      if (hr >= 0 && hr < 24) hourCounts[hr]++
    } catch {}
  })
  const maxCount = Math.max(...hourCounts, 1)

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 400, color: C.textPrimary }}>When they work</h3>
        <span style={{ fontSize: 13, color: C.textMuted }}>{loaded ? `${events.length} recent events, by hour` : 'Loading'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 3, alignItems: 'end', height: 56 }}>
        {hourCounts.map((count, hr) => (
          <div
            key={hr}
            title={`${String(hr).padStart(2, '0')}:00, ${count} event${count !== 1 ? 's' : ''}`}
            style={{
              height: count === 0 ? 3 : `${Math.max(12, (count / maxCount) * 100)}%`,
              background: count === 0 ? C.border : C.ink,
              opacity: count === 0 ? 1 : 0.35 + (count / maxCount) * 0.65,
              borderRadius: 2,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {['00', '06', '12', '18', '23'].map(t => <span key={t} style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>{t}</span>)}
      </div>
    </section>
  )
}

function UserProfilePanel({
  userId, onClose, onRestrict, onEscalate,
}: {
  userId: string
  onClose: () => void
  onRestrict: (id: string, name: string) => void
  onEscalate: (id: string, name: string) => void
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [restricted, setRestricted] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const [banner, setBanner] = useState<{ text: string; color: string } | null>(null)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])

  useEffect(() => {
    setLoading(true)
    setRestricted(false)
    setEscalated(false)
    setBanner(null)
    setAuditLog([])
    api.user(userId)
      .then((d) => {
        setDetail(d)
        setRestricted(d.restricted ?? false)
        setEscalated(d.escalated ?? false)
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
    api.auditLog({ user_id: userId, limit: 10 }).then(setAuditLog).catch(() => setAuditLog([]))
  }, [userId])

  const handleRestrict = async () => {
    if (restricted || !detail) return
    await api.restrictUser(userId).catch(() => null)
    setRestricted(true)
    setBanner({ text: `Access restricted for ${detail.name}. Active sessions were ended and the security team was notified.`, color: C.critical })
    onRestrict(userId, detail.name)
  }

  const handleEscalate = async () => {
    if (escalated || !detail) return
    await api.escalateUser(userId).catch(() => null)
    setEscalated(true)
    const ref = `ESC-${Math.floor(1000 + Math.random() * 9000)}`
    setBanner({ text: `Escalated to a senior investigator. Reference ${ref}.`, color: C.medium })
    onEscalate(userId, detail.name)
  }

  const h3 = { margin: '0 0 10px', fontSize: 16, fontWeight: 400, color: C.textPrimary } as const

  return (
    <aside
      aria-label="Person profile"
      className="panel-full panel-slide-in"
      style={{
        width: 480, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
        background: C.bg, borderLeft: `1px solid ${C.border}`,
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ padding: '14px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: C.bg, zIndex: 1 }}>
        <span style={{ fontSize: 13, color: C.textMuted }}>Profile</span>
        <button onClick={onClose} aria-label="Close profile" className="btn btn-ghost btn-sm" style={{ padding: '5px 7px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      {loading && (
        <div style={{ padding: 24, display: 'grid', gap: 12 }} aria-busy="true">
          {[180, 120, 300, 260, 220].map((w, i) => <div key={i} className="skeleton" style={{ height: 14, width: w }} />)}
        </div>
      )}

      {!loading && detail && (
        <div style={{ padding: '22px 24px 28px', display: 'grid', gap: 28 }}>
          {/* Identity + score */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 400, letterSpacing: '-0.012em', color: C.textPrimary }}>{detail.name}</h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: C.textMuted }}>
                {formatFraudType(detail.role)}, {formatFraudType(detail.department)}
              </p>
              <p style={{ margin: '6px 0 0', fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>
                {detail.id} / {detail.location} / seen {timeAgo(detail.last_seen)}
              </p>
              {(restricted || escalated) && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {restricted && <span style={{ fontSize: 12, color: C.critical, background: C.criticalWash, borderRadius: 4, padding: '1px 7px' }}>Restricted</span>}
                  {escalated && <span style={{ fontSize: 12, color: C.amber, background: C.mediumWash, borderRadius: 4, padding: '1px 7px' }}>Escalated</span>}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontSize: 54, lineHeight: 0.9, letterSpacing: '-0.03em', color: riskColor(detail.risk_score), fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(detail.risk_score)}
              </span>
              <div style={{ marginTop: 8 }}><RiskBadge level={riskLevel(detail.risk_score)} size="sm" /></div>
            </div>
          </div>

          {/* Risk history */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h3 style={h3}>Risk over 30 days</h3>
              <span style={{ fontSize: 13, color: C.textMuted }}><span style={{ color: C.critical }}>- - -</span> alert threshold 65</span>
            </div>
            <RiskHistoryChart history={detail.risk_history} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>30 days ago</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>today</span>
            </div>
          </section>

          <ActivityHeatmap userId={userId} />

          {/* Linked alerts */}
          <section>
            <h3 style={h3}>Alerts <span style={{ fontSize: 13, color: C.textMuted, marginLeft: 6 }}>{detail.recent_alerts.length}</span></h3>
            {detail.recent_alerts.length === 0 && (
              <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>No alerts for this person yet.</p>
            )}
            {detail.recent_alerts.slice(0, 4).map((alert) => (
              <div key={alert.id} style={{ padding: '10px 0', borderTop: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: '2px 12px' }}>
                <span style={{ fontSize: 14, color: C.textPrimary }}>{formatFraudType(alert.fraud_type)}</span>
                <span style={{ fontSize: 16, color: riskColor(alert.risk_score), textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.round(alert.risk_score)}</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>{timeAgo(alert.ingested_at ?? alert.timestamp)}</span>
              </div>
            ))}
          </section>

          {detail.recent_alerts[0]?.shap_values?.length > 0 && (
            <section>
              <h3 style={h3}>What drove the latest alert</h3>
              <SHAPChart values={detail.recent_alerts[0].shap_values} />
            </section>
          )}

          {auditLog.length > 0 && (
            <section>
              <h3 style={h3}>Analyst activity</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {auditLog.map((entry) => (
                  <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 14, color: C.textBody, lineHeight: 1.45 }}>{entry.message}</p>
                    <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>{timeAgo(entry.created_at)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {banner && (
            <p role="status" aria-live="polite" style={{ margin: 0, fontSize: 14, color: C.textBody, lineHeight: 1.5, borderLeft: `2px solid ${banner.color}`, paddingLeft: 12 }}>
              {banner.text}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-linen" style={{ flex: 1 }} onClick={handleEscalate} disabled={escalated}>
              {escalated ? 'Escalated' : 'Escalate to investigator'}
            </button>
            <button className="btn btn-ink" style={{ flex: 1 }} onClick={handleRestrict} disabled={restricted}>
              {restricted ? 'Access restricted' : 'Restrict access'}
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [watchlistFilter, setWatchlistFilter] = useState<'all' | 'watchlist'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [restrictedUsers, setRestrictedUsers] = useState<Set<string>>(new Set())
  const [watchlist, setWatchlist] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('sentinel_watchlist')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch {
      return new Set()
    }
  })

  const toggleWatchlist = (id: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      try {
        localStorage.setItem('sentinel_watchlist', JSON.stringify(Array.from(next)))
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }

  const fetchUsers = useCallback(async () => {
    try {
      const u = await api.users()
      setUsers(u)
    } catch {
      // backend starting up
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    const interval = setInterval(fetchUsers, 15000)
    return () => clearInterval(interval)
  }, [fetchUsers])

  // Auto-open user from ?id= param (e.g. from command palette)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (id) setSelectedUserId(id)
  }, [])

  // Sort: watchlisted first, then by risk_score descending
  const q = searchQuery.trim().toLowerCase()
  const displayedUsers = users
    .filter((u) => watchlistFilter === 'all' || watchlist.has(u.id))
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
    .sort((a, b) => {
      const aW = watchlist.has(a.id) ? 1 : 0
      const bW = watchlist.has(b.id) ? 1 : 0
      if (aW !== bW) return bW - aW
      return b.risk_score - a.risk_score
    })

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <PageHeader title="Users" description={`${users.length} people on the Bank Corp 01 network. Watched people sort to the top.`}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              const blob = new Blob([JSON.stringify(displayedUsers, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `sentineliq-users-${new Date().toISOString().slice(0, 10)}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Export as JSON
          </button>
        </PageHeader>

        <main className="page-pad" style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 40px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16" y2="16" />
              </svg>
              <input
                type="search"
                aria-label="Search people"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or ID"
                style={{
                  width: '100%', padding: '9px 12px 9px 34px',
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 4,
                  color: C.textPrimary, fontSize: 14, fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div role="tablist" aria-label="Filter people" style={{ display: 'inline-flex', background: C.hover, borderRadius: 4, padding: 3 }}>
              {(['all', 'watchlist'] as const).map((tab) => {
                const on = watchlistFilter === tab
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setWatchlistFilter(tab)}
                    style={{
                      padding: '6px 12px', fontSize: 13, fontFamily: 'inherit',
                      background: on ? C.bg : 'transparent',
                      boxShadow: on ? '0 1px 2px rgba(38,37,30,0.08)' : 'none',
                      border: 'none', color: on ? C.textPrimary : C.textMuted,
                      borderRadius: 3, cursor: 'pointer',
                    }}
                  >
                    {tab === 'all' ? 'Everyone' : `Watchlist${watchlist.size > 0 ? ` ${watchlist.size}` : ''}`}
                  </button>
                )
              })}
            </div>
          </div>

          <UserTable
            users={displayedUsers}
            loading={loading}
            onSelectUser={setSelectedUserId}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            restrictedUsers={restrictedUsers}
          />
        </main>
      </div>

      {selectedUserId && (
        <UserProfilePanel
          key={selectedUserId}
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onRestrict={(id) => setRestrictedUsers((prev) => new Set([...prev, id]))}
          onEscalate={() => {}}
        />
      )}
    </div>
  )
}
