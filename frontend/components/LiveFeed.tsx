'use client'

import { useEffect, useRef, useState } from 'react'
import { api, normaliseIso, type FeedEvent } from '@/lib/api'
import { C, FONT } from '@/lib/tokens'

const RISK_COLORS: Record<string, string> = {
  critical: C.critical,
  high: C.critical,
  medium: C.medium,
  low: C.low,
}

function FeedRow({ event, isNew, onAlertClick }: { event: FeedEvent; isNew: boolean; onAlertClick?: (id: string) => void }) {
  const color = event.risk_level ? RISK_COLORS[event.risk_level] || C.textMuted : C.textMuted
  const pulse = event.is_anomalous && (event.risk_level === 'critical' || event.risk_level === 'high')
  const clickable = !!event.alert_id && !!onAlertClick
  const time = event.timestamp ? new Date(normaliseIso(event.timestamp)).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''

  return (
    <div
      className={`${isNew ? 'animate-slide-in ' : ''}${clickable ? 'row-hover' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={() => clickable && onAlertClick!(event.alert_id!)}
      onKeyDown={(e) => { if (clickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onAlertClick!(event.alert_id!) } }}
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 10px 1fr auto',
        alignItems: 'baseline',
        gap: 12,
        padding: '10px 16px',
        borderBottom: `1px solid ${C.border}`,
        background: event.alert_id ? C.bg : 'transparent',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>{time}</span>
      <span
        className={pulse ? 'animate-pulse-dot' : ''}
        style={{ width: 7, height: 7, borderRadius: '50%', background: event.is_anomalous ? color : C.borderStrong, alignSelf: 'center' }}
      />
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, color: event.is_anomalous ? C.textPrimary : C.textBody, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.description}
        </p>
        <p style={{ margin: '2px 0 0', fontFamily: FONT.mono, fontSize: 12, color: C.textFaint }}>{event.user_id}</p>
      </div>
      {event.is_anomalous && event.risk_score !== undefined ? (
        <span style={{ fontSize: 13, color, whiteSpace: 'nowrap' }}>
          {event.alert_id ? 'Alert ' : 'Risk '}
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(event.risk_score)}</span>
        </span>
      ) : <span />}
    </div>
  )
}

export default function LiveFeed({ onAlertClick }: { onAlertClick?: (alertId: string) => void } = {}) {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const prevIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true

    const poll = async () => {
      try {
        const data = await api.feed()
        if (!mounted) return
        const incoming = new Set<string>()
        data.forEach((e) => {
          if (!prevIds.current.has(e.id)) incoming.add(e.id)
        })
        prevIds.current = new Set(data.map((e) => e.id))
        setEvents(data)
        setNewIds(incoming)
        setTimeout(() => setNewIds(new Set()), 800)
      } catch {
        // backend not ready yet - silently skip
      }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <section
      aria-label="Live event feed"
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 16, color: C.textPrimary }}>Live events</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textMuted }}>
          <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: C.low }} />
          every event scored as it arrives
        </span>
      </div>

      {events.length === 0 ? (
        <div style={{ padding: 16, display: 'grid', gap: 8 }} aria-busy="true">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 40 }} />
          ))}
        </div>
      ) : (
        <div style={{ maxHeight: 440, overflowY: 'auto' }}>
          {events.map((ev) => (
            <FeedRow key={ev.id} event={ev} isNew={newIds.has(ev.id)} onAlertClick={onAlertClick} />
          ))}
        </div>
      )}
    </section>
  )
}
